/**
 * Comprehensive test script for all document generation features
 * Tests: team descriptions, gender forms, status-based tense, role differentiation
 */

import { processTask } from './src/task-processor.js';
import { existsSync, readFileSync } from 'fs';

const testCases = [
  {
    name: 'Test 1: Active Female Volunteer - Certificate',
    task: 'cert',
    employee: {
      name: 'Ola',
      surname: 'Pietrzak',
    },
    additionalInfo: 'Ola wykazała się dużym zaangażowaniem w organizacji szkoleń online. Prowadziła warsztaty z zakresu soft skills dla młodzieży.',
    expectedChecks: [
      'Present tense verbs (for active status)',
      'Female forms (jest aktywną członkinią)',
      'Team description from JSON (Events and External Trainings Masters)',
    ],
  },
  {
    name: 'Test 2: Inactive Male Volunteer - Certificate',
    task: 'cert',
    employee: {
      name: 'Tomasz',
      surname: 'Kaczmarek',
    },
    additionalInfo: 'Tomasz zajmował się tworzeniem grafik do social media oraz projektowaniem materiałów promocyjnych.',
    expectedChecks: [
      'Past tense verbs (for inactive status)',
      'Male forms (był aktywnym członkiem)',
      'Team description from JSON (Graphic Masters)',
    ],
  },
  {
    name: 'Test 3: Active Female Volunteer - References',
    task: 'references',
    employee: {
      name: 'Ola',
      surname: 'Pietrzak',
    },
    additionalInfo: 'Ola była bardzo zaangażowana w organizowanie szkoleń i wydarzeń. Prowadziła warsztaty z zakresu soft skills. Wykazała się dużą kreatywnością i odpowiedzialnością.',
    expectedChecks: [
      'Present tense in references (for active status)',
      'Female forms throughout',
      '3-4 paragraph structure',
      'Team description integrated',
    ],
  },
  {
    name: 'Test 4: Inactive Male Volunteer - References',
    task: 'references',
    employee: {
      name: 'Tomasz',
      surname: 'Kaczmarek',
    },
    additionalInfo: 'Tomasz był bardzo kreatywny w tworzeniu grafik. Zajmował się projektowaniem materiałów do kampanii marketingowych. Współpracował bardzo dobrze z zespołem.',
    expectedChecks: [
      'Past tense throughout (for inactive status)',
      'Male forms',
      '3-4 paragraph structure',
      'Team description from Graphic Masters',
    ],
  },
  {
    name: 'Test 5: Active Female Praktykant - Internship',
    task: 'internship',
    employee: {
      name: 'Ola',
      surname: 'Kowalski',
    },
    additionalInfo: 'Ola zajmuje się aktualizacją strony internetowej, tworzeniem nowych podstron oraz optymalizacją SEO. Wykazuje się dużą samodzielnością i inicjatywą.',
    expectedChecks: [
      'Present tense (for active praktykant)',
      'Female forms',
      'praktyki zdalnych (not e-wolontariatu)',
      'Team description from Web Masters',
    ],
  },
  {
    name: 'Test 6: Inactive Male Praktykant - Internship',
    task: 'internship',
    employee: {
      name: 'Kamil',
      surname: 'Zielinska',
    },
    additionalInfo: 'Kamil zajmował się tworzeniem treści na social media, prowadzeniem kampanii marketingowych oraz analizą danych. Wykazał się dużą kreatywnością.',
    expectedChecks: [
      'Past tense (for inactive praktykant)',
      'Male forms',
      'praktyki zdalnych (not e-wolontariatu)',
      'Team description from Marketing Masters',
    ],
  },
];

console.log('='.repeat(80));
console.log('COMPREHENSIVE FEATURE TEST - ZGRED DOCUMENT GENERATOR');
console.log('='.repeat(80));
console.log(`Testing ${testCases.length} scenarios:\n`);
testCases.forEach((tc, i) => {
  console.log(`${i + 1}. ${tc.name}`);
});
console.log('\n' + '='.repeat(80));

async function runTests() {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log('\n' + '='.repeat(80));
    console.log(`RUNNING: ${testCase.name}`);
    console.log('='.repeat(80));

    try {
      const result = await processTask({
        task: testCase.task,
        name: testCase.employee.name,
        surname: testCase.employee.surname,
        additionalInfo: testCase.additionalInfo,
      });

      if (result.success) {
        console.log('✓ Document generated successfully');
        console.log(`✓ Output file: ${result.outputPath}`);

        // Check if file exists
        if (existsSync(result.outputPath)) {
          console.log('✓ PDF file exists on disk');

          // Log what should be checked manually
          console.log('\nExpected features to verify manually:');
          testCase.expectedChecks.forEach((check) => {
            console.log(`  - ${check}`);
          });

          results.push({
            test: testCase.name,
            status: 'SUCCESS',
            outputPath: result.outputPath,
          });
        } else {
          console.log('✗ PDF file NOT found on disk');
          results.push({
            test: testCase.name,
            status: 'FAILED',
            error: 'PDF file not found',
          });
        }
      } else {
        console.log('✗ Document generation failed');
        console.log(`✗ Error: ${result.error}`);
        results.push({
          test: testCase.name,
          status: 'FAILED',
          error: result.error,
        });
      }
    } catch (error) {
      console.log('✗ Test execution failed');
      console.log(`✗ Error: ${error.message}`);
      results.push({
        test: testCase.name,
        status: 'ERROR',
        error: error.message,
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter((r) => r.status === 'SUCCESS').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const errors = results.filter((r) => r.status === 'ERROR').length;

  console.log(`Total tests: ${results.length}`);
  console.log(`✓ Successful: ${successful}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`✗ Errors: ${errors}`);

  console.log('\nDetailed results:');
  results.forEach((result, i) => {
    const icon = result.status === 'SUCCESS' ? '✓' : '✗';
    console.log(`${i + 1}. ${icon} ${result.test}`);
    if (result.outputPath) {
      console.log(`   → ${result.outputPath}`);
    }
    if (result.error) {
      console.log(`   → Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('MANUAL VERIFICATION CHECKLIST');
  console.log('='.repeat(80));
  console.log('Please manually verify the following in generated PDFs:\n');
  console.log('1. GENDER FORMS:');
  console.log('   Female: była, działała, jest aktywną członkinią, dołączyła, współpracowała');
  console.log('   Male: był, działał, jest aktywnym członkiem, dołączył, współpracował\n');
  console.log('2. TENSE (based on status):');
  console.log('   Active: present tense (jest, współpracuje, wykazuje się, angażuje się)');
  console.log('   Inactive: past tense (była, współpracowała, wykazała się, angażowała się)\n');
  console.log('3. ROLE DISTINCTION:');
  console.log('   Wolontariat: "program e-wolontariatu"');
  console.log('   Praktyki: "program praktyk zdalnych"\n');
  console.log('4. TEAM DESCRIPTIONS:');
  console.log('   Check if LLM-generated content includes specific team activities');
  console.log('   from opisy-zespoly.json (e.g., for Marketing Masters: social media,');
  console.log('   TikTok, YouTube content)\n');
  console.log('5. DOCUMENT STRUCTURE:');
  console.log('   Certificate: 2-3 sentences');
  console.log('   References: 3-4 paragraphs');
  console.log('   Internship: proper sections (description, general info, evaluation)');
  console.log('='.repeat(80));

  return results;
}

runTests()
  .then(() => {
    console.log('\nAll tests completed.');
  })
  .catch((error) => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
