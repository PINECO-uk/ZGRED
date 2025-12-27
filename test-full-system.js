/**
 * Comprehensive test of the entire AI Agents system
 * Tests all three agents with real data
 */

import { generateReferences, generateCert, generateInternship } from './src/llm-handler.js';
import { config } from './src/config.js';

console.log('=======================================================');
console.log('  FULL SYSTEM TEST - AI AGENTS & DOCUMENT GENERATION');
console.log('=======================================================\n');

console.log('Configuration:');
console.log(`- Ollama URL: ${config.ollamaBaseUrl}`);
console.log(`- Model: ${config.ollamaModel}`);
console.log('');

// Test data - sample employee
const testEmployee = {
  name: 'Kinga',
  surname: 'Testowa',
  team: 'Marketing Masters',
  startDate: '2024-01-15',
  endDate: '2024-12-20',
  mainTasks: 'Planowanie i tworzenie contentu, współpraca z zespołem graficznym, prowadzenie komunikacji na social media',
  gender: 'K',
  status: 'nieaktywny',
  role: 'wolontariusz'
};

const additionalInfo = `Kinga była bardzo zaangażowaną wolontariuszką w zespole Marketing Masters.
Odpowiadała za strategię TikTok, tworzyła angażujące treści i koordynowała publikacje.
Aktywnie uczestniczyła w projektach międzynarodowych, reprezentując LEVEL UP za granicą.
Wykazała się kreatywnością, samodzielnością i profesjonalizmem.`;

// Helper function to display results
function displayResult(title, result, fieldName = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);

  if (fieldName) {
    console.log(result[fieldName] || '(empty)');
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  console.log('');
}

// Test function with error handling
async function runTest(testName, testFunc) {
  try {
    console.log(`\n🧪 Running: ${testName}...`);
    const startTime = Date.now();
    const result = await testFunc();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ PASSED (${duration}s)`);
    return result;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    console.error(error);
    return null;
  }
}

// Main test execution
async function runAllTests() {
  console.log('\n📋 Starting comprehensive system tests...\n');

  // Test 1: References Agent
  const referencesResult = await runTest(
    'Test 1: References Agent (Profesjonalny Specjalista HR)',
    async () => {
      const result = await generateReferences(testEmployee, additionalInfo);
      displayResult('GENERATED REFERENCES', result, 'referenceText');
      return result;
    }
  );

  // Test 2: Certificate Agent
  const certResult = await runTest(
    'Test 2: Certificate Agent (Rzeczowy Koordynator)',
    async () => {
      const result = await generateCert(testEmployee, additionalInfo);
      displayResult('GENERATED CERTIFICATE', result, 'additionalDescription');
      return result;
    }
  );

  // Test 3: Internship Agent
  const internEmployee = {
    ...testEmployee,
    role: 'praktykant',
    mainTasks: 'Tworzenie grafik do social media, projektowanie plakatów, współpraca z zespołem marketingowym'
  };

  const internInfo = `Praktykantka realizowała zadania graficzne dla zespołu Marketing Masters.
Tworzyła materiały wizualne zgodnie z Brand Book.
Wykazała się kreatywnością i umiejętnością pracy w zespole.
Najlepiej odnajdywała się w projektowaniu materiałów dla mediów społecznościowych.`;

  const internshipResult = await runTest(
    'Test 3: Internship Agent (Analityczny Koordynator Praktyk)',
    async () => {
      const result = await generateInternship(internEmployee, internInfo);
      displayResult('GENERATED INTERNSHIP EVALUATION', result);
      return result;
    }
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const tests = [
    { name: 'References Agent', result: referencesResult },
    { name: 'Certificate Agent', result: certResult },
    { name: 'Internship Agent', result: internshipResult }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    if (test.result) {
      console.log(`✅ ${test.name}: PASSED`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      failed++;
    }
  });

  console.log(`\nTotal: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
  } else {
    console.log(`\n⚠️  Some tests failed. Please check the errors above.`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Next Steps:');
  console.log('='.repeat(60));
  console.log('1. Review the generated content quality');
  console.log('2. Check if agents follow their personalities');
  console.log('3. Verify Polish grammar and formatting');
  console.log('4. Test with actual Excel data integration');
  console.log('5. Generate PDF documents');
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
