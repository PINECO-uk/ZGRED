/**
 * Ollama LLM integration for document content generation.
 */

import { config } from "./config.js";
import { TaskType } from "./models.js";

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

    // Add timeout to fetch request (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    console.log("[OLLAMA] Sending request (timeout: 60s)...");
    const startTime = Date.now();
    const request_obj = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.ollamaModel,
        prompt,
        stream: false,
        format: "json",
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
      console.log("[OLLAMA] ✗ Request timed out after 60 seconds");
      throw new Error("Ollama request timed out");
    }
    console.log(`[OLLAMA] ✗ Request failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generate references document content
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information
 * @returns {Promise<object>} - Generated content
 */
export async function generateReferences(employee, additionalInfo) {
  console.log("[LLM-REF] Generating references document...");
  console.log(`[LLM-REF] Employee: ${employee.name} ${employee.surname}`);
  console.log(`[LLM-REF] Team: ${employee.team}`);
  console.log(
    `[LLM-REF] Additional info: ${additionalInfo ? additionalInfo.substring(0, 100) + "..." : "(none)"}`
  );

  const prompt = `Jesteś koordynatorem wolontariatu w organizacji pozarządowej LEVEL UP. Tworzysz profesjonalne referencje dla wolontariusza.

Wolontariusz: ${employee.name} ${employee.surname}

Informacje z bazy danych Excel:
- Zespół: ${employee.team}
- Okres współpracy: od ${employee.startDate} do ${employee.endDate}
- Główne zadania: ${employee.mainTasks}

Dodatkowe informacje od koordynatora:
${additionalInfo}

INSTRUKCJE:
Analizuj informacje podane przez użytkownika jak i te z dokumentów w Excelu. Wyrażaj się w pozytywnym tonie, ale NIE zmieniaj informacji podanych przez użytkownika na zawsze pozytywne. Jeśli współpraca została zakończona z powodu braku aktywności lub braku kontaktu ze strony wolontariusza - przekaż tą informację w sposób czytelny.

Na podstawie WSZYSTKICH powyższych informacji (z bazy danych Excel i dodatkowych od koordynatora), napisz JEDEN spójny, profesjonalny tekst referencji. Tekst powinien zawierać informacje o projektach, zaangażowaniu w onboarding, osiągnięciach oraz cechach charakteru wolontariusza - ale jako płynny, połączony tekst bez nagłówków i sekcji.

WAŻNE ZASADY:
- Możesz użyć imienia i nazwiska wolontariusza
- NIE powtarzaj dat ani nazwy zespołu - te informacje są już w dokumencie
- Używaj TYLKO informacji, które zostały podane
- Pisz w trzeciej osobie po polsku
- Bądź konkretny i profesjonalny
- Jeśli współpraca zakończyła się negatywnie (brak aktywności, brak kontaktu) - napisz to wprost, ale w profesjonalny sposób
- Tekst powinien mieć 8-10 zdań i być spójny

Zwróć TYLKO poprawny JSON w formacie:
{"referenceText": "Tutaj pełny tekst referencji jako jeden spójny akapit..."}`;

  try {
    console.log("[LLM-REF] Calling Ollama API...");
    const response = await generate(prompt);

    console.log("[LLM-REF] Parsing JSON response...");
    const parsed = JSON.parse(response);

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
 * Generate certificate content - adds 2 professional sentences based on additional info
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information
 * @returns {Promise<object>} - Generated content
 */
export async function generateCert(employee, additionalInfo) {
  console.log("[LLM-CERT] Generating certificate document...");
  console.log(`[LLM-CERT] Employee: ${employee.name} ${employee.surname}`);
  console.log(`[LLM-CERT] Team: ${employee.team}`);
  console.log(
    `[LLM-CERT] Additional info: ${additionalInfo ? additionalInfo.substring(0, 100) + "..." : "(none)"}`
  );

  const prompt = `Jesteś koordynatorem wolontariatu w organizacji pozarządowej LEVEL UP. Bądź profesjonalny i spokojny w tonie.

Wolontariusz: ${employee.name} ${employee.surname}

Dodatkowe informacje od koordynatora:
${additionalInfo}

Na podstawie podanych dodatkowych informacji, napisz DOKŁADNIE 2 krótkie, profesjonalne zdania po polsku, które podsumowują wkład i zaangażowanie wolontariusza.

WAŻNE ZASADY:
- Możesz użyć imienia i nazwiska wolontariusza
- NIE powtarzaj nazwy zespołu ani dat - te informacje są już w dokumencie
- NIE zmieniaj ani nie dodawaj informacji - używaj TYLKO tego, co zostało podane
- Pisz w trzeciej osobie
- Skup się na osiągnięciach i zaangażowaniu

Zwróć TYLKO poprawny JSON w formacie:
{"additionalDescription": "Tutaj dwa zdania."}`;

  try {
    console.log("[LLM-CERT] Calling Ollama API...");
    const response = await generate(prompt);

    console.log("[LLM-CERT] Parsing JSON response...");
    const parsed = JSON.parse(response);

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
 * Generate internship document content
 * @param {object} employee - Employee data
 * @param {string} additionalInfo - Additional information
 * @returns {Promise<object>} - Generated content
 */
export async function generateInternship(employee, additionalInfo) {
  console.log("[LLM-INT] Generating internship document...");
  console.log(`[LLM-INT] Employee: ${employee.name} ${employee.surname}`);
  console.log(`[LLM-INT] Team: ${employee.team}`);
  console.log(
    `[LLM-INT] Additional info: ${additionalInfo ? additionalInfo.substring(0, 100) + "..." : "(none)"}`
  );

  const prompt = `Jesteś koordynatorem praktyk/stażu w organizacji pozarządowej LEVEL UP. Tworzysz profesjonalną ocenę praktyki/stażu.

Informacje o praktykantcie/stażyście:
- Imię i nazwisko: ${employee.name} ${employee.surname}
- Data rozpoczęcia: ${employee.startDate}
- Data zakończenia: ${employee.endDate}
- Zespół: ${employee.team}
- Główne zadania: ${employee.mainTasks}

Dodatkowe informacje od koordynatora (dziennik praktyk, plan praktyk, obserwacje):
${additionalInfo}

INSTRUKCJE - WAŻNE:
Na podstawie powyższych informacji wygeneruj ocenę praktyki/stażu w formacie JSON.

1. "mainTasks" - Wypiszesz ZAWSZE dokładnie 4 główne zadania praktykanta/stażysty na podstawie informacji z dziennika lub planu praktyk. Każde zadanie jako osobne zdanie. Format: "1. Zadanie pierwsze. 2. Zadanie drugie. 3. Zadanie trzecie. 4. Zadanie czwarte."

2. "internshipDescription" - Opis praktyk: DOKŁADNIE 4 zdania. Ogólne informacje o działaniach praktykanta/stażysty podczas praktyki.

3. "generalInformation" - Ogólne informacje o działaniach: DOKŁADNIE 4 zdania. Szczegółowy opis aktywności i zaangażowania.

4. "evaluation" - Ocena: DOKŁADNIE 4 zdania. Napisz ocenę działań, w jakich zadaniach najlepiej się odnajdywał. Bądź konkretny i profesjonalny.

5. "grade" - Ocena końcowa: np. "Bardzo dobra", "Dobra", "Zadowalająca", "Celująca"

ZASADY:
- Pisz w trzeciej osobie po polsku
- Używaj TYLKO informacji, które zostały podane
- Bądź konkretny i profesjonalny
- Każda sekcja musi mieć DOKŁADNIE określoną liczbę zdań
- Nie dodawaj ani nie zmniejszaj liczby zdań

Zwróć TYLKO poprawny JSON w formacie:
{
  "mainTasks": "1. Zadanie pierwsze. 2. Zadanie drugie. 3. Zadanie trzecie. 4. Zadanie czwarte.",
  "internshipDescription": "Zdanie 1. Zdanie 2. Zdanie 3. Zdanie 4.",
  "generalInformation": "Zdanie 1. Zdanie 2. Zdanie 3. Zdanie 4.",
  "evaluation": "Zdanie 1. Zdanie 2. Zdanie 3. Zdanie 4.",
  "grade": "Bardzo dobra"
}`;

  try {
    console.log("[LLM-INT] Calling Ollama API...");
    const response = await generate(prompt);

    console.log("[LLM-INT] Parsing JSON response...");
    const parsed = JSON.parse(response);

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
