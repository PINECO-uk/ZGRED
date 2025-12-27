/**
 * Comprehensive test of ALL procedures with LLM prompts
 * Tests: cert, references, internship with different scenarios
 */

import { processTask } from './src/task-processor.js';
import { existsSync } from 'fs';

const testCases = [
  // CERTIFICATES
  {
    name: 'CERT-1: Active Female Volunteer',
    task: 'cert',
    employee: { name: 'Ola', surname: 'Kowalska' },
    additionalInfo: 'Ola wykazała się dużym zaangażowaniem w tłumaczeniach. Współpracowała przy tłumaczeniu materiałów promocyjnych i dokumentacji projektowej.',
    expectations: ['Pani Ola', 'forma żeńska', 'czas teraźniejszy', 'Translation Masters'],
  },
  {
    name: 'CERT-2: Inactive Male Volunteer',
    task: 'cert',
    employee: { name: 'Paweł', surname: 'Kaczmarek' },
    additionalInfo: 'Paweł zajmował się tłumaczeniami tekstów z języka angielskiego. Wykonywał zadania z dużą starannością.',
    expectations: ['Pan Paweł', 'forma męska', 'czas przeszły', 'Translation Masters'],
  },
  {
    name: 'CERT-3: Active Male Praktykant',
    task: 'cert',
    employee: { name: 'Mikolaj', surname: 'Dabrowski' },
    additionalInfo: 'Mikołaj realizował praktyki w zespole Translation Masters. Zajmował się tłumaczeniami i korektą tekstów.',
    expectations: ['Pan Mikołaj', 'forma męska', 'czas teraźniejszy', 'praktyki zdalnych'],
  },
  {
    name: 'CERT-4: Active Male Praktykant - Blog Team',
    task: 'cert',
    employee: { name: 'Adam', surname: 'Kaczmarek' },
    additionalInfo: 'Adam tworzył artykuły blogowe zgodnie z zasadami SEO. Wykazał się kreatywnością w pisaniu treści.',
    expectations: ['Pan Adam', 'forma męska', 'Blog and Content Masters', 'praktyki zdalnych'],
  },

  // REFERENCES
  {
    name: 'REF-1: Active Female Volunteer',
    task: 'references',
    employee: { name: 'Ola', surname: 'Kowalska' },
    additionalInfo: 'Ola jest bardzo zaangażowana w tłumaczenia. Współpracuje przy projektach międzynarodowych. Wykazuje się dużą inicjatywą i samodzielnością. Jest cennym członkiem zespołu.',
    expectations: ['3-4 akapity', 'Pani Ola', 'forma żeńska', 'szczegółowy opis'],
  },
  {
    name: 'REF-2: Inactive Male Volunteer',
    task: 'references',
    employee: { name: 'Paweł', surname: 'Kaczmarek' },
    additionalInfo: 'Paweł był zaangażowany w tłumaczenia dokumentów. Współpracował bardzo dobrze z zespołem. Wykonywał zadania terminowo i z dużą starannością.',
    expectations: ['3-4 akapity', 'Pan Paweł', 'forma męska', 'czas przeszły'],
  },

  // INTERNSHIP EVALUATIONS
  {
    name: 'INT-1: Active Female Praktykant',
    task: 'internship',
    employee: { name: 'Ola', surname: 'Kowalska' },
    additionalInfo: 'Ola realizuje praktyki w zespole Translation Masters. Zajmuje się tłumaczeniami i korektą tekstów. Wykazuje się dużą samodzielnością. Ocena: bardzo dobra.',
    expectations: ['opis praktyk', 'ocena', 'forma żeńska', 'czas teraźniejszy'],
  },
  {
    name: 'INT-2: Active Male Praktykant',
    task: 'internship',
    employee: { name: 'Mikolaj', surname: 'Dabrowski' },
    additionalInfo: 'Mikołaj realizuje praktyki w zespole tłumaczeń. Zajmuje się przekładami tekstów technicznych. Wykazuje się dokładnością i terminowością. Ocena: dobra.',
    expectations: ['opis praktyk', 'ocena', 'forma męska', 'czas teraźniejszy'],
  },
  {
    name: 'INT-3: Active Male Praktykant - Blog',
    task: 'internship',
    employee: { name: 'Adam', surname: 'Kaczmarek' },
    additionalInfo: 'Adam tworzy artykuły blogowe i współpracuje z zespołem marketingowym. Wykazuje się kreatywnością w pisaniu. Realizuje zadania zgodnie z harmonogramem. Ocena: bardzo dobra.',
    expectations: ['Blog and Content Masters', 'tworzenie artykułów', 'SEO', 'ocena'],
  },
];

console.log('='.repeat(80));
console.log('KOMPLEKSOWY TEST WSZYSTKICH PROCEDUR I PROMPTÓW');
console.log('='.repeat(80));
console.log(`Testowanie ${testCases.length} scenariuszy z LLM:\n`);

async function runAllTests() {
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n[${ i + 1}/${testCases.length}] ${testCase.name}`);
    console.log('-'.repeat(80));

    const startTime = Date.now();

    try {
      const result = await processTask({
        task: testCase.task,
        name: testCase.employee.name,
        surname: testCase.employee.surname,
        additionalInfo: testCase.additionalInfo,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (result.success && existsSync(result.outputPath)) {
        console.log(`✓ SUCCESS (${duration}s)`);
        console.log(`  → PDF: ${result.outputPath.split('/').pop()}`);

        // Show what was generated
        if (testCase.task === 'cert' && result.data?.additionalDescription) {
          console.log(`  → LLM Generated (${result.data.additionalDescription.length} chars):`);
          console.log(`     "${result.data.additionalDescription.substring(0, 100)}..."`);
        } else if (testCase.task === 'references' && result.data?.referenceText) {
          console.log(`  → LLM Generated (${result.data.referenceText.length} chars):`);
          console.log(`     "${result.data.referenceText.substring(0, 100)}..."`);
        } else if (testCase.task === 'internship') {
          console.log(`  → Internship document generated`);
        }

        console.log(`  → Expectations: ${testCase.expectations.join(', ')}`);
        successCount++;
        results.push({ test: testCase.name, status: 'SUCCESS', duration, path: result.outputPath });
      } else {
        console.log(`✗ FAILED`);
        console.log(`  → Error: ${result.error || 'Unknown error'}`);
        failureCount++;
        results.push({ test: testCase.name, status: 'FAILED', error: result.error });
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✗ ERROR (${duration}s)`);
      console.log(`  → ${error.message}`);
      failureCount++;
      results.push({ test: testCase.name, status: 'ERROR', error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('PODSUMOWANIE TESTÓW');
  console.log('='.repeat(80));
  console.log(`Łącznie testów: ${testCases.length}`);
  console.log(`✓ Sukces: ${successCount}`);
  console.log(`✗ Niepowodzenie: ${failureCount}`);
  console.log(`Procent sukcesu: ${((successCount / testCases.length) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n' + '='.repeat(80));
  console.log('SZCZEGÓŁOWE WYNIKI');
  console.log('='.repeat(80));

  const certTests = results.filter(r => r.test.startsWith('CERT'));
  const refTests = results.filter(r => r.test.startsWith('REF'));
  const intTests = results.filter(r => r.test.startsWith('INT'));

  console.log(`\nCERTIFICATES (${certTests.length}):`);
  certTests.forEach(r => {
    const icon = r.status === 'SUCCESS' ? '✓' : '✗';
    console.log(`  ${icon} ${r.test}`);
    if (r.path) console.log(`     → ${r.path}`);
  });

  console.log(`\nREFERENCES (${refTests.length}):`);
  refTests.forEach(r => {
    const icon = r.status === 'SUCCESS' ? '✓' : '✗';
    console.log(`  ${icon} ${r.test}`);
    if (r.path) console.log(`     → ${r.path}`);
  });

  console.log(`\nINTERNSHIP EVALUATIONS (${intTests.length}):`);
  intTests.forEach(r => {
    const icon = r.status === 'SUCCESS' ? '✓' : '✗';
    console.log(`  ${icon} ${r.test}`);
    if (r.path) console.log(`     → ${r.path}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('WERYFIKACJA MANUALNA');
  console.log('='.repeat(80));
  console.log(`
Sprawdź wygenerowane PDFy pod kątem:

1. FORMY GRAMATYCZNE (płeć):
   - Kobieta: była, wykazała się, współpracowała, Pani [Imię]
   - Mężczyzna: był, wykazał się, współpracował, Pan [Imię]

2. CZAS CZASOWNIKÓW (status):
   - Aktywny: jest, współpracuje, wykazuje się (teraźniejszy)
   - Nieaktywny: była/był, współpracowała/współpracował (przeszły)

3. TYP PROGRAMU (rola):
   - Wolontariat: "program e-wolontariatu"
   - Praktyki: "program praktyk zdalnych"

4. OPISY ZESPOŁÓW:
   - Czy LLM wykorzystał opisy zespołów z opisy-zespoly.json?
   - Czy treść jest spójna z działaniami zespołu?

5. STRUKTURA DOKUMENTÓW:
   - Certyfikaty: 2-3 zdania od LLM + część stała
   - Referencje: 3-4 akapity, szczegółowe
   - Oceny praktyk: wszystkie sekcje wypełnione
`);

  return results;
}

runAllTests()
  .then(() => {
    console.log('Wszystkie testy zakończone.\n');
  })
  .catch((error) => {
    console.error('Błąd testów:', error);
    process.exit(1);
  });
