import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

const PASSWORD_RESPONSES = {
  NEED_PASSWORD: 1,
  INCORRECT_PASSWORD: 2
};

const canvasToBlob = (canvas, type = "image/png", quality = 0.92) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The browser could not build the unlocked PDF pages."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });

function normalizeUnlockError(error) {
  if (error?.name === "PasswordException") {
    if (error.code === PASSWORD_RESPONSES.NEED_PASSWORD || error.code === PASSWORD_RESPONSES.INCORRECT_PASSWORD) {
      return new Error("Incorrect password");
    }
  }

  if (error?.name === "InvalidPDFException") {
    return new Error("Invalid PDF");
  }

  return new Error(error?.message || "Unable to unlock this PDF in the browser.");
}

export async function unlockPdfFile(file, password, { onProgress } = {}) {
  if (!file) {
    throw new Error("Choose a password-protected PDF first.");
  }

  if (!password) {
    throw new Error("Enter the correct password to unlock the PDF.");
  }

  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const { PDFDocument } = await import("pdf-lib");

    const sourceBytes = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(sourceBytes),
      password
    });
    const sourcePdf = await loadingTask.promise;
    const unlockedPdf = await PDFDocument.create();
    const pageCount = sourcePdf.numPages;

    onProgress?.(8);

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await sourcePdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const renderScale = Math.min(1.6, 1800 / Math.max(baseViewport.width, baseViewport.height));
      const viewport = page.getViewport({ scale: Math.max(renderScale, 1) });
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

      const imageBlob = await canvasToBlob(canvas, "image/png");
      const pngBytes = new Uint8Array(await imageBlob.arrayBuffer());
      const embeddedPage = await unlockedPdf.embedPng(pngBytes);
      const outputPage = unlockedPdf.addPage([baseViewport.width, baseViewport.height]);

      outputPage.drawImage(embeddedPage, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height
      });

      onProgress?.(Math.round(8 + (pageNumber / pageCount) * 92));
    }

    const unlockedBytes = await unlockedPdf.save({ useObjectStreams: true });
    const blob = new Blob([unlockedBytes], { type: "application/pdf" });

    return {
      blob,
      pageCount,
      originalSize: file.size,
      convertedSize: blob.size,
      fileName: `${file.name.replace(/\.pdf$/i, "")}-unlocked.pdf`
    };
  } catch (error) {
    throw normalizeUnlockError(error);
  }
}
