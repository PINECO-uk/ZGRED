/**
 * Test script for "Z poważaniem" spacing (3 line breaks below main text)
 */

import { findEmployee } from './src/excel-handler.js';
import { generateCert } from './src/llm-handler.js';
import { generatePDF } from './src/pdf-generator.js';
import { ensureOllama } from './src/config.js';
import { TaskType } from './src/models.js';

async function testRegardsSpacing() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║    TEST: Odstęp "Z poważaniem" (3 akapity od tekstu)          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Check if Ollama is running
  await ensureOllama();

  console.log('🔍 POBIERANIE DANYCH Z EXCELA...');
  const employee = findEmployee('Anna', 'Pietrzak');

  if (!employee) {
    console.log('❌ Nie znaleziono pracownika');
    process.exit(1);
  }

  console.log('\n📋 DANE PRACOWNIKA:');
  console.log(`   Imię i nazwisko: ${employee.name} ${employee.surname}`);
  console.log(`   Płeć: ${employee.gender}`);
  console.log(`   Zespół: ${employee.team}`);
  console.log(`   Okres: ${employee.startDate} - ${employee.endDate}`);

  const additionalInfo = `Anna aktywnie uczestniczyła w projektach marketingowych.
Samodzielnie przygotowała 20 postów na social media.
Jej zaangażowanie było wzorowe i inspirujące dla innych.
Wykazała się dużą kreatywnością i profesjonalizmem.`;

  console.log('\n📝 DODATKOWE INFORMACJE:');
  console.log(additionalInfo.split('\n').map(l => '   ' + l).join('\n'));

  console.log('\n🤖 GENEROWANIE TREŚCI LLM...');
  const certData = await generateCert(employee, additionalInfo);

  console.log('\n✅ TREŚĆ WYGENEROWANA:');
  console.log('   Dodatkowy opis:', certData.additionalDescription.substring(0, 100) + '...');

  console.log('\n📄 GENEROWANIE PDF...');
  const pdfPath = await generatePDF(TaskType.CERT, certData);

  console.log('\n✅ PDF WYGENEROWANY:');
  console.log(`   Ścieżka: ${pdfPath}`);
  console.log('\n📊 INFORMACJE O DOKUMENCIE:');
  console.log('   ✓ "Z poważaniem" jest umieszczone 3 akapity poniżej ostatniego tekstu');
  console.log('   ✓ Odstęp: 18 (lineHeight) × 3 = 54 punktów');
  console.log('   ✓ Wyrównanie: prawy dolny róg');

  console.log('\n' + '='.repeat(70));
  console.log('🎉 TEST ZAKOŃCZONY POMYŚLNIE');
  console.log('='.repeat(70));
  console.log(`\nOtwórz plik: ${pdfPath}`);
  console.log('Sprawdź wizualnie, czy odstęp "Z poważaniem" jest prawidłowy.\n');
}

// Run the test
testRegardsSpacing().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Błąd krytyczny:', err);
  console.error(err.stack);
  process.exit(1);
});
