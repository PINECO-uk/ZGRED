/**
 * Ollama LLM integration for document content generation using AI Agents.
 */

import { config } from "./config.js";
import { TaskType } from "./models.js";
import { getTeamDescriptionText } from "./team-descriptions.js";
import { getAgentByTaskType } from "./agents.js";

/**
 * Build prompt using agent configuration
 * @param {object} agent - Agent configuration
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information from coordinator
 * @param {string} teamDescription - Team description text
 * @param {object} options - Additional options (genderNote, tenseNote, etc.)
 * @returns {string} - Complete prompt
 */
function buildAgentPrompt(agent, employee, additionalInfo, teamDescription, options = {}) {
  const { genderNote = '', tenseNote = '', roleFocus = '', outputFormat = '' } = options;

  let prompt = `${agent.personality}

Wolontariusz/Praktykant: ${employee.name} ${employee.surname}
${employee.role ? `Rola: ${employee.role}` : ''}
Status: ${employee.status || 'nieznany'}
${genderNote}
${tenseNote}

Informacje z bazy danych Excel:
- Zespół: ${employee.team}
- Okres współpracy: od ${employee.startDate} do ${employee.endDate}
- Główne zadania: ${employee.mainTasks}

${teamDescription}

Dodatkowe informacje od koordynatora:
${additionalInfo}

ZASADY I WYTYCZNE:
${agent.guidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}

${roleFocus}

${agent.structureTemplate}

${outputFormat}

WZORCOWE PRZYKŁADY:
`;

  // Add examples from agent
  agent.examples.forEach((example, index) => {
    prompt += `\n--- PRZYKŁAD ${index + 1}: ${example.description} ---\n`;
    if (typeof example.output === 'string') {
      prompt += `${example.output}\n`;
    } else {
      prompt += `${JSON.stringify(example.output, null, 2)}\n`;
    }
  });

  prompt += `\n\nTERAZ WYGENERUJ ODPOWIEDŹ dla:
Osoba: ${employee.name} ${employee.surname}
Zespół: ${employee.team}
Dodatkowe informacje: ${additionalInfo}

${outputFormat ? 'Pamiętaj o zwróceniu odpowiedzi w poprawnym formacie JSON.' : ''}`;

  return prompt;
}

/**
 * Generate text using Ollama LLM
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} - Generated text
 */
async function generate(prompt) {
  try {
    console.log("[OLLAMA] Connecting to Ollama...");
    console.log(`[OLLAMA] URL: ${config.ollamaBaseUrl}`);
    console.log(`[OLLAMA] Model: ${config.ollamaModel}`);
    console.log(`[OLLAMA] Prompt length: ${prompt.length} characters`);
    console.log(`[OLLAMA] Prompt preview: ${prompt.substring(0, 200)}...`);

    // Add timeout to fetch request (600 seconds for qwen2.5:7b - larger model needs more time)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    console.log("[OLLAMA] Sending request (timeout: 600s)...");
    const startTime = Date.now();
    const request_obj = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.ollamaModel,
        prompt,
        stream: false,
        // Removed format: "json" - it causes Ollama to hang on long prompts
      }),
      signal: controller.signal,
    };

    const response = await fetch(
      `${config.ollamaBaseUrl}/api/generate`,
      request_obj
    );

    clearTimeout(timeoutId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[OLLAMA] Response received in ${duration}s`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[OLLAMA] ✗ Request failed");
      console.log(`[OLLAMA] Status: ${response.status} ${response.statusText}`);
      console.log(`[OLLAMA] Error response: ${errorText}`);
      throw new Error(
        `Ollama request failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log("[OLLAMA] ✓ Request successful");
    console.log(
      `[OLLAMA] Response length: ${result.response ? result.response.length : 0} characters`
    );
    console.log(`[OLLAMA] Raw response: ${result.response}`);

    return result.response || "";
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("[OLLAMA] ✗ Request timed out after 600 seconds");
      throw new Error("Ollama request timed out");
    }
    console.log(`[OLLAMA] ✗ Request failed: ${error.message}`);
    throw error;
  }
}

/**
 * Extract and clean JSON from LLM response
 * @param {string} response - Raw LLM response
 * @returns {object} - Parsed JSON object
 */
function extractJSON(response) {
  let cleanedResponse = response.trim();

  // Find the start of the first JSON object
  const startIdx = cleanedResponse.indexOf('{');
  if (startIdx === -1) {
    throw new Error('No JSON object found in response');
  }

  // Find the last closing brace in the response (not just the first object)
  const lastBraceIdx = cleanedResponse.lastIndexOf('}');
  if (lastBraceIdx === -1) {
    throw new Error('Incomplete JSON object in response');
  }

  // Extract the entire JSON object from first { to last }
  cleanedResponse = cleanedResponse.substring(startIdx, lastBraceIdx + 1);
  console.log("Extracted JSON object");
  console.log(`Length: ${cleanedResponse.length} chars`);

  // Remove trailing comma before closing brace (LLM sometimes adds it)
  cleanedResponse = cleanedResponse.replace(/,(\s*})$/g, '$1');

  // Try to fix common JSON errors
  // Fix unescaped quotes inside strings
  cleanedResponse = cleanedResponse.replace(/([^\\])"([^":{}\[\],]*)"([^:,}\]])/g, '$1\\"$2\\"$3');

  // Try to parse the JSON
  let parsed;
  try {
    parsed = JSON.parse(cleanedResponse);
  } catch (parseError) {
    console.log("JSON parse failed, attempting to fix...");
    console.log(`Raw JSON: ${cleanedResponse.substring(0, 500)}`);
    throw parseError;
  }

  // LLM sometimes generates duplicate keys - keep only non-empty values
  // If we see {"key": "value", "key": "", "key": ""}, we want to keep "value"
  const result = {};

  // Extract all key-value pairs manually to preserve first non-empty value
  const keyValueRegex = /"([^"]+)"\s*:\s*"([^"]*)"/g;
  let match;
  const seenKeys = new Set();

  while ((match = keyValueRegex.exec(cleanedResponse)) !== null) {
    const key = match[1];
    const value = match[2];

    // Only set the value if we haven't seen this key before, or if previous value was empty
    if (!seenKeys.has(key)) {
      result[key] = value;
      seenKeys.add(key);
    } else if (result[key] === '' && value !== '') {
      // Replace empty value with non-empty one
      result[key] = value;
    }
  }

  console.log(`Extracted keys: ${Object.keys(result).join(', ')}`);
  console.log(`Non-empty values: ${Object.values(result).filter(v => v !== '').length}`);

  return result;
}

/**
 * Generate references document content using References Agent
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information
 * @returns {Promise<object>} - Generated content
 */
export async function generateReferences(employee, additionalInfo) {
  console.log("[LLM-REF] Generating references document using AI Agent...");
  console.log(`[LLM-REF] Employee: ${employee.name} ${employee.surname}`);
  console.log(`[LLM-REF] Gender: ${employee.gender || 'unknown'}`);
  console.log(`[LLM-REF] Team: ${employee.team}`);
  console.log(
    `[LLM-REF] Additional info: ${additionalInfo ? additionalInfo.substring(0, 100) + "..." : "(none)"}`
  );

  // Get the References Agent
  const agent = getAgentByTaskType('references');
  console.log(`[LLM-REF] Using agent: ${agent.name}`);

  // Determine if employee is active
  const isActive = employee.status && employee.status.toLowerCase().includes('aktywny') && !employee.status.toLowerCase().includes('nieaktywny');

  // Determine gender-specific instructions with tense consideration
  const genderNote = employee.gender === 'K'
    ? `WAŻNE: Ta osoba jest KOBIETĄ - używaj form żeńskich ${isActive ? '(np. "wykazuje się", "współpracuje", "angażuje się")' : '(np. "wykazała się", "współpracowała", "angażowała się")'}.`
    : employee.gender === 'M'
    ? `WAŻNE: Ta osoba jest MĘŻCZYZNĄ - używaj form męskich ${isActive ? '(np. "wykazuje się", "współpracuje", "angażuje się")' : '(np. "wykazał się", "współpracował", "angażował się")'}.`
    : 'Dostosuj formy gramatyczne do płci na podstawie imienia.';

  const tenseNote = isActive
    ? 'UWAGA: Status tej osoby to AKTYWNY - używaj form TERAŹNIEJSZYCH czasowników (np. "jest odpowiedzialna", "tworzy", "uczestniczy", "pracuje").'
    : 'UWAGA: Status tej osoby to NIEAKTYWNY - używaj form PRZESZŁYCH czasowników (np. "była odpowiedzialna", "tworzyła", "uczestniczyła", "pracowała").';

  // Get team description if available
  const teamDescription = getTeamDescriptionText(employee.team);

  const outputFormat = `BARDZO WAŻNE - FORMAT ODPOWIEDZI:
Zwróć TYLKO i WYŁĄCZNIE poprawny JSON w formacie:
{"referenceText": "Akapit 1.\\n\\nAkapit 2.\\n\\nAkapit 3 (opcjonalny).\\n\\nAkapit końcowy z rekomendacją."}

Użyj \\n\\n aby oddzielić akapity (podwójny znak nowej linii).`;

  const prompt = buildAgentPrompt(agent, employee, additionalInfo, teamDescription, {
    genderNote,
    tenseNote,
    outputFormat
  });

  try {
    console.log("[LLM-REF] Calling Ollama API with agent prompt...");
    let response = await generate(prompt);

    console.log("[LLM-REF] Parsing JSON response...");
    const parsed = extractJSON(response);

    console.log(
      `[LLM-REF] ✓ Parsed successfully, referenceText length: ${parsed.referenceText ? parsed.referenceText.length : 0}`
    );

    const result = {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      referenceText: parsed.referenceText || "",
    };

    if (!result.referenceText || result.referenceText.trim() === "") {
      console.log("[LLM-REF] WARNING: referenceText is empty!");
    } else {
      console.log(
        `[LLM-REF] referenceText preview: ${result.referenceText.substring(0, 100)}...`
      );
    }

    return result;
  } catch (error) {
    console.log("[LLM-REF] ✗ Generation failed, using defaults");
    console.log(`[LLM-REF] Error: ${error.message}`);

    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      referenceText: "",
    };
  }
}

/**
 * Generate certificate content using Certificate Agent
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information
 * @returns {Promise<object>} - Generated content
 */
export async function generateCert(employee, additionalInfo) {
  console.log("[LLM-CERT] Generating certificate document using AI Agent...");
  console.log(`[LLM-CERT] Employee: ${employee.name} ${employee.surname}`);
  console.log(`[LLM-CERT] Gender: ${employee.gender || 'unknown'}`);
  console.log(`[LLM-CERT] Team: ${employee.team}`);
  console.log(
    `[LLM-CERT] Additional info: ${additionalInfo ? additionalInfo.substring(0, 100) + "..." : "(none)"}`
  );

  // Get the Certificate Agent
  const agent = getAgentByTaskType('cert');
  console.log(`[LLM-CERT] Using agent: ${agent.name}`);

  // Determine if employee is active
  const isActive = employee.status && employee.status.toLowerCase().includes('aktywny') && !employee.status.toLowerCase().includes('nieaktywny');

  // Determine gender-specific instructions with tense consideration
  const genderNote = employee.gender === 'K'
    ? `WAŻNE: Ta osoba jest KOBIETĄ - używaj form żeńskich ${isActive ? '(np. "wykazuje się", "przyczynia się", "odnosi sukces")' : '(np. "wykazała się", "przyczyniła się", "odniosła sukces")'}.`
    : employee.gender === 'M'
    ? `WAŻNE: Ta osoba jest MĘŻCZYZNĄ - używaj form męskich ${isActive ? '(np. "wykazuje się", "przyczynia się", "odnosi sukces")' : '(np. "wykazał się", "przyczynił się", "odniósł sukces")'}.`
    : 'Dostosuj formy gramatyczne do płci na podstawie imienia.';

  const tenseNote = isActive
    ? 'UWAGA: Status tej osoby to AKTYWNY - używaj form TERAŹNIEJSZYCH czasowników (np. "pomaga", "tworzy", "uczestniczy", "wykazuje się", "angażuje się").'
    : 'UWAGA: Status tej osoby to NIEAKTYWNY - używaj form PRZESZŁYCH czasowników (np. "pomagała", "tworzyła", "uczestniczyła", "wykazała się", "angażowała się").';

  // Determine role-specific focus
  const roleLower = (employee.role || '').toLowerCase();
  let roleFocus = '';
  if (roleLower.includes('praktyk') || roleLower.includes('staz')) {
    roleFocus = isActive
      ? 'W przypadku praktykantów/stażystów skup się na działaniach i tym, jak realizują zadania (formy teraźniejsze).'
      : 'W przypadku praktykantów/stażystów skup się na działaniach i tym, jak realizowali zadania (formy przeszłe).';
  } else if (roleLower.includes('wolontari')) {
    roleFocus = isActive
      ? 'W przypadku wolontariuszy skup się na ich wpływie na zespół, tym jak działają oraz jakie działania są ich głównymi (formy teraźniejsze).'
      : 'W przypadku wolontariuszy skup się na ich wpływie na zespół, tym jak działali oraz jakie działania były ich głównymi (formy przeszłe).';
  } else {
    roleFocus = isActive
      ? 'Skup się na osiągnięciach i zaangażowaniu osoby (formy teraźniejsze).'
      : 'Skup się na osiągnięciach i zaangażowaniu osoby (formy przeszłe).';
  }

  // Get team description if available
  const teamDescription = getTeamDescriptionText(employee.team);

  const outputFormat = `BARDZO WAŻNE - FORMAT ODPOWIEDZI:
Zwróć TYLKO i WYŁĄCZNIE poprawny JSON w dokładnie takim formacie (bez żadnych dodatkowych pól):
{"additionalDescription": "Pierwsze zdanie o zadaniach. Drugie zdanie o zaangażowaniu. Trzecie zdanie opcjonalne."}`;

  const prompt = buildAgentPrompt(agent, employee, additionalInfo, teamDescription, {
    genderNote,
    tenseNote,
    roleFocus,
    outputFormat
  });

  try {
    console.log("[LLM-CERT] Calling Ollama API with agent prompt...");
    let response = await generate(prompt);

    console.log("[LLM-CERT] Parsing JSON response...");
    const parsed = extractJSON(response);

    console.log(
      `[LLM-CERT] ✓ Parsed successfully, additionalDescription length: ${parsed.additionalDescription ? parsed.additionalDescription.length : 0}`
    );

    const result = {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      additionalDescription: parsed.additionalDescription || "",
    };

    if (
      !result.additionalDescription ||
      result.additionalDescription.trim() === ""
    ) {
      console.log("[LLM-CERT] WARNING: additionalDescription is empty!");
    } else {
      console.log(
        `[LLM-CERT] additionalDescription: ${result.additionalDescription}`
      );
    }

    return result;
  } catch (error) {
    console.log("[LLM-CERT] ✗ Generation failed, using defaults");
    console.log(`[LLM-CERT] Error: ${error.message}`);

    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      additionalDescription: "",
    };
  }
}

/**
 * Generate internship document content using Internship Agent
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information
 * @returns {Promise<object>} - Generated content
 */
export async function generateInternship(employee, additionalInfo) {
  console.log("[LLM-INT] Generating internship document using AI Agent...");
  console.log(`[LLM-INT] Employee: ${employee.name} ${employee.surname}`);
  console.log(`[LLM-INT] Gender: ${employee.gender || 'unknown'}`);
  console.log(`[LLM-INT] Team: ${employee.team}`);
  console.log(
    `[LLM-INT] Additional info: ${additionalInfo ? additionalInfo.substring(0, 100) + "..." : "(none)"}`
  );

  // Get the Internship Agent
  const agent = getAgentByTaskType('internship');
  console.log(`[LLM-INT] Using agent: ${agent.name}`);

  // Determine if employee is active
  const isActive = employee.status && employee.status.toLowerCase().includes('aktywny') && !employee.status.toLowerCase().includes('nieaktywny');

  // Determine gender-specific instructions with tense consideration
  const genderNote = employee.gender === 'K'
    ? `WAŻNE: Ta osoba jest KOBIETĄ - używaj form żeńskich ${isActive ? '(np. "wykonuje", "angażuje się", "odnajduje się")' : '(np. "wykonywała", "angażowała się", "odnajdywała się")'}.`
    : employee.gender === 'M'
    ? `WAŻNE: Ta osoba jest MĘŻCZYZNĄ - używaj form męskich ${isActive ? '(np. "wykonuje", "angażuje się", "odnajduje się")' : '(np. "wykonywał", "angażował się", "odnajdywał się")'}.`
    : 'Dostosuj formy gramatyczne do płci na podstawie imienia.';

  const tenseNote = isActive
    ? 'UWAGA: Status tej osoby to AKTYWNY - używaj form TERAŹNIEJSZYCH czasowników we wszystkich sekcjach.'
    : 'UWAGA: Status tej osoby to NIEAKTYWNY - używaj form PRZESZŁYCH czasowników we wszystkich sekcjach.';

  // Get team description if available
  const teamDescription = getTeamDescriptionText(employee.team);

  const outputFormat = `BARDZO WAŻNE - FORMAT ODPOWIEDZI:
Zwróć TYLKO poprawny JSON w formacie:
{
  "mainTasks": "1. Zadanie pierwsze. 2. Zadanie drugie. 3. Zadanie trzecie. 4. Zadanie czwarte.",
  "internshipDescription": "Zdanie 1. Zdanie 2. Zdanie 3. Zdanie 4.",
  "generalInformation": "Zdanie 1. Zdanie 2. Zdanie 3. Zdanie 4.",
  "evaluation": "Zdanie 1. Zdanie 2. Zdanie 3. Zdanie 4.",
  "grade": "Bardzo dobra"
}`;

  const prompt = buildAgentPrompt(agent, employee, additionalInfo, teamDescription, {
    genderNote,
    tenseNote,
    outputFormat
  });

  try {
    console.log("[LLM-INT] Calling Ollama API with agent prompt...");
    let response = await generate(prompt);

    console.log("[LLM-INT] Parsing JSON response...");
    const parsed = extractJSON(response);

    console.log("[LLM-INT] ✓ Parsed successfully");

    const result = {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: parsed.mainTasks || "",
      internshipDescription: parsed.internshipDescription || "",
      generalInformation: parsed.generalInformation || "",
      evaluation: parsed.evaluation || "",
      grade: parsed.grade || "Dobra",
    };

    console.log("[LLM-INT] Generated fields:");
    console.log(
      `[LLM-INT]   - mainTasks: ${result.mainTasks ? result.mainTasks.length + " chars" : "(empty)"}`
    );
    console.log(
      `[LLM-INT]   - internshipDescription: ${result.internshipDescription ? result.internshipDescription.length + " chars" : "(empty)"}`
    );
    console.log(
      `[LLM-INT]   - generalInformation: ${result.generalInformation ? result.generalInformation.length + " chars" : "(empty)"}`
    );
    console.log(
      `[LLM-INT]   - evaluation: ${result.evaluation ? result.evaluation.length + " chars" : "(empty)"}`
    );
    console.log(`[LLM-INT]   - grade: ${result.grade}`);

    return result;
  } catch (error) {
    console.log("[LLM-INT] ✗ Generation failed, using defaults");
    console.log(`[LLM-INT] Error: ${error.message}`);

    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: "",
      internshipDescription: "",
      generalInformation: "",
      evaluation: "",
      grade: "Dobra",
    };
  }
}

/**
 * Generate content based on task type
 * @param {string} task - Task type
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information
 * @returns {Promise<object>} - Generated content
 */
export async function generateContent(task, employee, additionalInfo) {
  const generators = {
    [TaskType.REFERENCES]: generateReferences,
    [TaskType.CERT]: generateCert,
    [TaskType.INTERNSHIP]: generateInternship,
  };

  const generator = generators[task];
  if (!generator) {
    throw new Error(`Unknown task type: ${task}`);
  }

  return generator(employee, additionalInfo);
}

export default {
  generateReferences,
  generateCert,
  generateInternship,
  generateContent,
};
