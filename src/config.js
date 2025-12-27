/**
 * Configuration for the NGO Document Generator.
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

export const config = {
  // Paths
  rootDir,
  dataDir: join(rootDir, "data"),
  templatesDir: join(rootDir, "templates"),
  outputDir: join(rootDir, "output"),
  excelFile: join(rootDir, "data", "dane_treningowe_wolontariat_LEVELUP_update.xlsx"),

  // Ollama settings (use localhost:11434 for Ollama on Windows host)
  ollamaBaseUrl:
    process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.2:3b",

  // Template files
  templates: {
    references: "references_template.pdf",
    cert: "cert_template.pdf",
    internship: "internship_template.pdf",
  },

  // Background template (used for all documents)
  backgroundTemplate: "Zaświadczenia wolontariat i praktyki.pdf",
};

/**
 * Get the template path for a given task
 * @param {string} task - The task type
 * @returns {string} - Template path
 */
export function getTemplatePath(task) {
  const template = config.templates[task];
  return template ? join(config.templatesDir, template) : "";
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

/**
 * Ensure Ollama is running under the port and host
 */
export async function esnureOllama(host = config.ollamaBaseUrl) {
  const url = `${host}/api/tags`;

  const attempts = 2;
  const timeoutMs = 2000;
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal });

      clearTimeout(id);

      if (res.ok) {
        console.log(`[OLLAMA]: Ok`);
        return true;
      }
    } catch (err) {
      console.log(`[OLLAMA]: Ollama is not running under ${host}`);
    }

    // exponential backoff with jitter
    const backoff =
      Math.min(2000, 300 * attempt) + Math.floor(Math.random() * 100);
    await wait(backoff);
  }
  console.log("Exiting.");
  process.exit(1);
}
export const ensureOllama = esnureOllama;
export default config;
