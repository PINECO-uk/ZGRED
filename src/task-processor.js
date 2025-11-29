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

  console.log('='.repeat(80));
  console.log(`[TASK START] Processing task: ${task} for ${name} ${surname}`);
  console.log(`[TASK START] Additional info provided: ${additionalInfo ? 'YES' : 'NO'}`);
  if (additionalInfo) {
    console.log(`[TASK START] Additional info length: ${additionalInfo.length} characters`);
    console.log(`[TASK START] Additional info preview: ${additionalInfo.substring(0, 100)}...`);
  }
  console.log('='.repeat(80));

  try {
    // Ensure directories exist
    console.log('[INIT] Ensuring directories exist...');
    ensureDirectories();
    console.log('[INIT] Directories verified');

    // Create sample data if needed
    if (!existsSync(config.excelFile)) {
      console.log('[INIT] Excel file not found, creating sample data...');
      createSampleExcel();
      console.log('[INIT] Sample Excel file created');
    } else {
      console.log(`[INIT] Excel file found at: ${config.excelFile}`);
    }

    // Get employee data from Excel
    console.log(`[EXCEL] Searching for employee: ${name} ${surname}`);
    const employee = findEmployee(name, surname);

    if (!employee) {
      console.log(`[EXCEL] ERROR: Employee not found: ${name} ${surname}`);
      return createGenerationResult(false, task, {
        error: `Employee not found: ${name} ${surname}`,
      });
    }

    console.log('[EXCEL] Employee found:');
    console.log(`[EXCEL]   - Name: ${employee.name} ${employee.surname}`);
    console.log(`[EXCEL]   - Team: ${employee.team}`);
    console.log(`[EXCEL]   - Period: ${employee.startDate} - ${employee.endDate}`);
    console.log(`[EXCEL]   - Status: ${employee.status}`);
    console.log(`[EXCEL]   - Role: ${employee.role}`);
    console.log(`[EXCEL]   - Main tasks: ${employee.mainTasks}`);

    // Validate role for internship documents
    if (task === 'internship') {
      const roleNormalized = employee.role?.toLowerCase() || '';
      const isValidRole = roleNormalized.includes('praktykant') ||
                          roleNormalized.includes('stażysta') ||
                          roleNormalized.includes('intern') ||
                          roleNormalized.includes('staż');

      if (!isValidRole) {
        console.log(`[VALIDATION] ERROR: Invalid role for internship document: ${employee.role}`);
        console.log(`[VALIDATION] Internship documents can only be generated for: praktykant, stażysta, intern`);
        return createGenerationResult(false, task, {
          error: `Dokument stażu/praktyki może być wygenerowany tylko dla osób z rolą: praktykant lub stażysta. Aktualna rola: ${employee.role || '(brak)'}`,
        });
      }
      console.log(`[VALIDATION] ✓ Role validated for internship document: ${employee.role}`);
    }

    // Generate content using LLM if additional info provided, otherwise use Excel data only
    let contentData;

    // Check if we have additional info to process with LLM
    const hasAdditionalInfo = additionalInfo && additionalInfo.trim() !== '';

    if (hasAdditionalInfo) {
      console.log('[LLM] Additional info provided - calling Ollama...');
      console.log(`[LLM] Task type: ${task}`);
      console.log(`[LLM] Additional info: ${additionalInfo}`);

      try {
        contentData = await generateContent(task, employee, additionalInfo);
        console.log('[LLM] ✓ Ollama generation successful');
        console.log('[LLM] Generated content fields:');

        // Log which fields were populated
        Object.keys(contentData).forEach(key => {
          const value = contentData[key];
          if (value && value.toString().trim() !== '') {
            console.log(`[LLM]   - ${key}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
          } else {
            console.log(`[LLM]   - ${key}: (empty)`);
          }
        });
      } catch (error) {
        console.log('[LLM] ✗ Ollama generation failed');
        console.log(`[LLM] Error: ${error.message}`);
        console.log('[LLM] Falling back to Excel data only');
        contentData = null;
      }
    } else {
      console.log('[LLM] No additional info provided - skipping LLM generation');
      console.log('[LLM] Will use Excel data only');
    }

    // If no LLM content (no additional info or LLM failed), use only Excel data
    if (!contentData) {
      console.log('[FALLBACK] Using Excel data only (no LLM content)');
      contentData = {
        name: employee.name,
        surname: employee.surname,
        startDate: employee.startDate,
        endDate: employee.endDate,
        team: employee.team,
        mainTasks: employee.mainTasks,
        status: employee.status, // For active/inactive check
        // For references - reference text
        referenceText: '',
        // For internship documents (new structure)
        internshipDescription: '',
        generalInformation: '',
        evaluation: '',
        grade: '',
        // For certificate - additional description from Ollama
        additionalDescription: '',
      };

      console.log('[FALLBACK] WARNING: All AI-generated fields will be empty:');
      console.log('[FALLBACK]   - referenceText: (empty)');
      console.log('[FALLBACK]   - additionalDescription: (empty)');
      console.log('[FALLBACK]   - internshipDescription: (empty)');
      console.log('[FALLBACK]   - generalInformation: (empty)');
      console.log('[FALLBACK]   - evaluation: (empty)');
      console.log('[FALLBACK]   - etc.');
    } else {
      // Add status to LLM-generated content as well
      contentData.status = employee.status;
      console.log('[LLM] Added employee status to LLM content');
    }

    // Generate PDF
    console.log('[PDF] Starting PDF generation...');
    console.log(`[PDF] Task type: ${task}`);
    console.log('[PDF] Content data summary:');
    console.log(`[PDF]   - Name: ${contentData.name} ${contentData.surname}`);
    console.log(`[PDF]   - Team: ${contentData.team}`);
    console.log(`[PDF]   - Period: ${contentData.startDate} - ${contentData.endDate}`);

    // Log document-specific fields
    if (task === 'references') {
      console.log(`[PDF]   - referenceText: ${contentData.referenceText ? `${contentData.referenceText.length} chars` : '(empty)'}`);
    } else if (task === 'cert') {
      console.log(`[PDF]   - additionalDescription: ${contentData.additionalDescription ? `${contentData.additionalDescription.length} chars` : '(empty)'}`);
    } else if (task === 'internship') {
      console.log(`[PDF]   - mainTasks: ${contentData.mainTasks ? `${contentData.mainTasks.length} chars` : '(empty)'}`);
      console.log(`[PDF]   - internshipDescription: ${contentData.internshipDescription ? `${contentData.internshipDescription.length} chars` : '(empty)'}`);
      console.log(`[PDF]   - generalInformation: ${contentData.generalInformation ? `${contentData.generalInformation.length} chars` : '(empty)'}`);
      console.log(`[PDF]   - evaluation: ${contentData.evaluation ? `${contentData.evaluation.length} chars` : '(empty)'}`);
    }

    const outputPath = await generatePDF(task, contentData);
    console.log(`[PDF] ✓ PDF generated successfully: ${outputPath}`);

    console.log('='.repeat(80));
    console.log('[SUCCESS] Task completed successfully');
    console.log(`[SUCCESS] Output file: ${outputPath}`);
    console.log('='.repeat(80));

    return createGenerationResult(true, task, {
      outputPath,
      data: contentData,
    });
  } catch (error) {
    console.log('='.repeat(80));
    console.log('[ERROR] Task processing failed');
    console.log(`[ERROR] Error message: ${error.message}`);
    console.log(`[ERROR] Stack trace: ${error.stack}`);
    console.log('='.repeat(80));

    return createGenerationResult(false, task, {
      error: error.message,
    });
  }
}

export default { processTask };
