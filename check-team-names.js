import XLSX from 'xlsx';
import { readFileSync } from 'fs';

const workbook = XLSX.readFile('/workspace/data/dane_treningowe_wolontariat_LEVELUP.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Check unique team names in the data
const teams = [...new Set(data.map(emp => emp['Team - od 1.08.2022']).filter(t => t))];
console.log('Teams in Excel data:');
teams.forEach(t => console.log(' -', t));

console.log('\n\nTeams in JSON file:');
const jsonData = JSON.parse(readFileSync('./data/opisy-zespoly.json', 'utf-8'));
Object.keys(jsonData.teams).forEach(t => console.log(' -', t));

console.log('\n\nMismatch analysis:');
teams.forEach(excelTeam => {
  const jsonMatch = Object.keys(jsonData.teams).find(jsonTeam =>
    jsonTeam.toLowerCase().includes(excelTeam.toLowerCase()) ||
    excelTeam.toLowerCase().includes(jsonTeam.toLowerCase())
  );
  if (!jsonMatch) {
    console.log(`✗ No match for: ${excelTeam}`);
  } else if (jsonMatch !== excelTeam) {
    console.log(`⚠ Partial match: "${excelTeam}" → "${jsonMatch}"`);
  } else {
    console.log(`✓ Exact match: ${excelTeam}`);
  }
});
