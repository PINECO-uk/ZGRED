/**
 * Task processor for document generation.
 */

import { findEmployee, createSampleExcel } from './excel-handler.js';
import { generateContent } from './llm-handler.js';
import { generatePDF } from './pdf-generator.js';
import { createGenerationResult } from './models.js';
import { config, ensureDirectories } from './config.js';
import { existsSync } from 'fs';

/**
 * Process a document generation task
 * @param {object} taskInput - Task input data
 * @returns {Promise<object>} - Generation result
 */
export async function processTask(taskInput) {
  const { task, name, surname, additionalInfo } = taskInput;

  console.log(`Processing task: ${task} for ${name} ${surname}`);

  try {
    // Ensure directories exist
    ensureDirectories();

    // Create sample data if needed
    if (!existsSync(config.excelFile)) {
      createSampleExcel();
    }

    // Get employee data from Excel
    const employee = findEmployee(name, surname);

    if (!employee) {
      return createGenerationResult(false, task, {
        error: `Employee not found: ${name} ${surname}`,
      });
    }

    // Generate content using LLM if additional info provided, otherwise use Excel data only
    let contentData;

    // Check if we have additional info to process with LLM
    const hasAdditionalInfo = additionalInfo && additionalInfo.trim() !== '';

    if (hasAdditionalInfo) {
      try {
        console.log('Calling Ollama with additional info:', additionalInfo);
        contentData = await generateContent(task, employee, additionalInfo);
        console.log('Ollama response:', JSON.stringify(contentData, null, 2));
      } catch (error) {
        console.warn('LLM generation failed:', error.message);
        contentData = null;
      }
    }

    // If no LLM content (no additional info or LLM failed), use only Excel data
    if (!contentData) {
      contentData = {
        name: employee.name,
        surname: employee.surname,
        startDate: employee.startDate,
        endDate: employee.endDate,
        team: employee.team,
        mainTasks: employee.mainTasks,
        status: employee.status, // For active/inactive check
        // For references and internship documents
        mainProjects: '',
        onboardingEngagement: '',
        achievements: '',
        characteristics: '',
        requirementsComparison: '',
        grade: '',
        // For certificate - additional description from Ollama
        additionalDescription: '',
      };
    } else {
      // Add status to LLM-generated content as well
      contentData.status = employee.status;
    }

    // Generate PDF
    const outputPath = await generatePDF(task, contentData);

    return createGenerationResult(true, task, {
      outputPath,
      data: contentData,
    });
  } catch (error) {
    console.error('Task processing failed:', error.message);
    return createGenerationResult(false, task, {
      error: error.message,
    });
  }
}

export default { processTask };
