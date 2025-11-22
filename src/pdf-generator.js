/**
 * PDF generator for creating documents with background template.
 * Uses UTF-8 encoding with embedded fonts for Polish character support.
 */

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from './config.js';
import { TaskType } from './models.js';

// Font paths - DejaVu fonts support Polish characters
const FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const BOLD_FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

/**
 * Format current date in Polish format
 * @returns {string} - Formatted date
 */
function formatDate() {
  const date = new Date();
  const months = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Generate filename for output
 * @param {string} type - Document type
 * @param {string} surname - Person's surname
 * @param {string} name - Person's name
 * @returns {string} - Generated filename
 */
function generateFilename(type, surname, name) {
  const timestamp = Date.now();
  // Remove Polish characters from filename for compatibility
  const cleanSurname = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
  const cleanName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
  return `${type}_${cleanSurname}_${cleanName}_${timestamp}.pdf`;
}

/**
 * Load the background template PDF
 * @returns {Promise<Uint8Array|null>} - Template bytes or null
 */
async function loadBackgroundTemplate() {
  const templatePath = join(config.templatesDir, config.backgroundTemplate);

  if (!existsSync(templatePath)) {
    console.log(`Szablon tła nie znaleziony: ${templatePath}`);
    return null;
  }

  try {
    return readFileSync(templatePath);
  } catch (error) {
    console.error('Błąd ładowania szablonu:', error.message);
    return null;
  }
}

/**
 * Load and embed fonts with Polish character support
 * @param {PDFDocument} pdfDoc - PDF document
 * @returns {Promise<{font: PDFFont, boldFont: PDFFont}>}
 */
async function embedPolishFonts(pdfDoc) {
  // Register fontkit for custom font embedding
  pdfDoc.registerFontkit(fontkit);

  let font, boldFont;

  try {
    // Try to load DejaVu fonts (supports Polish characters)
    const fontBytes = readFileSync(FONT_PATH);
    const boldFontBytes = readFileSync(BOLD_FONT_PATH);

    font = await pdfDoc.embedFont(fontBytes, { subset: true });
    boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: true });
  } catch (error) {
    console.warn('Nie można załadować czcionek DejaVu, próbuję alternatywne...');

    // Fallback: try to find any TTF font
    const fallbackPaths = [
      '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
      '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
      '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    ];

    for (const path of fallbackPaths) {
      if (existsSync(path)) {
        try {
          const bytes = readFileSync(path);
          if (!font) font = await pdfDoc.embedFont(bytes, { subset: true });
          else if (!boldFont) boldFont = await pdfDoc.embedFont(bytes, { subset: true });
        } catch {
          continue;
        }
      }
    }

    // If still no fonts, use standard (without Polish support)
    if (!font || !boldFont) {
      const { StandardFonts } = await import('pdf-lib');
      font = font || await pdfDoc.embedFont(StandardFonts.Helvetica);
      boldFont = boldFont || await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      console.warn('Używam standardowych czcionek - polskie znaki mogą nie być wyświetlane poprawnie');
    }
  }

  return { font, boldFont };
}

/**
 * Create a PDF document with background template
 * @returns {Promise<{pdfDoc: PDFDocument, page: PDFPage, font: PDFFont, boldFont: PDFFont}>}
 */
async function createDocumentWithBackground() {
  const templateBytes = await loadBackgroundTemplate();

  let pdfDoc;
  let page;

  if (templateBytes) {
    // Load existing template
    pdfDoc = await PDFDocument.load(templateBytes);
    page = pdfDoc.getPages()[0];
  } else {
    // Create new document if no template
    pdfDoc = await PDFDocument.create();
    page = pdfDoc.addPage([595.28, 841.89]); // A4
  }

  const { font, boldFont } = await embedPolishFonts(pdfDoc);

  return { pdfDoc, page, font, boldFont };
}

/**
 * Draw text on page with word wrapping
 * @param {PDFPage} page - PDF page
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {object} options - Drawing options
 * @returns {number} - New Y position after text
 */
function drawWrappedText(page, text, x, y, options) {
  const { font, size = 11, maxWidth = 450, lineHeight = 14, color = rgb(0, 0, 0) } = options;

  if (!text || text.trim() === '') {
    return y - lineHeight;
  }

  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, size);

    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      line = word;
      currentY -= lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color });
    currentY -= lineHeight;
  }

  return currentY;
}

/**
 * Generate a references document
 * @param {object} data - Document data
 * @returns {Promise<string>} - Output path
 */
export async function generateReferences(data) {
  const filename = generateFilename('referencje', data.surname, data.name);
  const outputPath = join(config.outputDir, filename);
  mkdirSync(config.outputDir, { recursive: true });

  const { pdfDoc, page, font, boldFont } = await createDocumentWithBackground();
  const { height } = page.getSize();

  let y = height - 150; // Start below header area

  // Title
  page.drawText('REFERENCJE', {
    x: 220,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Place and date - right side, under title
  const dateText = `Łódź, ${formatDate()}`;
  const dateWidth = font.widthOfTextAtSize(dateText, 11);
  page.drawText(dateText, {
    x: 525 - dateWidth,
    y: y - 5,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 50;

  // Employee info
  const drawField = (label, value) => {
    page.drawText(label, { x: 70, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    y = drawWrappedText(page, value || '-', 200, y, { font, size: 11, maxWidth: 350 });
    y -= 5;
  };

  drawField('Imię i nazwisko:', `${data.name} ${data.surname}`);
  drawField('Okres współpracy:', `${data.startDate} - ${data.endDate}`);
  drawField('Zespół:', data.team);
  drawField('Główne zadania:', data.mainTasks);

  y -= 25;

  // Reference text - one joined paragraph from AI
  if (data.referenceText && data.referenceText.trim() !== '') {
    y = drawWrappedText(page, data.referenceText, 70, y, { font, size: 11, maxWidth: 470, lineHeight: 16 });
  }

  const pdfBytes = await pdfDoc.save();
  writeFileSync(outputPath, pdfBytes);
  console.log(`Wygenerowano PDF referencji: ${outputPath}`);
  return outputPath;
}

/**
 * Generate a certificate document
 * Uses data from Excel file. Only shows sections that have content.
 * @param {object} data - Document data
 * @returns {Promise<string>} - Output path
 */
export async function generateCert(data) {
  const filename = generateFilename('certyfikat', data.surname, data.name);
  const outputPath = join(config.outputDir, filename);
  mkdirSync(config.outputDir, { recursive: true });

  const { pdfDoc, page, font, boldFont } = await createDocumentWithBackground();
  const { width, height } = page.getSize();

  let y = height - 150;

  // Title
  const title = 'ZAŚWIADCZENIE';
  const titleWidth = boldFont.widthOfTextAtSize(title, 22);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 22,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Place and date - right side, under title
  const dateText = `Łódź, ${formatDate()}`;
  const dateWidth = font.widthOfTextAtSize(dateText, 11);
  page.drawText(dateText, {
    x: width - 70 - dateWidth,
    y: y - 5,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 60;

  // Main content
  const intro = 'Niniejszym zaświadcza się, że';
  const introWidth = font.widthOfTextAtSize(intro, 12);
  page.drawText(intro, {
    x: (width - introWidth) / 2,
    y,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 35;

  // Name
  const fullName = `${data.name} ${data.surname}`;
  const nameWidth = boldFont.widthOfTextAtSize(fullName, 18);
  page.drawText(fullName, {
    x: (width - nameWidth) / 2,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Description - uses data from Excel (team, dates)
  // Check if volunteer is active or inactive based on status
  const isActive = data.status && data.status.toLowerCase().includes('aktywny') && !data.status.toLowerCase().includes('nieaktywny');

  let description;
  if (isActive) {
    description = `jest aktywnym członkiem zespołu ${data.team} i działa w ramach programu e-wolontariatu, który wspiera misję społeczną LEVEL UP oraz kompetencje społeczno-zawodowe młodych ludzi. Współpraca rozpoczęła się ${data.startDate}.`;
  } else {
    description = `był(a) aktywnym członkiem zespołu ${data.team} w okresie od ${data.startDate} do ${data.endDate}. Działał(a) w ramach programu e-wolontariatu, który wspiera misję społeczną LEVEL UP oraz kompetencje społeczno-zawodowe młodych ludzi.`;
  }
  y = drawWrappedText(page, description, 70, y, { font, size: 12, maxWidth: 470, lineHeight: 18 });
  y -= 25;

  // Additional description from Ollama (2 sentences based on additional info)
  if (data.additionalDescription && data.additionalDescription.trim() !== '') {
    y = drawWrappedText(page, data.additionalDescription, 70, y, { font, size: 12, maxWidth: 470, lineHeight: 18 });
  }

  const pdfBytes = await pdfDoc.save();
  writeFileSync(outputPath, pdfBytes);
  console.log(`Wygenerowano PDF certyfikatu: ${outputPath}`);
  return outputPath;
}

/**
 * Generate an internship document
 * @param {object} data - Document data
 * @returns {Promise<string>} - Output path
 */
export async function generateInternship(data) {
  const filename = generateFilename('staz', data.surname, data.name);
  const outputPath = join(config.outputDir, filename);
  mkdirSync(config.outputDir, { recursive: true });

  const { pdfDoc, page, font, boldFont } = await createDocumentWithBackground();
  const { width, height } = page.getSize();

  let y = height - 150;

  // Title
  const title = 'OCENA STAŻU / PRAKTYKI';
  const titleWidth = boldFont.widthOfTextAtSize(title, 20);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Place and date - right side, under title
  const dateText = `Łódź, ${formatDate()}`;
  const dateWidth = font.widthOfTextAtSize(dateText, 11);
  page.drawText(dateText, {
    x: width - 70 - dateWidth,
    y: y - 5,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 50;

  // Intern info table
  const drawField = (label, value, highlight = false) => {
    page.drawText(label, { x: 70, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    const valueColor = highlight ? rgb(0, 0.4, 0.8) : rgb(0, 0, 0);
    page.drawText(value || '-', { x: 220, y, size: 11, font: highlight ? boldFont : font, color: valueColor });
    y -= 18;
  };

  drawField('Imię i nazwisko:', `${data.name} ${data.surname}`);
  drawField('Okres stażu:', `${data.startDate} - ${data.endDate}`);
  drawField('Zespół/Dział:', data.team);
  drawField('Ocena końcowa:', data.grade || 'Dobra', true);

  y -= 20;

  // Evaluation sections
  const sections = [
    { title: 'Główne zadania i obowiązki:', content: data.mainTasks },
    { title: 'Udział w projektach:', content: data.mainProjects },
    { title: 'Zaangażowanie w onboarding:', content: data.onboardingEngagement },
    { title: 'Kluczowe osiągnięcia:', content: data.achievements },
    { title: 'Cechy charakteru:', content: data.characteristics },
    { title: 'Porównanie z wymaganiami uczelni:', content: data.requirementsComparison },
  ];

  for (const section of sections) {
    page.drawText(section.title, { x: 70, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    y -= 16;
    y = drawWrappedText(page, section.content || '-', 70, y, { font, size: 10, maxWidth: 470, lineHeight: 13 });
    y -= 12;

    // Check if we need to add a new page
    if (y < 100) {
      pdfDoc.addPage([595.28, 841.89]);
      y = 750;
    }
  }

  const pdfBytes = await pdfDoc.save();
  writeFileSync(outputPath, pdfBytes);
  console.log(`Wygenerowano PDF stażu: ${outputPath}`);
  return outputPath;
}

/**
 * Generate a PDF document based on task type
 * @param {string} task - Task type
 * @param {object} data - Document data
 * @returns {Promise<string>} - Output path
 */
export async function generatePDF(task, data) {
  const generators = {
    [TaskType.REFERENCES]: generateReferences,
    [TaskType.CERT]: generateCert,
    [TaskType.INTERNSHIP]: generateInternship,
  };

  const generator = generators[task];
  if (!generator) {
    throw new Error(`Nieznany typ dokumentu: ${task}`);
  }

  return generator(data);
}

export default { generateReferences, generateCert, generateInternship, generatePDF };
