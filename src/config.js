/**
 * Configuration for the NGO Document Generator.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

export const config = {
  // Paths
  rootDir,
  dataDir: join(rootDir, 'data'),
  templatesDir: join(rootDir, 'templates'),
  outputDir: join(rootDir, 'output'),
  excelFile: join(rootDir, 'data', 'dane_treningowe_wolontariat_LEVELUP.xlsx'),

  // Ollama settings (use host.docker.internal for Docker environments)
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:12b',

  // Template files
  templates: {
    references: 'references_template.pdf',
    cert: 'cert_template.pdf',
    internship: 'internship_template.pdf',
  },

  // Background template (used for all documents)
  backgroundTemplate: 'Untitled design.pdf',
};

/**
 * Get the template path for a given task
 * @param {string} task - The task type
 * @returns {string} - Template path
 */
export function getTemplatePath(task) {
  const template = config.templates[task];
  return template ? join(config.templatesDir, template) : '';
}

/**
 * Ensure all required directories exist
 */
export function ensureDirectories() {
  const dirs = [config.dataDir, config.templatesDir, config.outputDir];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export default config;
