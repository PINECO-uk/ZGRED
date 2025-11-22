#!/usr/bin/env node

/**
 * CLI chat interface for the NGO Document Generator.
 * Interface w języku polskim.
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

import { processTask } from './task-processor.js';
import { getAllEmployees, createSampleExcel } from './excel-handler.js';
import { TaskType } from './models.js';
import { config, ensureDirectories } from './config.js';
import { existsSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';

const program = new Command();

/**
 * Parse user input to extract task information
 * @param {string} input - User input string
 * @returns {object|null} - Parsed task input or null
 */
function parseUserInput(input) {
  const inputLower = input.toLowerCase();

  // Detect task type (Polish and English)
  let task = null;
  if (inputLower.includes('referencj') || inputLower.includes('reference')) {
    task = TaskType.REFERENCES;
  } else if (inputLower.includes('certyfikat') || inputLower.includes('cert') || inputLower.includes('zaświadczenie')) {
    task = TaskType.CERT;
  } else if (inputLower.includes('staż') || inputLower.includes('staz') || inputLower.includes('internship') || inputLower.includes('praktyk')) {
    task = TaskType.INTERNSHIP;
  }

  if (!task) return null;

  // Extract name (pattern: "dla [name] [surname]" or "for [name] [surname]")
  const nameMatch = input.match(/(?:dla|for)\s+(\w+)\s+(\w+)/i);
  let name = '';
  let surname = '';

  if (nameMatch) {
    name = nameMatch[1];
    surname = nameMatch[2];
  }

  // Extract additional info
  let additionalInfo = '';
  const infoPatterns = [
    /(?:dodatkowe\s*)?info(?:rmacje)?\s*[:\-]?\s*(.+?)(?:$|\.(?:\s|$))/i,
    /additional\s*info\s*[:\-]?\s*(.+?)(?:$|\.(?:\s|$))/i,
    /opis\s*[:\-]?\s*(.+?)(?:$|\.(?:\s|$))/i,
  ];

  for (const pattern of infoPatterns) {
    const match = input.match(pattern);
    if (match) {
      additionalInfo = match[1].trim();
      break;
    }
  }

  if (!additionalInfo && nameMatch) {
    const remaining = input.substring(nameMatch.index + nameMatch[0].length).trim();
    if (remaining) {
      additionalInfo = remaining.replace(/^[.,;:\-\s]+/, '');
    }
  }

  if (!name || !surname) return null;

  return {
    task,
    name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
    surname: surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase(),
    role: '',
    additionalInfo,
  };
}

/**
 * Display help information in Polish
 */
function displayHelp() {
  console.log(chalk.cyan('\n📋 Dostępne polecenia:\n'));
  console.log(chalk.bold('  referencje') + '   - Utwórz dokument referencji');
  console.log(chalk.bold('  certyfikat') + '   - Utwórz certyfikat/zaświadczenie');
  console.log(chalk.bold('  staż') + '         - Utwórz dokument oceny stażu/praktyk');
  console.log(chalk.bold('  lista') + '        - Wyświetl listę wolontariuszy');
  console.log(chalk.bold('  szablony') + '     - Zarządzaj szablonami PDF');
  console.log(chalk.bold('  pomoc') + '        - Pokaż tę pomoc');
  console.log(chalk.bold('  wyjście') + '      - Zamknij aplikację');

  console.log(chalk.cyan('\n📝 Przykładowe polecenia:\n'));
  console.log('  "Utwórz certyfikat dla Anna Kowalska. Info: aktywny członek zespołu"');
  console.log('  "Wygeneruj referencje dla Jan Nowak. Opis: świetny programista, prowadził projekt API"');
  console.log('  "Dokument stażu dla Maria Wiśniewska z oceną wymagań uczelni"\n');
}

/**
 * Manage PDF templates
 */
async function manageTemplates() {
  console.log(chalk.cyan('\n📄 Zarządzanie szablonami PDF\n'));

  // Show current templates
  console.log(chalk.bold('Aktualne szablony:'));
  const templateTypes = [
    { key: 'references', name: 'Referencje', file: config.templates.references },
    { key: 'cert', name: 'Certyfikat', file: config.templates.cert },
    { key: 'internship', name: 'Staż/Praktyki', file: config.templates.internship },
  ];

  for (const tmpl of templateTypes) {
    const templatePath = join(config.templatesDir, tmpl.file);
    const exists = existsSync(templatePath);
    const status = exists ? chalk.green('✓ dostępny') : chalk.yellow('✗ brak pliku');
    console.log(`  ${tmpl.name.padEnd(15)} - ${tmpl.file} ${status}`);
  }

  // List available PDF files in templates directory
  let availableFiles = [];
  try {
    availableFiles = readdirSync(config.templatesDir).filter(f => f.endsWith('.pdf'));
  } catch {
    // Directory might not exist
  }

  if (availableFiles.length > 0) {
    console.log(chalk.cyan('\n📁 Pliki PDF w katalogu templates:'));
    availableFiles.forEach(f => console.log(`  - ${f}`));
  }

  console.log(chalk.gray('\n💡 Aby dodać szablon, skopiuj plik PDF do katalogu:'));
  console.log(chalk.gray(`   ${config.templatesDir}`));
  console.log(chalk.gray('\n   Nazwy plików szablonów:'));
  console.log(chalk.gray('   - references_template.pdf (dla referencji)'));
  console.log(chalk.gray('   - cert_template.pdf (dla certyfikatów)'));
  console.log(chalk.gray('   - internship_template.pdf (dla stażu/praktyk)'));

  // Ask if user wants to add a template
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Co chcesz zrobić?',
      choices: [
        { name: 'Dodaj nowy szablon PDF', value: 'add' },
        { name: 'Powrót do menu głównego', value: 'back' },
      ],
    },
  ]);

  if (action === 'add') {
    const { templateType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateType',
        message: 'Wybierz typ szablonu:',
        choices: [
          { name: 'Referencje', value: 'references' },
          { name: 'Certyfikat', value: 'cert' },
          { name: 'Staż/Praktyki', value: 'internship' },
        ],
      },
    ]);

    const { filePath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'filePath',
        message: 'Podaj ścieżkę do pliku PDF:',
        validate: (input) => {
          if (!input.trim()) return 'Ścieżka nie może być pusta';
          if (!existsSync(input.trim())) return 'Plik nie istnieje';
          if (!input.trim().toLowerCase().endsWith('.pdf')) return 'Plik musi być w formacie PDF';
          return true;
        },
      },
    ]);

    try {
      const targetFile = config.templates[templateType];
      const targetPath = join(config.templatesDir, targetFile);
      copyFileSync(filePath.trim(), targetPath);
      console.log(chalk.green(`\n✅ Szablon zapisany jako: ${targetPath}`));
    } catch (error) {
      console.log(chalk.red(`\n❌ Błąd podczas kopiowania pliku: ${error.message}`));
    }
  }

  console.log();
}

/**
 * List all employees in Polish
 */
function listEmployees() {
  const employees = getAllEmployees();

  if (employees.length === 0) {
    console.log(chalk.yellow('Brak wolontariuszy w bazie danych.'));
    return;
  }

  console.log(chalk.cyan(`\n📊 Wolontariusze w bazie danych (${employees.length} rekordów):\n`));
  console.log(chalk.bold('Imię i Nazwisko'.padEnd(25) + 'Zespół'.padEnd(35) + 'Rodzaj'.padEnd(15) + 'Status'));
  console.log('-'.repeat(90));

  // Show first 20 employees
  const displayCount = Math.min(employees.length, 20);
  for (let i = 0; i < displayCount; i++) {
    const emp = employees[i];
    console.log(
      (emp['Imie Nazwisko'] || '').padEnd(25) +
      (emp['Team - od 1.08.2022'] || '').substring(0, 33).padEnd(35) +
      (emp['Rodzaj'] || '').padEnd(15) +
      (emp['Status'] || '').substring(0, 20)
    );
  }

  if (employees.length > 20) {
    console.log(chalk.gray(`\n... i ${employees.length - 20} więcej rekordów`));
  }
  console.log();
}

/**
 * Interactive chat loop in Polish
 */
async function chatLoop() {
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║     Generator Dokumentów NGO                       ║'));
  console.log(chalk.blue.bold('║     Tworzenie dokumentów z użyciem AI              ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════╝'));
  console.log(chalk.gray('\nWpisz "pomoc" aby zobaczyć dostępne polecenia.\n'));

  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.green('Ty:'),
        prefix: '',
      },
    ]);

    const trimmedInput = input.trim();
    if (!trimmedInput) continue;

    const lowerInput = trimmedInput.toLowerCase();

    if (['wyjście', 'wyjscie', 'quit', 'exit', 'q', 'koniec'].includes(lowerInput)) {
      console.log(chalk.yellow('\nDo widzenia! 👋\n'));
      break;
    }

    if (['pomoc', 'help', '?'].includes(lowerInput)) {
      displayHelp();
      continue;
    }

    if (['lista', 'list', 'wolontariusze'].includes(lowerInput)) {
      listEmployees();
      continue;
    }

    if (['szablony', 'szablon', 'templates', 'pdf'].includes(lowerInput)) {
      await manageTemplates();
      continue;
    }

    // Try to parse the input
    const taskInput = parseUserInput(trimmedInput);

    if (!taskInput) {
      console.log(chalk.yellow('\n⚠️  Nie rozumiem polecenia. Proszę podać:'));
      console.log(chalk.gray('   - Typ dokumentu: referencje, certyfikat, lub staż'));
      console.log(chalk.gray('   - Imię i nazwisko: dla [Imię] [Nazwisko]'));
      console.log(chalk.gray('   - Opcjonalnie: dodatkowe informacje'));
      console.log(chalk.gray('\n   Przykład: Utwórz certyfikat dla Anna Kowalska. Info: aktywny członek zespołu\n'));
      continue;
    }

    // Task type names in Polish
    const taskNames = {
      [TaskType.REFERENCES]: 'referencje',
      [TaskType.CERT]: 'certyfikat',
      [TaskType.INTERNSHIP]: 'dokument stażu',
    };

    // Show what we understood
    console.log(chalk.cyan(`\n🔄 Przetwarzam: ${taskNames[taskInput.task]} dla ${taskInput.name} ${taskInput.surname}`));

    // For references, always require additional info
    if (taskInput.task === TaskType.REFERENCES) {
      if (!taskInput.additionalInfo || taskInput.additionalInfo.trim() === '') {
        console.log(chalk.yellow('\n📝 Referencje wymagają dodatkowych informacji o wolontariuszu.'));
        console.log(chalk.gray('   Podaj informacje o: projektach, zaangażowaniu w onboarding, osiągnięciach, cechach charakteru.\n'));

        const { additionalInfo } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'additionalInfo',
            message: 'Podaj dodatkowe informacje (otworzy się edytor):',
            waitForUseInput: false,
            validate: (input) => {
              if (!input.trim()) return 'Dodatkowe informacje są wymagane dla referencji';
              return true;
            },
          },
        ]);
        taskInput.additionalInfo = additionalInfo;
      }
    } else if (!taskInput.additionalInfo || taskInput.additionalInfo.trim() === '') {
      // For other document types, ask if they want to add info
      const { wantAdditionalInfo } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'wantAdditionalInfo',
          message: 'Czy chcesz dodać dodatkowe informacje do dokumentu?',
          default: false,
        },
      ]);

      if (wantAdditionalInfo) {
        const { additionalInfo } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'additionalInfo',
            message: 'Podaj dodatkowe informacje (otworzy się edytor):',
            waitForUseInput: false,
          },
        ]);
        taskInput.additionalInfo = additionalInfo;
      }
    }

    if (taskInput.additionalInfo) {
      console.log(chalk.gray(`   Dodatkowe info: ${taskInput.additionalInfo}`));
    }

    // Process the task
    const spinner = ora('Generuję dokument...').start();

    try {
      const result = await processTask(taskInput);

      if (result.success) {
        spinner.succeed(chalk.green('Dokument wygenerowany pomyślnie!'));
        console.log(chalk.bold(`\n📄 Plik: `) + chalk.cyan(result.outputPath));
        console.log(chalk.gray('   Plik PDF został zapisany w katalogu output.\n'));
      } else {
        spinner.fail(chalk.red('Generowanie dokumentu nie powiodło się'));
        console.log(chalk.red(`   Błąd: ${result.error}\n`));
      }
    } catch (error) {
      spinner.fail(chalk.red('Wystąpił błąd'));
      console.log(chalk.red(`   ${error.message}\n`));
    }
  }
}

/**
 * Generate command handler
 */
async function generateCommand(task, options) {
  ensureDirectories();

  const validTasks = Object.values(TaskType);
  if (!validTasks.includes(task.toLowerCase())) {
    console.log(chalk.red(`Nieprawidłowy typ dokumentu: ${task}. Użyj: references, cert, lub internship`));
    process.exit(1);
  }

  const taskInput = {
    task: task.toLowerCase(),
    name: options.name,
    surname: options.surname,
    role: options.role || '',
    additionalInfo: options.info || '',
  };

  const spinner = ora('Generuję dokument...').start();

  try {
    const result = await processTask(taskInput);

    if (result.success) {
      spinner.succeed(chalk.green('Sukces!'));
      console.log(`Dokument zapisany: ${result.outputPath}`);
    } else {
      spinner.fail(chalk.red('Błąd'));
      console.log(chalk.red(`Błąd: ${result.error}`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Błąd'));
    console.log(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Init command handler
 */
function initCommand() {
  ensureDirectories();
  createSampleExcel();
  console.log(chalk.green('✅ Aplikacja zainicjalizowana pomyślnie!'));
  console.log(chalk.gray(`   Plik Excel: ${config.excelFile}`));
}

// CLI setup in Polish
program
  .name('ngo-docs')
  .description('Generator Dokumentów NGO - Tworzenie referencji, certyfikatów i dokumentów stażowych')
  .version('1.0.0');

program
  .command('chat')
  .description('Uruchom interaktywny interfejs czatu')
  .action(() => {
    ensureDirectories();
    if (!existsSync(config.excelFile)) {
      createSampleExcel();
    }
    chatLoop();
  });

program
  .command('generate <task>')
  .description('Wygeneruj dokument bezpośrednio (task: references, cert, internship)')
  .requiredOption('-n, --name <name>', 'Imię')
  .requiredOption('-s, --surname <surname>', 'Nazwisko')
  .option('-r, --role <role>', 'Rola/stanowisko')
  .option('-i, --info <info>', 'Dodatkowe informacje')
  .action(generateCommand);

program
  .command('init')
  .description('Zainicjalizuj aplikację z przykładowymi danymi')
  .action(initCommand);

program
  .command('lista')
  .alias('list')
  .description('Wyświetl wszystkich wolontariuszy w bazie')
  .action(() => {
    ensureDirectories();
    if (!existsSync(config.excelFile)) {
      createSampleExcel();
    }
    listEmployees();
  });

// Default to chat if no command specified
if (process.argv.length <= 2) {
  ensureDirectories();
  if (!existsSync(config.excelFile)) {
    createSampleExcel();
  }
  chatLoop();
} else {
  program.parse();
}
