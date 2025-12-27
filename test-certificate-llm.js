/**
 * Test script for certificate LLM generation with additional info
 */

import { generateCert } from './src/llm-handler.js';
import { ensureOllama } from './src/config.js';

async function testCertificateLLM() {
  console.log('=== TEST: Certificate LLM Generation ===\n');

  // Check if Ollama is running
  console.log('Checking Ollama connection...');
  await ensureOllama();
  console.log('Ollama is ready!\n');

  // Test employee data
  const employee = {
    name: 'Jan',
    surname: 'Kowalski',
    startDate: '01.01.2024',
    endDate: '31.12.2024',
    team: 'Zespół Marketingu',
    mainTasks: 'Tworzenie postów w social media, organizacja eventów'
  };

  // Additional info from user
  const additionalInfo = `Jan był bardzo zaangażowany w projekt "Wspieraj lokalnie".
Stworzył kampanię w mediach społecznościowych, która dotarła do ponad 10 000 osób.
Wykazał się kreatywnością i samodzielnie zorganizował warsztat dla młodzieży.
Zawsze terminowo wywiązywał się z powierzonych zadań.`;

  console.log('Testing generateCert with additional info...');
  console.log('Employee:', employee.name, employee.surname);
  console.log('Team:', employee.team);
  console.log('Additional info:', additionalInfo.substring(0, 100) + '...');
  console.log('\n--- Generating certificate content ---\n');

  try {
    const result = await generateCert(employee, additionalInfo);

    console.log('\n=== RESULT ===');
    console.log('Name:', result.name);
    console.log('Surname:', result.surname);
    console.log('Start Date:', result.startDate);
    console.log('End Date:', result.endDate);
    console.log('Team:', result.team);
    console.log('Main Tasks:', result.mainTasks);
    console.log('\nGenerated Additional Description (2 sentences):');
    console.log('---');
    console.log(result.additionalDescription);
    console.log('---');

    // Count sentences
    const sentences = result.additionalDescription.split('.').filter(s => s.trim().length > 0);
    console.log('\nNumber of sentences:', sentences.length);

    if (sentences.length === 2) {
      console.log('\n✓ SUCCESS: LLM generated exactly 2 sentences as expected!');
    } else {
      console.log(`\n✗ WARNING: Expected 2 sentences, got ${sentences.length}`);
    }

  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error(error);
  }
}

// Run the test
testCertificateLLM().then(() => {
  console.log('\n=== Test completed ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
