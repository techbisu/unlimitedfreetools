import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export const readFileAsArrayBuffer = (file) => file.arrayBuffer();

export const blobToDownloadUrl = (blob) => URL.createObjectURL(blob);

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The browser could not generate the processed PDF page."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });

export function parsePageRanges(input, totalPages) {
  const cleaned = input.replace(/\s+/g, "");

  if (!cleaned) {
    throw new Error("Enter at least one page number or page range.");
  }

  const pages = new Set();

  for (const segment of cleaned.split(",")) {
    if (!segment) {
      continue;
    }

    if (segment.includes("-")) {
      const [rawStart, rawEnd] = segment.split("-");
      const start = Number(rawStart);
      const end = Number(rawEnd);

      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1 || start > end) {
        throw new Error("Page ranges must use ascending numbers like 1-3,5,8-10.");
      }

      for (let page = start; page <= end; page += 1) {
        if (page > totalPages) {
          throw new Error(`Page ${page} is outside this PDF. The file has ${totalPages} pages.`);
        }

        pages.add(page - 1);
      }
    } else {
      const page = Number(segment);

      if (!Number.isInteger(page) || page < 1 || page > totalPages) {
        throw new Error(`Page ${segment} is outside this PDF. The file has ${totalPages} pages.`);
      }

      pages.add(page - 1);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export async function mergePdfFiles(files) {
  if (!files?.length || files.length < 2) {
    throw new Error("Choose at least two PDF files to merge.");
  }

  const { PDFDocument } = await import("pdf-lib");
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const sourcePdf = await PDFDocument.load(await readFileAsArrayBuffer(file));
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  const bytes = await mergedPdf.save({ useObjectStreams: true });
  const blob = new Blob([bytes], { type: "application/pdf" });

  return {
    blob,
    pageCount: mergedPdf.getPageCount(),
    originalSize: files.reduce((sum, file) => sum + file.size, 0),
    convertedSize: blob.size,
    fileName: "merged-document.pdf"
  };
}

export async function splitPdfFile(file, rangeInput) {
  if (!file) {
    throw new Error("Choose a PDF file before splitting.");
  }

  const { PDFDocument } = await import("pdf-lib");
  const sourcePdf = await PDFDocument.load(await readFileAsArrayBuffer(file));
  const pageIndexes = parsePageRanges(rangeInput, sourcePdf.getPageCount());
  const splitPdf = await PDFDocument.create();
  const copiedPages = await splitPdf.copyPages(sourcePdf, pageIndexes);

  copiedPages.forEach((page) => {
    splitPdf.addPage(page);
  });

  const bytes = await splitPdf.save({ useObjectStreams: true });
  const blob = new Blob([bytes], { type: "application/pdf" });

  return {
    blob,
    pageCount: copiedPages.length,
    originalSize: file.size,
    convertedSize: blob.size,
    fileName: `${file.name.replace(/\.pdf$/i, "")}-pages-${rangeInput.replace(/\s+/g, "-")}.pdf`
  };
}

export async function compressPdfFile(file, { quality = 0.7, onProgress } = {}) {
  if (!file) {
    throw new Error("Choose a PDF file before compressing.");
  }

  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const { PDFDocument } = await import("pdf-lib");

  const sourceBytes = await readFileAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(sourceBytes) });

  if (onProgress) {
    loadingTask.onProgress = ({ loaded = 0, total = 0 }) => {
      const ratio = total ? loaded / total : 0;
      onProgress(Math.max(4, Math.round(ratio * 18)));
    };
  }

  const sourcePdf = await loadingTask.promise;
  const compressedPdf = await PDFDocument.create();
  const pageCount = sourcePdf.numPages;

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await sourcePdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const renderScale = Math.min(1.4, 1500 / Math.max(baseViewport.width, baseViewport.height));
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const context = canvas.getContext("2d", { alpha: false });

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    const pageBlob = await canvasToBlob(canvas, "image/jpeg", quality);
    const jpgBytes = new Uint8Array(await pageBlob.arrayBuffer());
    const embeddedImage = await compressedPdf.embedJpg(jpgBytes);
    const outputPage = compressedPdf.addPage([baseViewport.width, baseViewport.height]);

    outputPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height
    });

    onProgress?.(Math.round(18 + (pageNumber / pageCount) * 82));
  }

  const bytes = await compressedPdf.save({ useObjectStreams: true });
  const blob = new Blob([bytes], { type: "application/pdf" });

  return {
    blob,
    pageCount,
    originalSize: file.size,
    convertedSize: blob.size,
    fileName: `${file.name.replace(/\.pdf$/i, "")}-compressed.pdf`
  };
}
