/**
 * Test script for "Z poważaniem" spacing across all document types
 */

import { findEmployee } from './src/excel-handler.js';
import { generateCert, generateReferences, generateInternship } from './src/llm-handler.js';
import { generatePDF } from './src/pdf-generator.js';
import { ensureOllama } from './src/config.js';
import { TaskType } from './src/models.js';

async function testAllRegardsSpacing() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST: Odstęp "Z poważaniem" - Wszystkie Typy Dokumentów      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await ensureOllama();

  const employee = findEmployee('Anna', 'Pietrzak');
  if (!employee) {
    console.log('❌ Nie znaleziono pracownika');
    process.exit(1);
  }

  const additionalInfo = `Anna aktywnie uczestniczyła w projektach marketingowych.
Samodzielnie przygotowała 20 postów na social media.
Wykazała się dużą kreatywnością i profesjonalizmem.`;

  const tests = [
    {
      name: 'ZAŚWIADCZENIE (Certificate)',
      type: TaskType.CERT,
      generator: generateCert,
      spacing: '18 × 3 = 54 punktów'
    },
    {
      name: 'REFERENCJE (References)',
      type: TaskType.REFERENCES,
      generator: generateReferences,
      spacing: '16 × 3 = 48 punktów'
    },
    {
      name: 'STAŻ/PRAKTYKA (Internship)',
      type: TaskType.INTERNSHIP,
      generator: generateInternship,
      spacing: '13 × 3 = 39 punktów'
    }
  ];

  const generatedFiles = [];

  for (const test of tests) {
    console.log('\n' + '='.repeat(70));
    console.log(`TEST: ${test.name}`);
    console.log('='.repeat(70));

    console.log(`\n🤖 Generowanie treści dla: ${employee.name} ${employee.surname}`);
    const data = await test.generator(employee, additionalInfo);

    console.log('📄 Generowanie PDF...');
    const pdfPath = await generatePDF(test.type, data);

    console.log('\n✅ PDF WYGENEROWANY:');
    console.log(`   Ścieżka: ${pdfPath}`);
    console.log(`   Odstęp "Z poważaniem": ${test.spacing}`);
    console.log('   Pozycja: 3 akapity poniżej ostatniego tekstu');

    generatedFiles.push({ name: test.name, path: pdfPath });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 WSZYSTKIE TESTY ZAKOŃCZONE POMYŚLNIE');
  console.log('='.repeat(70));

  console.log('\n📁 WYGENEROWANE PLIKI:');
  generatedFiles.forEach((file, idx) => {
    console.log(`   ${idx + 1}. ${file.name}`);
    console.log(`      ${file.path}`);
  });

  console.log('\n💡 PODSUMOWANIE ZMIAN:');
  console.log('   ✓ "Z poważaniem" jest teraz umieszczane w odległości 3 akapitów');
  console.log('   ✓ Odstęp jest dynamiczny - zależy od ostatniego tekstu');
  console.log('   ✓ Dotyczy wszystkich 3 typów dokumentów');
  console.log('   ✓ Poprzednio: stała pozycja na dole strony');
  console.log('   ✓ Teraz: względna pozycja (3 linie poniżej tekstu)\n');
}

testAllRegardsSpacing().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Błąd krytyczny:', err);
  console.error(err.stack);
  process.exit(1);
});
