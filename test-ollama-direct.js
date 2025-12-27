/**
 * Direct Ollama API test
 */

const prompt = `Jesteś profesjonalnym koordynatorem HR.

Wolontariusz: Ola Pietrzak
Dodatkowe informacje: Ola była bardzo zaangażowana w zespole.

Wygeneruj JSON z jednym polem "additionalDescription" (1-2 zdania o zaangażowaniu).
Format odpowiedzi (TYLKO JSON, bez dodatkowego tekstu):
{"additionalDescription": "tekst tutaj"}`;

console.log('Testing Ollama API directly...');
console.log('Prompt length:', prompt.length, 'chars');
console.log('\nSending request...');

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000);

const startTime = Date.now();

fetch('http://host.docker.internal:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2:3b',
    prompt,
    stream: false,
    format: 'json',
  }),
  signal: controller.signal,
})
  .then((response) => {
    clearTimeout(timeout);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Response received in ${duration}s`);
    return response.json();
  })
  .then((data) => {
    console.log('\nSuccess!');
    console.log('Response:', data.response);
    console.log('\nDuration:', data.total_duration / 1000000000, 's');
  })
  .catch((error) => {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.log('\n✗ Request timed out after 60s');
    } else {
      console.log('\n✗ Error:', error.message);
    }
  });
