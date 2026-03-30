const state = {
  filePaths: [],
  outputDir: null,
  results: [],
  selectedResultIndex: null
};

function $(selector) {
  return document.querySelector(selector);
}

function getOptions() {
  const options = {};
  document.querySelectorAll("[data-option]").forEach((input) => {
    options[input.dataset.option] = input.checked;
  });

  options.customTerms = $("#custom-terms").value;
  return options;
}

function setStatus(message) {
  $("#status-line").textContent = message;
}

function renderSummary() {
  $("#files-count").textContent = `${state.filePaths.length}`;
  $("#output-dir").textContent = state.outputDir || "Auto";
  $("#last-run").textContent = state.results.length
    ? `${state.results.filter((item) => item.status === "ok").length}/${state.results.length} completati`
    : "Nessuno";
  $("#file-list-meta").textContent = `${state.filePaths.length} file`;
}

function renderFileList() {
  const list = $("#file-list");
  list.innerHTML = "";

  if (state.filePaths.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "Nessun file selezionato.";
    list.appendChild(item);
    renderSummary();
    return;
  }

  state.filePaths.forEach((filePath, index) => {
    const button = document.createElement("button");
    if (index === state.selectedResultIndex) {
      button.classList.add("selected");
    }

    button.innerHTML = `
      <span class="file-name">${filePath.split(/[\\/]/).pop()}</span>
      <span class="file-path">${filePath}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedResultIndex = index;
      renderFileList();
    });

    const item = document.createElement("li");
    item.appendChild(button);
    list.appendChild(item);
  });

  renderSummary();
}

function renderResults() {
  $("#results-meta").textContent = state.results.length
    ? `${state.results.length} risultati`
    : "nessun batch";

  if (!state.results.length) {
    $("#results-empty").classList.remove("hidden");
    $("#result-detail").classList.add("hidden");
    renderSummary();
    return;
  }

  if (
    state.selectedResultIndex === null ||
    state.selectedResultIndex >= state.results.length
  ) {
    state.selectedResultIndex = 0;
  }

  const result = state.results[state.selectedResultIndex];
  $("#results-empty").classList.add("hidden");
  $("#result-detail").classList.remove("hidden");
  $("#detail-title").textContent = result.filePath.split(/[\\/]/).pop();
  $("#detail-subtitle").textContent =
    result.status === "ok"
      ? `${result.outputPath}`
      : `Errore: ${result.message}`;

  const tags = $("#replacement-tags");
  tags.innerHTML = "";

  if (result.status === "ok") {
    const entries = Object.entries(result.replacements || {});
    if (entries.length === 0) {
      const tag = document.createElement("span");
      tag.className = "replacement-tag";
      tag.textContent = "Nessuna sostituzione";
      tags.appendChild(tag);
    } else {
      entries.forEach(([label, count]) => {
        const tag = document.createElement("span");
        tag.className = "replacement-tag";
        tag.textContent = `${label}: ${count}`;
        tags.appendChild(tag);
      });
    }
  }

  $("#original-preview").textContent =
    result.originalPreview || "Preview non disponibile.";
  $("#anonymized-preview").textContent =
    result.anonymizedPreview || result.message || "Preview non disponibile.";

  renderSummary();
}

async function pickFiles() {
  const filePaths = await window.sgranadati.pickFiles();
  if (!filePaths.length) {
    return;
  }

  state.filePaths = Array.from(new Set([...state.filePaths, ...filePaths]));
  state.selectedResultIndex = 0;
  renderFileList();
  setStatus(`${filePaths.length} file aggiunti.`);
}

async function pickOutputDir() {
  const outputDir = await window.sgranadati.pickOutputDir();
  if (!outputDir) {
    return;
  }

  state.outputDir = outputDir;
  renderSummary();
  setStatus(`Output impostato su ${outputDir}`);
}

async function runAnonymization() {
  if (!state.filePaths.length) {
    setStatus("Seleziona almeno un file.");
    return;
  }

  setStatus("Anonimizzazione in corso...");

  try {
    const result = await window.sgranadati.runAnonymization({
      filePaths: state.filePaths,
      outputDir: state.outputDir,
      options: getOptions()
    });

    state.outputDir = result.outputDir;
    state.results = result.results;
    state.selectedResultIndex = 0;
    renderResults();
    renderSummary();
    setStatus(
      `Batch completato: ${result.totals.success} ok, ${result.totals.failed} errori. Manifest: ${result.manifestPath}`
    );
  } catch (error) {
    setStatus(error.message || "Errore durante l'anonimizzazione.");
  }
}

function setupDragAndDrop() {
  const dropzone = $("#dropzone");

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
    });
  });

  dropzone.addEventListener("drop", (event) => {
    const filePaths = Array.from(event.dataTransfer.files)
      .map((file) => file.path)
      .filter(Boolean);

    if (!filePaths.length) {
      return;
    }

    state.filePaths = Array.from(new Set([...state.filePaths, ...filePaths]));
    state.selectedResultIndex = 0;
    renderFileList();
    setStatus(`${filePaths.length} file aggiunti dal drag-and-drop.`);
  });
}

function bindEvents() {
  $("#pick-files").addEventListener("click", pickFiles);
  $("#pick-output").addEventListener("click", pickOutputDir);
  $("#run").addEventListener("click", runAnonymization);
  $("#open-output").addEventListener("click", () => {
    if (state.outputDir) {
      window.sgranadati.openPath(state.outputDir);
    }
  });
  $("#open-detail-output").addEventListener("click", () => {
    const result =
      state.selectedResultIndex === null ? null : state.results[state.selectedResultIndex];
    if (result && result.outputPath) {
      window.sgranadati.openPath(result.outputPath);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  setupDragAndDrop();
  renderFileList();
  renderResults();
  renderSummary();
});
