/**
 * Test script to verify reference text generation and PDF inclusion
 */

import { findEmployee } from './src/excel-handler.js';
import { generateReferences } from './src/llm-handler.js';
import { generateReferences as generateRefPDF } from './src/pdf-generator.js';

console.log('='.repeat(80));
console.log('TESTING REFERENCE TEXT GENERATION AND PDF INCLUSION');
console.log('='.repeat(80));

// Step 1: Get employee data
console.log('\n[STEP 1] Getting employee data...');
const employee = findEmployee('Anna', 'Pietrzak');
if (!employee) {
  console.log('ERROR: Employee not found');
  process.exit(1);
}
console.log(`✓ Found employee: ${employee.name} ${employee.surname}`);
console.log(`  Team: ${employee.team}`);
console.log(`  Role: ${employee.role}`);
console.log(`  Status: ${employee.status}`);

// Step 2: Generate content with LLM
console.log('\n[STEP 2] Generating content with LLM agent...');
const additionalInfo = 'Bardzo zaangażowany wolontariusz, odpowiedzialny za koordynację projektów marketingowych. Wykazał się kreatywnością i inicjatywą.';
console.log(`Additional info: ${additionalInfo}`);

const contentData = await generateReferences(employee, additionalInfo);

console.log('\n[STEP 2 RESULTS]');
console.log(`✓ Generation completed`);
console.log(`  referenceText length: ${contentData.referenceText ? contentData.referenceText.length : 0} chars`);
console.log(`  referenceText empty: ${!contentData.referenceText || contentData.referenceText.trim() === ''}`);

if (contentData.referenceText && contentData.referenceText.trim() !== '') {
  console.log(`\n[REFERENCE TEXT PREVIEW]`);
  console.log('---START---');
  console.log(contentData.referenceText.substring(0, 300));
  console.log('---END PREVIEW---');
  console.log(`\nFull length: ${contentData.referenceText.length} characters`);
} else {
  console.log('\n❌ ERROR: referenceText is EMPTY!');
  console.log('This means the LLM did not generate any content or it was lost during parsing.');
}

// Step 3: Generate PDF
console.log('\n[STEP 3] Generating PDF...');
try {
  const pdfPath = await generateRefPDF(contentData);
  console.log(`✓ PDF generated: ${pdfPath}`);
  console.log('\n[FINAL CHECK]');
  console.log('Please open the PDF and verify if the reference text appears in the document.');
  console.log('If the PDF is empty, the problem is in the PDF generator.');
  console.log('If the referenceText above is empty, the problem is in the LLM handler.');
} catch (error) {
  console.log(`❌ PDF generation failed: ${error.message}`);
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETED');
console.log('='.repeat(80));
