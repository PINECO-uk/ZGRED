/**
 * NGO Document Generator - Main entry point
 *
 * AI agent to help Non-profit organizations create:
 * - References
 * - Certificates
 * - Internship documents
 */

export { TaskType, validateTaskInput, createGenerationResult } from './models.js';
export { config, ensureDirectories } from './config.js';
export { findEmployee, getAllEmployees, createSampleExcel } from './excel-handler.js';
export { generateContent, generateReferences, generateCert, generateInternship } from './llm-handler.js';
export { generatePDF } from './pdf-generator.js';
export { processTask } from './task-processor.js';
