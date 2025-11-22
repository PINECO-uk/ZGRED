/**
 * Data models and validation schemas for the NGO Document Generator.
 */

import { z } from 'zod';

// Task types enum
export const TaskType = {
  REFERENCES: 'references',
  CERT: 'cert',
  INTERNSHIP: 'internship',
};

// Input schema for task requests
export const TaskInputSchema = z.object({
  task: z.enum([TaskType.REFERENCES, TaskType.CERT, TaskType.INTERNSHIP]),
  name: z.string().min(1, 'Name is required'),
  surname: z.string().min(1, 'Surname is required'),
  role: z.string().optional().default(''),
  additionalInfo: z.string().optional().default(''),
});

// Employee record from Excel
export const EmployeeRecordSchema = z.object({
  name: z.string(),
  surname: z.string(),
  startDate: z.string(),
  endDate: z.string().default('do dnia dzisiejszego'),
  team: z.string(),
  mainTasks: z.string(),
  role: z.string().optional(),
});

// References output schema
export const ReferencesOutputSchema = z.object({
  name: z.string(),
  surname: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  team: z.string(),
  mainTasks: z.string(),
  mainProjects: z.string(),
  onboardingEngagement: z.string(),
  achievements: z.string(),
  characteristics: z.string(),
});

// Certificate output schema
export const CertOutputSchema = z.object({
  name: z.string(),
  surname: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  team: z.string(),
  mainTasks: z.string(),
  mainProjects: z.string(),
  onboardingEngagement: z.string(),
});

// Internship output schema
export const InternshipOutputSchema = z.object({
  name: z.string(),
  surname: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  team: z.string(),
  mainTasks: z.string(),
  mainProjects: z.string(),
  onboardingEngagement: z.string(),
  achievements: z.string(),
  characteristics: z.string(),
  requirementsComparison: z.string(),
  grade: z.string(),
});

// Generation result schema
export const GenerationResultSchema = z.object({
  success: z.boolean(),
  task: z.string(),
  outputPath: z.string().optional(),
  error: z.string().optional(),
  data: z.record(z.any()).optional(),
});

/**
 * Validate task input
 * @param {object} input - The input to validate
 * @returns {object} - Validated input
 */
export function validateTaskInput(input) {
  return TaskInputSchema.parse(input);
}

/**
 * Create a generation result
 * @param {boolean} success - Whether generation succeeded
 * @param {string} task - The task type
 * @param {object} options - Additional options
 * @returns {object} - Generation result
 */
export function createGenerationResult(success, task, options = {}) {
  return {
    success,
    task,
    outputPath: options.outputPath || null,
    error: options.error || null,
    data: options.data || null,
  };
}
