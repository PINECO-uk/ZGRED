/**
 * Quick test with Gemma 3:12b model
 */

import { generateCert } from './src/llm-handler.js';
import { config } from './src/config.js';

console.log('=======================================================');
console.log('  QUICK TEST - GEMMA 3:12B MODEL');
console.log('=======================================================\n');

console.log(`Model: ${config.ollamaModel}`);
console.log(`URL: ${config.ollamaBaseUrl}\n`);

const testEmployee = {
  name: 'Anna',
  surname: 'Testowa',
  team: 'Marketing Masters',
  startDate: '2024-01-15',
  endDate: '2024-12-20',
  mainTasks: 'Tworzenie treści social media, współpraca z grafikami',
  gender: 'K',
  status: 'nieaktywny',
  role: 'wolontariusz'
};

const additionalInfo = 'Anna była zaangażowaną wolontariuszką, pomagała w kampaniach marketingowych i tworzeniu contentu. Wykazała się kreatywnością i profesjonalizmem.';

console.log('Testuję Agent Zaświadczeń (krótki dokument)...\n');

const startTime = Date.now();

generateCert(testEmployee, additionalInfo)
  .then(result => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('  WYNIK TESTU');
    console.log('='.repeat(60));
    console.log(`\nCzas generowania: ${duration}s`);
    console.log('\nWygenerowany tekst:');
    console.log(result.additionalDescription || '(pusty)');
    console.log('\n' + '='.repeat(60));

    // Sprawdź polskie znaki
    const hasPolishChars = /[ąćęłńóśźż]/i.test(result.additionalDescription);
    console.log(`\nPolskie znaki: ${hasPolishChars ? '✅ Obecne' : '⚠️ Brak lub problemy'}`);
    console.log(`Długość: ${result.additionalDescription?.length || 0} znaków`);

    if (hasPolishChars) {
      console.log('\n🎉 Model działa poprawnie z językiem polskim!');
    } else {
      console.log('\n⚠️ Model może mieć problemy z polskimi znakami');
    }
  })
  .catch(error => {
    console.error('\n❌ Błąd:', error.message);
    console.error(error);
  });
