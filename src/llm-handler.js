/**
 * Ollama LLM integration for document content generation.
 */

import { config } from './config.js';
import { TaskType } from './models.js';

/**
 * Generate text using Ollama LLM
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} - Generated text
 */
async function generate(prompt) {
  try {
    console.log(`Connecting to Ollama at: ${config.ollamaBaseUrl}`);
    const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollamaModel,
        prompt,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Ollama raw response:', result.response);
    return result.response || '';
  } catch (error) {
    console.error('Ollama request failed:', error.message);
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
  const prompt = `Jesteś koordynatorem wolontariatu w organizacji pozarządowej LEVEL UP. Tworzysz profesjonalne referencje dla wolontariusza. Bądź profesjonalny i spokojny w tonie.

Wolontariusz: ${employee.name} ${employee.surname}

Informacje z bazy danych:
- Zespół: ${employee.team}
- Okres współpracy: od ${employee.startDate} do ${employee.endDate}
- Główne zadania: ${employee.mainTasks}

Dodatkowe informacje od koordynatora:
${additionalInfo}

Na podstawie WSZYSTKICH powyższych informacji (z bazy danych i dodatkowych), napisz JEDEN spójny, profesjonalny tekst referencji. Tekst powinien zawierać informacje o projektach, zaangażowaniu w onboarding, osiągnięciach oraz cechach charakteru wolontariusza - ale jako płynny, połączony tekst bez nagłówków i sekcji.

WAŻNE ZASADY:
- Możesz użyć imienia i nazwiska wolontariusza
- NIE powtarzaj dat ani nazwy zespołu - te informacje są już w dokumencie
- Używaj TYLKO informacji, które zostały podane
- Pisz w trzeciej osobie po polsku
- Bądź konkretny i profesjonalny
- Tekst powinien mieć 8-10 zdań i być spójny

Zwróć TYLKO poprawny JSON w formacie:
{"referenceText": "Tutaj pełny tekst referencji jako jeden spójny akapit..."}`;

  try {
    const response = await generate(prompt);
    console.log('Parsing Ollama response for references:', response);
    const parsed = JSON.parse(response);

    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      referenceText: parsed.referenceText || '',
    };
  } catch (error) {
    console.warn('LLM generation failed, using defaults:', error.message);
    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      referenceText: '',
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
    const response = await generate(prompt);
    console.log('Parsing Ollama response for cert:', response);
    const parsed = JSON.parse(response);
    console.log('Parsed additionalDescription:', parsed.additionalDescription);

    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      additionalDescription: parsed.additionalDescription || '',
    };
  } catch (error) {
    console.warn('LLM generation failed, using defaults:', error.message);
    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      additionalDescription: '',
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
  const prompt = `You are a professional leader and internship supervisor. Based on the given information, provide a comprehensive evaluation for an internship document.

Intern Information:
- Name: ${employee.name}
- Surname: ${employee.surname}
- Start Date: ${employee.startDate}
- End Date: ${employee.endDate}
- Team: ${employee.team}
- Main Tasks: ${employee.mainTasks}

Additional Information (including university requirements):
${additionalInfo}

Based on this information, generate a JSON object with the following fields:
- "mainProjects": main projects the person was involved in
- "onboardingEngagement": engagement in the onboarding process
- "achievements": key achievements during the internship
- "characteristics": main characteristics that describe them as a collaborator
- "requirementsComparison": comparison of performance with university requirements
- "grade": overall internship grade (e.g., "Excellent", "Very Good", "Good", "Satisfactory")

Return ONLY valid JSON.`;

  try {
    const response = await generate(prompt);
    const parsed = JSON.parse(response);

    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      mainProjects: parsed.mainProjects || '',
      onboardingEngagement: parsed.onboardingEngagement || '',
      achievements: parsed.achievements || '',
      characteristics: parsed.characteristics || '',
      requirementsComparison: parsed.requirementsComparison || '',
      grade: parsed.grade || 'Good',
    };
  } catch (error) {
    console.warn('LLM generation failed, using defaults:', error.message);
    return {
      name: employee.name,
      surname: employee.surname,
      startDate: employee.startDate,
      endDate: employee.endDate,
      team: employee.team,
      mainTasks: employee.mainTasks,
      mainProjects: additionalInfo || 'Various projects',
      onboardingEngagement: 'Active participant',
      achievements: 'Completed all assigned tasks',
      characteristics: 'Dedicated intern',
      requirementsComparison: 'Met all requirements',
      grade: 'Good',
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

export default { generateReferences, generateCert, generateInternship, generateContent };
