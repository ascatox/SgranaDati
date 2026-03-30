const ENTITY_STOPWORDS = new Set([
  "Analisi",
  "Documento",
  "Cliente",
  "Fattura",
  "Verbale",
  "Allegato",
  "Pagina",
  "Comune",
  "Provincia",
  "Codice",
  "Numero",
  "Oggetto",
  "Richiesta"
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createSessionVault() {
  return {
    map: new Map(),
    counts: new Map()
  };
}

function nextPlaceholder(vault, label) {
  const next = (vault.counts.get(label) || 0) + 1;
  vault.counts.set(label, next);
  return `[${label}_${next}]`;
}

function getPlaceholder(vault, label, rawValue) {
  const normalized = `${label}:${rawValue.trim().toLowerCase()}`;
  const existing = vault.map.get(normalized);
  if (existing) {
    return existing;
  }

  const placeholder = nextPlaceholder(vault, label);
  vault.map.set(normalized, placeholder);
  return placeholder;
}

function buildRules() {
  return [
    {
      key: "emails",
      label: "EMAIL",
      regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
    },
    {
      key: "phones",
      label: "PHONE",
      regex: /(?<!\w)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d(?:[\s.-]?\d){6,12}(?!\w)/g
    },
    {
      key: "taxCodes",
      label: "CODICE_FISCALE",
      regex: /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g
    },
    {
      key: "vatNumbers",
      label: "PARTITA_IVA",
      regex: /\b(?:IT)?\d{11}\b/g
    },
    {
      key: "ibans",
      label: "IBAN",
      regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g
    },
    {
      key: "creditCards",
      label: "CARD",
      regex: /\b(?:\d[ -]*?){13,19}\b/g
    },
    {
      key: "dates",
      label: "DATE",
      regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g
    },
    {
      key: "addresses",
      label: "ADDRESS",
      regex: /\b(?:via|viale|piazza|corso|largo|vicolo|strada)\s+[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}(?:,\s*\d{1,4})?\b/gi
    }
  ];
}

function applyRegexRule(text, rule, options, vault, counters) {
  if (!options[rule.key]) {
    return text;
  }

  return text.replace(rule.regex, (match) => {
    const trimmed = match.trim();
    if (!trimmed) {
      return match;
    }

    const placeholder = getPlaceholder(vault, rule.label, trimmed);
    counters[rule.label] = (counters[rule.label] || 0) + 1;
    return placeholder;
  });
}

function applyCustomTerms(text, options, vault, counters) {
  const raw = options.customTerms || "";
  const terms = raw
    .split(/\n|,/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 2)
    .sort((left, right) => right.length - left.length);

  let output = text;
  for (const term of terms) {
    const regex = new RegExp(escapeRegExp(term), "gi");
    output = output.replace(regex, (match) => {
      const placeholder = getPlaceholder(vault, "CUSTOM", match);
      counters.CUSTOM = (counters.CUSTOM || 0) + 1;
      return placeholder;
    });
  }

  return output;
}

function applyPersonHeuristic(text, options, vault, counters) {
  if (!options.personNamesHeuristic) {
    return text;
  }

  const personRegex =
    /\b([A-ZÀ-Ý][a-zà-ÿ'`-]{1,20}(?:\s+[A-ZÀ-Ý][a-zà-ÿ'`-]{1,20}){1,2})\b/g;

  return text.replace(personRegex, (match) => {
    if (match.includes("[") || ENTITY_STOPWORDS.has(match)) {
      return match;
    }

    const placeholder = getPlaceholder(vault, "PERSON", match);
    counters.PERSON = (counters.PERSON || 0) + 1;
    return placeholder;
  });
}

function anonymizeText(inputText, options = {}, sessionVault = createSessionVault()) {
  const counters = {};
  let output = inputText;

  for (const rule of buildRules()) {
    output = applyRegexRule(output, rule, options, sessionVault, counters);
  }

  output = applyCustomTerms(output, options, sessionVault, counters);
  output = applyPersonHeuristic(output, options, sessionVault, counters);

  return {
    text: output,
    replacements: counters,
    sessionVault
  };
}

const defaultOptions = {
  emails: true,
  phones: true,
  taxCodes: true,
  vatNumbers: true,
  ibans: true,
  creditCards: true,
  dates: false,
  addresses: false,
  personNamesHeuristic: false,
  customTerms: ""
};

module.exports = {
  anonymizeText,
  createSessionVault,
  defaultOptions
};
