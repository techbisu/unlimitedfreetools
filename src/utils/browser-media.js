export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode the selected image."));
    image.src = src;
  });

export async function readImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  return {
    dataUrl,
    image
  };
}

export const canvasToBlob = (canvas, type = "image/png", quality = 0.92) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The browser could not create the exported file."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export async function downloadCanvas(canvas, filename, type = "image/png", quality = 0.92) {
  const blob = await canvasToBlob(canvas, type, quality);
  downloadBlob(blob, filename);
}

export function downloadTextFile(text, filename, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  downloadBlob(blob, filename);
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

export async function copyCanvasToClipboard(canvas) {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard image copy is not supported in this browser.");
  }

  const blob = await canvasToBlob(canvas);
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob
    })
  ]);
}

export async function shareCanvas(canvas, { filename, title, text, url } = {}) {
  const shareUrl = url ?? window.location.href;
  const shareTitle = title ?? document.title;
  const shareText = text ?? "Check this out";

  if (navigator.share) {
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], filename ?? "export.png", { type: blob.type });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        files: [file]
      });
      return "file";
    }

    await navigator.share({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    });
    return "url";
  }

  await copyText(shareUrl);
  return "copied-url";
}

export async function shareTextResult(text, { title, shareText, url } = {}) {
  const shareUrl = url ?? window.location.href;
  const nextTitle = title ?? document.title;

  if (navigator.share) {
    await navigator.share({
      title: nextTitle,
      text: shareText ?? text,
      url: shareUrl
    });
    return "share";
  }

  await copyText(text);
  return "copied-text";
}

export function fitWithin(width, height, maxDimension = 1600) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height, scale: 1 };
  }

  const scale = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale
  };
}
