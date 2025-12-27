/**
 * Interactive test for certificate generation with additional info
 */

import { generateCert } from './src/llm-handler.js';
import { ensureOllama } from './src/config.js';

async function testInteractiveCertificate() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   TEST: Generowanie Zaświadczenia z Dodatkowymi Informacjami  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Check if Ollama is running
  await ensureOllama();

  // Example scenarios
  const testCases = [
    {
      name: 'Test 1: Bardzo zaangażowany wolontariusz',
      employee: {
        name: 'Anna',
        surname: 'Nowak',
        startDate: '15.03.2024',
        endDate: '15.12.2024',
        team: 'Zespół Eventowy',
        mainTasks: 'Organizacja wydarzeń, koordynacja wolontariuszy'
      },
      additionalInfo: `Anna wykazała się wyjątkowym zaangażowaniem podczas organizacji Festiwalu Młodych Talentów.
Samodzielnie skoordynowała pracę 30 wolontariuszy i zapewniła sprawny przebieg wydarzenia.
Jej kreatywne pomysły przyczyniły się do zwiększenia frekwencji o 40%.
Otrzymała wiele pozytywnych opinii od uczestników i innych członków zespołu.`
    },
    {
      name: 'Test 2: Wolontariusz z konkretnymi osiągnięciami',
      employee: {
        name: 'Tomasz',
        surname: 'Kowalczyk',
        startDate: '01.06.2024',
        endDate: '30.11.2024',
        team: 'Zespół IT',
        mainTasks: 'Wsparcie techniczne, administracja systemów'
      },
      additionalInfo: `Tomasz przeprowadził migrację całej infrastruktury IT do chmury.
Wdrożył system automatycznych kopii zapasowych, co zwiększyło bezpieczeństwo danych organizacji.
Przeprowadził 5 szkoleń dla pracowników z zakresu cyberbezpieczeństwa.`
    },
    {
      name: 'Test 3: Nowy wolontariusz z potencjałem',
      employee: {
        name: 'Katarzyna',
        surname: 'Wiśniewska',
        startDate: '01.09.2024',
        endDate: '31.12.2024',
        team: 'Zespół Social Media',
        mainTasks: 'Tworzenie treści, grafika, zarządzanie Instagram'
      },
      additionalInfo: `Katarzyna szybko odnalazła się w zespole i przejęła odpowiedzialność za profil Instagram.
Dzięki jej pracy liczba obserwujących wzrosła o 25%, a zaangażowanie użytkowników podwoiło się.`
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${testCase.name}`);
    console.log('='.repeat(70));

    console.log('\n📋 DANE WOLONTARIUSZA:');
    console.log(`   Imię i nazwisko: ${testCase.employee.name} ${testCase.employee.surname}`);
    console.log(`   Zespół: ${testCase.employee.team}`);
    console.log(`   Okres: ${testCase.employee.startDate} - ${testCase.employee.endDate}`);

    console.log('\n📝 DODATKOWE INFORMACJE OD UŻYTKOWNIKA:');
    console.log('   ' + testCase.additionalInfo.split('\n').join('\n   '));

    console.log('\n🤖 GENEROWANIE OPISU LLM...\n');

    try {
      const result = await generateCert(testCase.employee, testCase.additionalInfo);

      console.log('✅ WYGENEROWANY OPIS (2 zdania):');
      console.log('┌' + '─'.repeat(68) + '┐');

      // Split into sentences for better display
      const sentences = result.additionalDescription.split('. ').filter(s => s.trim());
      sentences.forEach((sentence, idx) => {
        const text = sentence.trim().endsWith('.') ? sentence.trim() : sentence.trim() + '.';
        // Word wrap at 65 characters
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
        if (idx < sentences.length - 1) console.log('│' + ' '.repeat(68) + '│');
      });

      console.log('└' + '─'.repeat(68) + '┘');

      // Validate
      const sentenceCount = result.additionalDescription.split('.').filter(s => s.trim().length > 0).length;
      if (sentenceCount === 2) {
        console.log('\n✓ Poprawnie: wygenerowano dokładnie 2 zdania');
      } else {
        console.log(`\n⚠ Uwaga: oczekiwano 2 zdania, otrzymano ${sentenceCount}`);
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
testInteractiveCertificate().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Błąd krytyczny:', err);
  process.exit(1);
});
