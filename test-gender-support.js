/**
 * Test script for gender-aware LLM generation
 */

import { findEmployee } from './src/excel-handler.js';
import { generateCert } from './src/llm-handler.js';
import { ensureOllama } from './src/config.js';

async function testGenderSupport() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       TEST: Wsparcie Płci w Generowaniu Dokumentów           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Check if Ollama is running
  await ensureOllama();

  // Test cases - find real people from Excel
  const testCases = [
    {
      name: 'Test 1: Kobieta z Excela',
      firstName: 'Anna',
      lastName: 'Pietrzak',
      additionalInfo: `Anna aktywnie uczestniczyła w projektach marketingowych.
Samodzielnie przygotowała 20 postów na social media.
Jej zaangażowanie było wzorowe i inspirujące dla innych.`
    },
    {
      name: 'Test 2: Sprawdzenie innej kobiety',
      firstName: 'Maria',
      lastName: 'Wojcik',
      additionalInfo: `Maria koordynowała pracę zespołu podczas dużego wydarzenia.
Zorganizowała warsztaty dla 50 uczestników.
Wykazała się świetną organizacją i komunikacją.`
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${testCase.name}`);
    console.log('='.repeat(70));

    console.log('\n🔍 POBIERANIE DANYCH Z EXCELA...');
    const employee = findEmployee(testCase.firstName, testCase.lastName);

    if (!employee) {
      console.log(`❌ Nie znaleziono: ${testCase.firstName} ${testCase.lastName}`);
      continue;
    }

    console.log('\n📋 DANE Z EXCELA:');
    console.log(`   Imię i nazwisko: ${employee.name} ${employee.surname}`);
    console.log(`   Płeć: ${employee.gender === 'K' ? 'Kobieta (K)' : employee.gender === 'M' ? 'Mężczyzna (M)' : 'Nie określono'}`);
    console.log(`   Zespół: ${employee.team}`);
    console.log(`   Okres: ${employee.startDate} - ${employee.endDate}`);
    console.log(`   Zadania: ${employee.mainTasks}`);

    console.log('\n📝 DODATKOWE INFORMACJE:');
    console.log('   ' + testCase.additionalInfo.split('\n').join('\n   '));

    console.log('\n🤖 GENEROWANIE OPISU Z UWZGLĘDNIENIEM PŁCI...\n');

    try {
      const result = await generateCert(employee, testCase.additionalInfo);

      console.log('✅ WYGENEROWANY OPIS:');
      console.log('┌' + '─'.repeat(68) + '┐');

      const text = result.additionalDescription;
      const words = text.split(' ');
      let line = '';
      words.forEach(word => {
        if ((line + word).length > 65) {
          console.log(`│ ${line.padEnd(66)} │`);
          line = word + ' ';
        } else {
          line += word + ' ';
        }
      });
      if (line.trim()) {
        console.log(`│ ${line.trim().padEnd(66)} │`);
      }

      console.log('└' + '─'.repeat(68) + '┘');

      // Check for gender-appropriate forms
      const textLower = text.toLowerCase();
      const hasFemaleForm = textLower.includes('wykazała') ||
                           textLower.includes('przyczyniła') ||
                           textLower.includes('odniosła') ||
                           textLower.includes('zorganizowała') ||
                           textLower.includes('uczestniczyła') ||
                           textLower.includes('przygotowała');

      const hasMaleForm = textLower.includes('wykazał') ||
                         textLower.includes('przyczynił') ||
                         textLower.includes('odniósł') ||
                         textLower.includes('zorganizował') ||
                         textLower.includes('uczestniczył') ||
                         textLower.includes('przygotował');

      console.log('\n📊 ANALIZA FORM GRAMATYCZNYCH:');
      if (employee.gender === 'K') {
        if (hasFemaleForm && !hasMaleForm) {
          console.log('   ✓ Poprawnie: wykryto formy żeńskie');
        } else if (hasMaleForm) {
          console.log('   ✗ Błąd: wykryto formy męskie dla kobiety!');
        } else {
          console.log('   ⚠ Uwaga: nie wykryto typowych form czasownikowych');
        }
      } else if (employee.gender === 'M') {
        if (hasMaleForm && !hasFemaleForm) {
          console.log('   ✓ Poprawnie: wykryto formy męskie');
        } else if (hasFemaleForm) {
          console.log('   ✗ Błąd: wykryto formy żeńskie dla mężczyzny!');
        } else {
          console.log('   ⚠ Uwaga: nie wykryto typowych form czasownikowych');
        }
      }

    } catch (error) {
      console.log(`\n❌ BŁĄD: ${error.message}`);
    }

    if (i < testCases.length - 1) {
      console.log('\n⏳ Czekam 2 sekundy przed kolejnym testem...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 WSZYSTKIE TESTY ZAKOŃCZONE');
  console.log('='.repeat(70));
}

// Run the test
testGenderSupport().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Błąd krytyczny:', err);
  process.exit(1);
});
