const fs = require("fs/promises");
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const {
  anonymizeText,
  createSessionVault,
  defaultOptions
} = require("./anonymizer");

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".log",
  ".xml",
  ".html"
]);

const EXTRACTED_AS_TEXT = new Set([".pdf", ".docx"]);

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function readTextFile(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractText(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (TEXT_EXTENSIONS.has(extension)) {
    return {
      originalExtension: extension,
      extractedAs: extension,
      text: await readTextFile(filePath)
    };
  }

  if (extension === ".docx") {
    return {
      originalExtension: extension,
      extractedAs: ".txt",
      text: await extractDocx(filePath)
    };
  }

  if (extension === ".pdf") {
    return {
      originalExtension: extension,
      extractedAs: ".txt",
      text: await extractPdf(filePath)
    };
  }

  throw new Error(`Formato non supportato: ${extension || "sconosciuto"}`);
}

function timestampLabel() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function clampPreview(text) {
  if (text.length <= 5000) {
    return text;
  }

  return `${text.slice(0, 5000)}\n\n[...]`;
}

function chooseOutputExtension(fileName, extractedAs, originalExtension) {
  if (TEXT_EXTENSIONS.has(originalExtension)) {
    return originalExtension;
  }

  if (EXTRACTED_AS_TEXT.has(originalExtension)) {
    return ".txt";
  }

  return extractedAs || ".txt";
}

function summarizeTotals(results) {
  const totals = {
    files: results.length,
    success: 0,
    failed: 0,
    replacements: {}
  };

  for (const result of results) {
    if (result.status === "ok") {
      totals.success += 1;
      for (const [label, count] of Object.entries(result.replacements)) {
        totals.replacements[label] = (totals.replacements[label] || 0) + count;
      }
    } else {
      totals.failed += 1;
    }
  }

  return totals;
}

async function anonymizeBatch(payload = {}) {
  const filePaths = payload.filePaths || [];
  const options = { ...defaultOptions, ...(payload.options || {}) };

  if (filePaths.length === 0) {
    throw new Error("Seleziona almeno un file.");
  }

  const baseOutputDir =
    payload.outputDir ||
    path.join(path.dirname(filePaths[0]), `anonymized-output-${timestampLabel()}`);

  await ensureDirectory(baseOutputDir);

  const sessionVault = createSessionVault();
  const results = [];

  for (const filePath of filePaths) {
    try {
      const extracted = await extractText(filePath);
      const anonymized = anonymizeText(extracted.text, options, sessionVault);
      const parsedName = path.parse(filePath);
      const outputExtension = chooseOutputExtension(
        parsedName.base,
        extracted.extractedAs,
        extracted.originalExtension
      );
      const outputName = `${parsedName.name}.anonymized${outputExtension}`;
      const outputPath = path.join(baseOutputDir, outputName);

      await fs.writeFile(outputPath, anonymized.text, "utf8");

      results.push({
        status: "ok",
        filePath,
        outputPath,
        originalExtension: extracted.originalExtension,
        outputExtension,
        replacements: anonymized.replacements,
        originalPreview: clampPreview(extracted.text),
        anonymizedPreview: clampPreview(anonymized.text)
      });
    } catch (error) {
      results.push({
        status: "error",
        filePath,
        message: error.message
      });
    }
  }

  const manifestPath = path.join(baseOutputDir, "manifest.json");
  const manifest = {
    createdAt: new Date().toISOString(),
    outputDir: baseOutputDir,
    options,
    totals: summarizeTotals(results),
    files: results.map((result) => ({
      status: result.status,
      filePath: result.filePath,
      outputPath: result.outputPath,
      replacements: result.replacements,
      message: result.message
    }))
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  return {
    outputDir: baseOutputDir,
    manifestPath,
    results,
    totals: manifest.totals
  };
}

module.exports = {
  anonymizeBatch
};
