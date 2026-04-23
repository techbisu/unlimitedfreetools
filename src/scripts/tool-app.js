import { convertImage } from "./convert.js";
import { compressImage } from "./smart-compress.js";
import { formatBytes, getReduction, isSupportedInput, normalizeQualityPercent, percentToQuality } from "./toolkit.js";

const DEFAULT_STATUS = {
  originalMeta: "Upload an image to see it here.",
  optimizedMeta: "Processed output will appear here."
};

document.querySelectorAll("[data-image-tool]").forEach((root) => {
  initTool(root);
});

function initTool(root) {
  const state = {
    mode: root.dataset.initialMode === "convert" ? "convert" : "compress",
    currentObjectUrls: [],
    currentFile: null,
    reprocessTimer: null,
    isProcessing: false,
    needsReprocess: false,
    originalUrl: null
  };

  const input = root.querySelector("[data-file-input]");
  const uploadTrigger = root.querySelector("[data-upload-trigger]");
  const dropzone = root.querySelector("[data-dropzone]");
  const formatWrap = root.querySelector("[data-format-wrap]");
  const formatSelect = root.querySelector("[data-format-select]");
  const processing = root.querySelector("[data-processing]");
  const error = root.querySelector("[data-error]");
  const originalSize = root.querySelector("[data-original-size]");
  const optimizedSize = root.querySelector("[data-optimized-size]");
  const reduction = root.querySelector("[data-reduction]");
  const originalMeta = root.querySelector("[data-original-meta]");
  const optimizedMeta = root.querySelector("[data-optimized-meta]");
  const originalPreview = root.querySelector("[data-original-preview]");
  const optimizedPreview = root.querySelector("[data-optimized-preview]");
  const outputName = root.querySelector("[data-output-name]");
  const downloadLink = root.querySelector("[data-download]");
  const downloadWrap = root.querySelector("[data-download-wrap]");
  const modeButtons = root.querySelectorAll("[data-mode-button]");
  const qualityMode = root.querySelector("[data-quality-mode]");
  const qualitySlider = root.querySelector("[data-quality-slider]");
  const qualityValue = root.querySelector("[data-quality-value]");
  const qualityHint = root.querySelector("[data-quality-hint]");
  const avifSettings = root.querySelector("[data-avif-settings]");
  const avifLossless = root.querySelector("[data-avif-lossless]");
  const settingsAccordion = root.querySelector("[data-settings-accordion]");

  setMode(state.mode);
  syncQualityControls();
  syncMobileAccordion();

  uploadTrigger?.addEventListener("click", () => input?.click());
  input?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentFile(file);
    }
  });

  dropzone?.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dropzone.dataset.dragging = "true";
  });

  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.dataset.dragging = "true";
  });

  dropzone?.addEventListener("dragleave", (event) => {
    event.preventDefault();
    if (!dropzone.contains(event.relatedTarget)) {
      dropzone.dataset.dragging = "false";
    }
  });

  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.dataset.dragging = "false";
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      setCurrentFile(file);
    }
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.modeButton === "convert" ? "convert" : "compress");
      clearError();
    });
  });

  qualityMode?.addEventListener("change", () => {
    syncQualityControls();
    scheduleReprocess();
  });

  qualitySlider?.addEventListener("input", () => {
    syncQualityControls();
    scheduleReprocess();
  });

  formatSelect?.addEventListener("change", () => {
    syncQualityControls();
    scheduleReprocess();
  });

  avifLossless?.addEventListener("change", () => {
    syncQualityControls();
    scheduleReprocess();
  });

  window.addEventListener("beforeunload", revokeObjectUrls);

  async function setCurrentFile(file) {
    clearError();

    if (!isSupportedInput(file)) {
      showError("Unsupported format. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    state.currentFile = file;
    revokeObjectUrls();
    const originalUrl = registerObjectUrl(URL.createObjectURL(file));
    state.originalUrl = originalUrl;
    originalPreview.src = originalUrl;
    originalSize.textContent = formatBytes(file.size);
    originalMeta.textContent = `${file.name} - ${file.type.replace("image/", "").toUpperCase()}`;
    if (settingsAccordion && window.innerWidth < 640) {
      settingsAccordion.open = true;
    }
    await processCurrentFile();
  }

  async function processCurrentFile() {
    const file = state.currentFile;
    if (!file) {
      return;
    }

    if (state.isProcessing) {
      state.needsReprocess = true;
      return;
    }

    state.isProcessing = true;
    state.needsReprocess = false;
    revokeDerivedObjectUrls();
    processing?.classList.remove("hidden");
    optimizedMeta.textContent = "Working on your optimized preview...";
    optimizedPreview.removeAttribute("src");
    optimizedSize.textContent = "Processing";
    reduction.textContent = "...";
    reduction.classList.remove("text-rose-600");
    reduction.classList.add("text-emerald-700");
    disableDownload();

    try {
      const result =
        state.mode === "compress"
          ? await compressImage(file, getProcessingOptions())
          : await convertImage(file, formatSelect?.value, getProcessingOptions());

      const optimizedUrl = registerObjectUrl(URL.createObjectURL(result.blob));
      optimizedPreview.src = optimizedUrl;
      optimizedSize.textContent = formatBytes(result.blob.size);
      optimizedMeta.textContent =
        result.fallbackNotice ||
        getResultMetaText(result);

      const delta = getReduction(file.size, result.blob.size);
      reduction.textContent = delta === 0 ? "0.0%" : `${delta >= 0 ? "-" : "+"}${Math.abs(delta).toFixed(1)}%`;

      if (delta < 0) {
        reduction.classList.remove("text-emerald-700");
        reduction.classList.add("text-rose-600");
      }

      const finalName = result.fileName || "optimized.webp";
      outputName.textContent = finalName;
      downloadLink.href = optimizedUrl;
      downloadLink.download = finalName;
      downloadLink.classList.remove("pointer-events-none", "opacity-50");
      downloadLink.setAttribute("aria-disabled", "false");
      downloadWrap?.classList.remove("hidden");
    } catch (processingError) {
      optimizedMeta.textContent = DEFAULT_STATUS.optimizedMeta;
      optimizedSize.textContent = "Waiting";
      reduction.textContent = "0%";
      showError(normalizeError(processingError, state.mode, formatSelect?.value));
    } finally {
      state.isProcessing = false;
      processing?.classList.add("hidden");
      if (input) {
        input.value = "";
      }

      if (state.needsReprocess) {
        state.needsReprocess = false;
        await processCurrentFile();
      }
    }
  }

  function setMode(mode) {
    state.mode = mode;
    root.dataset.initialMode = mode;
    formatWrap?.classList.toggle("hidden", mode !== "convert");
    modeButtons.forEach((button) => {
      button.dataset.active = String(button.dataset.modeButton === mode);
    });
    syncQualityControls();
    scheduleReprocess();
  }

  function showError(message) {
    if (!error) {
      return;
    }

    error.textContent = message;
    error.classList.remove("hidden");
  }

  function clearError() {
    if (!error) {
      return;
    }

    error.textContent = "";
    error.classList.add("hidden");
  }

  function disableDownload() {
    downloadLink.removeAttribute("href");
    downloadLink.download = "";
    outputName.textContent = "optimized.webp";
    downloadLink.classList.add("pointer-events-none", "opacity-50");
    downloadLink.setAttribute("aria-disabled", "true");
    downloadWrap?.classList.add("hidden");
  }

  function registerObjectUrl(url) {
    state.currentObjectUrls.push(url);
    return url;
  }

  function revokeObjectUrls() {
    if (state.reprocessTimer) {
      clearTimeout(state.reprocessTimer);
      state.reprocessTimer = null;
    }

    state.currentObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.currentObjectUrls = [];
    state.originalUrl = null;
  }

  function getProcessingOptions() {
    const manualQualityEnabled = qualityMode?.value === "manual" && !isQualityDisabledForCurrentMode();

    if (!manualQualityEnabled) {
      return {
        manualQuality: false,
        losslessAvif: isLosslessAvifMode()
      };
    }

    return {
      manualQuality: true,
      quality: percentToQuality(qualitySlider?.value ?? 80),
      losslessAvif: isLosslessAvifMode()
    };
  }

  function isQualityDisabledForCurrentMode() {
    return (state.mode === "convert" && formatSelect?.value === "image/png") || isLosslessAvifMode();
  }

  function isLosslessAvifMode() {
    return state.mode === "convert" && formatSelect?.value === "image/avif" && avifLossless?.checked === true;
  }

  function syncQualityControls() {
    const sliderPercent = normalizeQualityPercent(qualitySlider?.value ?? 80);
    if (qualitySlider) {
      qualitySlider.value = String(sliderPercent);
    }

    if (qualityValue) {
      qualityValue.textContent = `${sliderPercent}%`;
    }

    const manualEnabled = qualityMode?.value === "manual";
    const avifSelected = state.mode === "convert" && formatSelect?.value === "image/avif";
    const disabledForFormat = isQualityDisabledForCurrentMode();
    const shouldDisableSlider = !manualEnabled || disabledForFormat;

    avifSettings?.classList.toggle("hidden", !avifSelected);

    if (qualitySlider) {
      qualitySlider.disabled = shouldDisableSlider;
    }

    if (qualityHint) {
      qualityHint.textContent =
        state.mode === "convert" && formatSelect?.value === "image/png"
          ? "PNG export is lossless here, so the quality slider does not apply."
          : isLosslessAvifMode()
            ? "Lossless AVIF keeps original quality, so the quality slider does not apply."
            : manualEnabled
              ? "Lower quality usually means smaller files."
              : "Auto uses smart settings based on file size.";
    }
  }

  function scheduleReprocess() {
    if (!state.currentFile) {
      return;
    }

    if (state.reprocessTimer) {
      clearTimeout(state.reprocessTimer);
    }

    state.reprocessTimer = window.setTimeout(async () => {
      state.reprocessTimer = null;
      await processCurrentFile();
    }, 180);
  }

  function syncMobileAccordion() {
    if (!settingsAccordion) {
      return;
    }

    if (window.innerWidth < 640 && !state.currentFile) {
      settingsAccordion.open = false;
      return;
    }

    settingsAccordion.open = true;
  }

  function revokeDerivedObjectUrls() {
    if (!state.currentObjectUrls.length) {
      return;
    }

    const keepUrl = state.originalUrl;
    const nextUrls = [];

    for (const url of state.currentObjectUrls) {
      if (url === keepUrl) {
        nextUrls.push(url);
        continue;
      }

      URL.revokeObjectURL(url);
    }

    state.currentObjectUrls = nextUrls;
  }

  function getResultMetaText(result) {
    if (result.summaryLabel) {
      return result.summaryLabel;
    }

    return `${result.mimeType.replace("image/", "").toUpperCase()} - max width ${result.settings.maxWidth}px - quality ${result.settings.quality}`;
  }
}

function normalizeError(error, mode, selectedFormat) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (mode === "convert" && selectedFormat === "image/avif") {
    return "AVIF conversion is not available here. Try WebP or JPG instead.";
  }

  return "Something went wrong while processing the image. Please try another file.";
}

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-image-tool]").forEach((root) => {
    const accordion = root.querySelector("[data-settings-accordion]");
    const hasFile = root.querySelector("[data-original-preview]")?.getAttribute("src");

    if (!accordion) {
      return;
    }

    accordion.open = window.innerWidth >= 640 || Boolean(hasFile);
  });
});
