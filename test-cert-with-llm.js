/**
 * Test certificate generation WITH Ollama LLM
 */

import { processTask } from './src/task-processor.js';

console.log('='.repeat(80));
console.log('TEST: Certificate Generation WITH Additional Info (LLM)');
console.log('='.repeat(80));

const testCase = {
  task: 'cert',
  name: 'Ola',
  surname: 'Pietrzak',
  additionalInfo: 'Ola wykazała się dużym zaangażowaniem w organizacji szkoleń online. Prowadziła warsztaty z zakresu soft skills dla młodzieży. Była bardzo aktywna w zespole.',
};

console.log('\nTest parameters:');
console.log('  Person:', testCase.name, testCase.surname);
console.log('  Task:', testCase.task);
console.log('  Additional info:', testCase.additionalInfo);
console.log('\nStarting generation...\n');

processTask(testCase)
  .then((result) => {
    console.log('\n' + '='.repeat(80));
    if (result.success) {
      console.log('✓ SUCCESS');
      console.log('Output file:', result.outputPath);
      console.log('\nGenerated data:');
      console.log('  Name:', result.data.name, result.data.surname);
      console.log('  Team:', result.data.team);
      console.log('  Additional description length:', result.data.additionalDescription?.length || 0, 'chars');
      if (result.data.additionalDescription) {
        console.log('\nGenerated additional description:');
        console.log('---');
        console.log(result.data.additionalDescription);
        console.log('---');
      }
    } else {
      console.log('✗ FAILED');
      console.log('Error:', result.error);
    }
    console.log('='.repeat(80));
  })
  .catch((error) => {
    console.log('\n' + '='.repeat(80));
    console.log('✗ ERROR');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    console.log('='.repeat(80));
    process.exit(1);
  });
