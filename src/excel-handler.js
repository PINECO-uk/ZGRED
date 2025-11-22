/**
 * Excel data handler for employee records.
 */

import XLSX from 'xlsx';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from './config.js';

/**
 * Find an employee by name and surname in the Excel file
 * @param {string} name - First name
 * @param {string} surname - Last name
 * @returns {object|null} - Employee record or null if not found
 */
export function findEmployee(name, surname) {
  if (!existsSync(config.excelFile)) {
    console.log('Excel file not found, creating sample data...');
    createSampleExcel();
  }

  try {
    const workbook = XLSX.readFile(config.excelFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const fullName = `${name} ${surname}`.toLowerCase();

    const employee = data.find((row) => {
      // Support both "Imie Nazwisko" (Polish) and separate name/surname columns
      const rowFullName = row['Imie Nazwisko']?.toLowerCase();
      if (rowFullName) {
        return rowFullName === fullName;
      }
      // Fallback to separate columns
      const rowName = row.name?.toLowerCase() || '';
      const rowSurname = row.surname?.toLowerCase() || '';
      return rowName === name.toLowerCase() && rowSurname === surname.toLowerCase();
    });

    if (!employee) {
      console.log(`Employee not found: ${name} ${surname}`);
      return null;
    }

    // Parse "Imie Nazwisko" into name and surname if needed
    let parsedName = name;
    let parsedSurname = surname;
    if (employee['Imie Nazwisko']) {
      const parts = employee['Imie Nazwisko'].split(' ');
      parsedName = parts[0] || name;
      parsedSurname = parts.slice(1).join(' ') || surname;
    }

    return {
      name: parsedName,
      surname: parsedSurname,
      startDate: String(employee['Data rozpoczęcia'] || employee.start_date || ''),
      endDate: String(employee['Data zakończenia'] || employee.end_date || 'do dnia dzisiejszego'),
      team: String(employee['Team - od 1.08.2022'] || employee.team || ''),
      mainTasks: String(employee['Obszar dzialan'] || employee.main_tasks || ''),
      role: String(employee['Rodzaj'] || employee.role || ''),
      email: String(employee['adres e-mail'] || ''),
      phone: String(employee['Numer telefonu'] || ''),
      status: String(employee['Status'] || ''),
    };
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return null;
  }
}

/**
 * Get all employees from the Excel file
 * @returns {Array} - Array of employee records
 */
export function getAllEmployees() {
  if (!existsSync(config.excelFile)) {
    createSampleExcel();
  }

  try {
    const workbook = XLSX.readFile(config.excelFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return [];
  }
}

/**
 * Create a sample Excel file with employee data
 */
export function createSampleExcel() {
  const sampleData = [
    {
      name: 'Anna',
      surname: 'Kowalska',
      start_date: '2021-01-01',
      end_date: '2022-06-03',
      team: 'Marketing Masters',
      main_tasks: 'coordination of Instagram page, preparing content, doing graphics',
      role: 'Volunteer',
    },
    {
      name: 'Jan',
      surname: 'Nowak',
      start_date: '2020-03-15',
      end_date: '',
      team: 'Tech Team',
      main_tasks: 'website development, database management, API integration',
      role: 'Developer',
    },
    {
      name: 'Maria',
      surname: 'Wisniewska',
      start_date: '2022-09-01',
      end_date: '2023-02-28',
      team: 'HR Department',
      main_tasks: 'recruitment, onboarding coordination, employee relations',
      role: 'Intern',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  // Ensure data directory exists
  try {
    mkdirSync(dirname(config.excelFile), { recursive: true });
  } catch {
    // Directory might already exist
  }

  XLSX.writeFile(workbook, config.excelFile);
  console.log(`Created sample Excel file: ${config.excelFile}`);
}

export default { findEmployee, getAllEmployees, createSampleExcel };
