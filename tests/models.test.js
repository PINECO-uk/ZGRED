/**
 * Tests for data models.
 */

import { jest } from '@jest/globals';
import {
  TaskType,
  TaskInputSchema,
  validateTaskInput,
  createGenerationResult,
} from '../src/models.js';

describe('TaskType', () => {
  test('should have correct values', () => {
    expect(TaskType.REFERENCES).toBe('references');
    expect(TaskType.CERT).toBe('cert');
    expect(TaskType.INTERNSHIP).toBe('internship');
  });
});

describe('TaskInputSchema', () => {
  test('should validate correct input', () => {
    const input = {
      task: 'references',
      name: 'Anna',
      surname: 'Kowalska',
      role: 'Volunteer',
      additionalInfo: 'Active team member',
    };

    const result = TaskInputSchema.parse(input);
    expect(result.task).toBe('references');
    expect(result.name).toBe('Anna');
    expect(result.surname).toBe('Kowalska');
  });

  test('should reject invalid task type', () => {
    const input = {
      task: 'invalid',
      name: 'Anna',
      surname: 'Kowalska',
    };

    expect(() => TaskInputSchema.parse(input)).toThrow();
  });

  test('should require name and surname', () => {
    const input = {
      task: 'cert',
    };

    expect(() => TaskInputSchema.parse(input)).toThrow();
  });

  test('should have default values for optional fields', () => {
    const input = {
      task: 'cert',
      name: 'Jan',
      surname: 'Nowak',
    };

    const result = TaskInputSchema.parse(input);
    expect(result.role).toBe('');
    expect(result.additionalInfo).toBe('');
  });
});

describe('validateTaskInput', () => {
  test('should return validated input', () => {
    const input = {
      task: 'internship',
      name: 'Maria',
      surname: 'Wisniewska',
    };

    const result = validateTaskInput(input);
    expect(result.task).toBe('internship');
  });
});

describe('createGenerationResult', () => {
  test('should create success result', () => {
    const result = createGenerationResult(true, 'cert', {
      outputPath: '/path/to/file.pdf',
    });

    expect(result.success).toBe(true);
    expect(result.task).toBe('cert');
    expect(result.outputPath).toBe('/path/to/file.pdf');
    expect(result.error).toBeNull();
  });

  test('should create failure result', () => {
    const result = createGenerationResult(false, 'references', {
      error: 'Employee not found',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Employee not found');
    expect(result.outputPath).toBeNull();
  });
});
