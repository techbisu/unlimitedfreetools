import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

async function getPdfJs() {
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  return pdfjsLib;
}

export async function renderPdfToImages(file, { scale = 1.6, format = "image/png", quality = 0.92, onProgress } = {}) {
  const pdfjsLib = await getPdfJs();
  const bytes = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });

  loadingTask.onProgress = ({ loaded = 0, total = 0 }) => {
    if (!onProgress || !total) {
      return;
    }

    onProgress(Math.max(4, Math.round((loaded / total) * 16)));
  };

  const pdf = await loadingTask.promise;
  const images = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (!nextBlob) {
            reject(new Error("Unable to convert the PDF page into an image."));
            return;
          }

          resolve(nextBlob);
        },
        format,
        quality
      );
    });

    images.push({
      pageNumber,
      width: canvas.width,
      height: canvas.height,
      blob,
      previewUrl: URL.createObjectURL(blob),
      suggestedName: `${file.name.replace(/\.pdf$/i, "")}-page-${pageNumber}.${format === "image/jpeg" ? "jpg" : "png"}`
    });

    onProgress?.(Math.round(16 + (pageNumber / pdf.numPages) * 84));
  }

  return {
    pageCount: pdf.numPages,
    images
  };
}

export async function renderPdfFirstPageToImage(file, { scale = 1.5 } = {}) {
  const pdfjsLib = await getPdfJs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext("2d", { alpha: false });

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport
  }).promise;

  return {
    canvas,
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
    pageCount: pdf.numPages
  };
}
