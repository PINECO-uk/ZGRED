/**
 * ZGRED - Express Server for Web Interface
 * Generator Dokumentów NGO
 */

import express from "express";
import { fileURLToPath } from "url";
import { dirname, join, basename } from "path";
import { existsSync, readdirSync } from "fs";

import { processTask } from "./task-processor.js";
import { getAllEmployees } from "./excel-handler.js";
import { config, ensureDirectories, ensureOllama } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, "..", "public")));

// Ensure directories exist
ensureDirectories();
const ollama_ok = await ensureOllama();

/**
 * Get all volunteers
 */
app.get("/api/volunteers", (req, res) => {
  try {
    const employees = getAllEmployees();
    const volunteers = employees.map((emp, index) => {
      const fullName = emp["Imie Nazwisko"] || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const surname = nameParts.slice(1).join(" ") || "";

      return {
        id: `vol_${index}`,
        name: fullName,
        firstName,
        surname,
        team: emp["Team - od 1.08.2022"] || "",
        startDate: emp["Data rozpoczęcia"] || "",
        endDate: emp["Data zakończenia"] || "",
        status: emp["Status"] || "",
        mainTasks: emp["Zakres obowiązków"] || "",
        type: emp["Rodzaj"] || "",
      };
    });

    res.json(volunteers);
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    res.status(500).json({ error: "Failed to fetch volunteers" });
  }
});

/**
 * Search volunteers
 */
app.get("/api/volunteers/search", (req, res) => {
  try {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) {
      return res.json([]);
    }

    const employees = getAllEmployees();
    const volunteers = employees
      .map((emp, index) => {
        const fullName = emp["Imie Nazwisko"] || "";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "";
        const surname = nameParts.slice(1).join(" ") || "";

        return {
          id: `vol_${index}`,
          name: fullName,
          firstName,
          surname,
          team: emp["Team - od 1.08.2022"] || "",
          startDate: emp["Data rozpoczęcia"] || "",
          endDate: emp["Data zakończenia"] || "",
          status: emp["Status"] || "",
          mainTasks: emp["Zakres obowiązków"] || "",
          type: emp["Rodzaj"] || "",
        };
      })
      .filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.team.toLowerCase().includes(query)
      )
      .slice(0, 10);

    res.json(volunteers);
  } catch (error) {
    console.error("Error searching volunteers:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * Generate document
 */
app.post("/api/generate", async (req, res) => {
  try {
    const { task, name, surname, additionalInfo } = req.body;

    if (!task || !name || !surname) {
      return res.status(400).json({
        success: false,
        error: "Brakuje wymaganych pól: task, name, surname",
      });
    }

    // Validate task type
    const validTasks = ["references", "cert", "internship"];
    if (!validTasks.includes(task)) {
      return res.status(400).json({
        success: false,
        error: `Nieprawidłowy typ dokumentu: ${task}`,
      });
    }

    // For references, additional info is required
    if (task === "references" && (!additionalInfo || !additionalInfo.trim())) {
      return res.status(400).json({
        success: false,
        error: "Referencje wymagają dodatkowych informacji",
      });
    }

    console.log(`Generating ${task} for ${name} ${surname}`);

    const taskInput = {
      task,
      name,
      surname,
      role: "",
      additionalInfo: additionalInfo || "",
    };

    const result = await processTask(taskInput);

    if (result.success) {
      const filename = basename(result.outputPath);
      res.json({
        success: true,
        filename,
        outputPath: result.outputPath,
      });
    } else {
      res.json({
        success: false,
        error: result.error || "Generowanie dokumentu nie powiodło się",
      });
    }
  } catch (error) {
    console.error("Error generating document:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Błąd serwera",
    });
  }
});

/**
 * Download generated PDF
 */
app.get("/api/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = join(config.outputDir, filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "Plik nie został znaleziony" });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Błąd pobierania pliku" });
  }
});

/**
 * List generated documents
 */
app.get("/api/documents", (req, res) => {
  try {
    if (!existsSync(config.outputDir)) {
      return res.json([]);
    }

    const files = readdirSync(config.outputDir)
      .filter((f) => f.endsWith(".pdf"))
      .map((f) => ({
        filename: f,
        path: `/api/download/${encodeURIComponent(f)}`,
      }));

    res.json(files);
  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "ZGRED" });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                      ZGRED                         ║
║         Generator Dokumentów NGO                   ║
╚════════════════════════════════════════════════════╝

🌐 Serwer uruchomiony na: http://localhost:${PORT}
   Ollama działa: ${ollama_ok}

📄 Dostępne endpointy:
   GET  /api/volunteers        - Lista wolontariuszy
   GET  /api/volunteers/search - Wyszukiwanie wolontariuszy
   POST /api/generate          - Generowanie dokumentu
   GET  /api/download/:file    - Pobieranie PDF
   GET  /api/documents         - Lista wygenerowanych dokumentów
  `);
});

export default app;
