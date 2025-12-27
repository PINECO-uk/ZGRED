/**
 * Test PDF generation with Excel data only (no LLM)
 * This tests: team descriptions, gender forms, status-based tense, role differentiation
 */

import { processTask } from './src/task-processor.js';
import { existsSync } from 'fs';

const testCases = [
  {
    name: 'Test 1: Active Female Volunteer (Zaświadczenie)',
    task: 'cert',
    employee: { name: 'Ola', surname: 'Pietrzak' },
    additionalInfo: '', // No LLM - test only fixed text
    expected: {
      gender: 'K',
      status: 'aktywny',
      team: 'Events and External Trainings Masters',
      tense: 'present',
      forms: ['jest aktywną członkinią', 'współpracuje'],
    },
  },
  {
    name: 'Test 2: Inactive Male Volunteer (Zaświadczenie)',
    task: 'cert',
    employee: { name: 'Tomasz', surname: 'Kaczmarek' },
    additionalInfo: '',
    expected: {
      gender: 'M',
      status: 'zakończona współpraca',
      team: 'Graphic Masters',
      tense: 'past',
      forms: ['był aktywnym członkiem', 'współpracował'],
    },
  },
  {
    name: 'Test 3: Active Female Praktykant (Zaświadczenie)',
    task: 'cert',
    employee: { name: 'Ola', surname: 'Kowalski' },
    additionalInfo: '',
    expected: {
      gender: 'K',
      status: 'aktywny',
      team: 'Web Masters',
      role: 'praktyki',
      tense: 'present',
      forms: ['współpracuje', 'Jest członkinią', 'program praktyk zdalnych'],
    },
  },
  {
    name: 'Test 4: Inactive Male Praktykant (Zaświadczenie)',
    task: 'cert',
    employee: { name: 'Kamil', surname: 'Zielinska' },
    additionalInfo: '',
    expected: {
      gender: 'M',
      status: 'zakończona współpraca',
      team: 'Marketing Masters',
      role: 'praktyki',
      tense: 'past',
      forms: ['współpracował', 'Dołączył', 'program praktyk zdalnych'],
    },
  },
  {
    name: 'Test 5: Active Female Volunteer (Referencje)',
    task: 'references',
    employee: { name: 'Ola', surname: 'Pietrzak' },
    additionalInfo: '',
    expected: {
      gender: 'K',
      status: 'aktywny',
      team: 'Events and External Trainings Masters',
    },
  },
  {
    name: 'Test 6: Inactive Male Volunteer (Referencje)',
    task: 'references',
    employee: { name: 'Tomasz', surname: 'Kaczmarek' },
    additionalInfo: '',
    expected: {
      gender: 'M',
      status: 'zakończona współpraca',
      team: 'Graphic Masters',
    },
  },
  {
    name: 'Test 7: Active Female Praktykant (Ocena praktyk)',
    task: 'internship',
    employee: { name: 'Ola', surname: 'Kowalski' },
    additionalInfo: '',
    expected: {
      gender: 'K',
      status: 'aktywny',
      team: 'Web Masters',
      role: 'praktyki',
    },
  },
  {
    name: 'Test 8: Inactive Male Praktykant (Ocena praktyk)',
    task: 'internship',
    employee: { name: 'Kamil', surname: 'Zielinska' },
    additionalInfo: '',
    expected: {
      gender: 'M',
      status: 'zakończona współpraca',
      team: 'Marketing Masters',
      role: 'praktyki',
    },
  },
];

console.log('='.repeat(80));
console.log('PDF GENERATION TEST - ZGRED (Excel Data Only, No LLM)');
console.log('='.repeat(80));
console.log(`Testing ${testCases.length} scenarios:\n`);

async function runTests() {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n[${i + 1}/${testCases.length}] ${testCase.name}`);

    try {
      const result = await processTask({
        task: testCase.task,
        name: testCase.employee.name,
        surname: testCase.employee.surname,
        additionalInfo: testCase.additionalInfo,
      });

      if (result.success) {
        console.log(`  ✓ PDF generated: ${result.outputPath.split('/').pop()}`);

        if (existsSync(result.outputPath)) {
          console.log(`  ✓ File exists on disk`);

          // Show expected values for manual verification
          console.log(`  → Expected gender: ${testCase.expected.gender}`);
          console.log(`  → Expected status: ${testCase.expected.status}`);
          console.log(`  → Expected team: ${testCase.expected.team}`);
          if (testCase.expected.tense) {
            console.log(`  → Expected tense: ${testCase.expected.tense}`);
          }
          if (testCase.expected.forms) {
            console.log(`  → Expected forms: ${testCase.expected.forms.join(', ')}`);
          }

          results.push({ test: testCase.name, status: 'SUCCESS', path: result.outputPath });
        } else {
          console.log(`  ✗ File NOT found`);
          results.push({ test: testCase.name, status: 'FAILED', error: 'File not found' });
        }
      } else {
        console.log(`  ✗ Generation failed: ${result.error}`);
        results.push({ test: testCase.name, status: 'FAILED', error: result.error });
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      results.push({ test: testCase.name, status: 'ERROR', error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter((r) => r.status === 'SUCCESS').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const errors = results.filter((r) => r.status === 'ERROR').length;

  console.log(`Total: ${results.length} | ✓ Success: ${successful} | ✗ Failed: ${failed} | ✗ Errors: ${errors}`);

  if (successful > 0) {
    console.log('\n✓ SUCCESSFUL TESTS:');
    results
      .filter((r) => r.status === 'SUCCESS')
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.test}`);
        console.log(`     → ${r.path}`);
      });
  }

  if (failed > 0 || errors > 0) {
    console.log('\n✗ FAILED/ERROR TESTS:');
    results
      .filter((r) => r.status !== 'SUCCESS')
      .forEach((r) => {
        console.log(`  - ${r.test}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(80));
  console.log('MANUAL VERIFICATION CHECKLIST');
  console.log('='.repeat(80));
  console.log(`
1. GENDER FORMS (in fixed certificate text):
   Female: była, działała, jest aktywną członkinią, dołączyła, współpracowała
   Male: był, działał, jest aktywnym członkiem, dołączył, współpracował

2. TENSE (based on status in fixed certificate text):
   Active: present tense (jest, współpracuje, Jest członkinią/członkiem)
   Inactive: past tense (była/był, współpracowała/współpracował, Dołączyła/Dołączył)

3. ROLE DISTINCTION (in fixed certificate text):
   Wolontariat: "program e-wolontariatu" + "jest członkinią/członkiem grupy"
   Praktyki: "program praktyk zdalnych" + "Jest członkinią/członkiem grupy"

4. Check all PDFs manually to verify the above features are correctly applied.
`);

  return results;
}

runTests()
  .then(() => {
    console.log('All tests completed.\n');
  })
  .catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
