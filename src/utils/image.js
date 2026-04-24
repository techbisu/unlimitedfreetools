export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to preview the selected image."));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode the selected image."));
    image.src = src;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The browser could not create the converted image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });

export async function convertImage({
  file,
  format = "image/webp",
  quality = 0.82
}) {
  const sourceUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);

  let blob;

  if (format === "image/avif") {
    const { encode } = await import("@jsquash/avif");
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const cqLevel = Math.round((1 - quality) * 45);
    const buffer = await encode(imageData, {
      cqLevel,
      speed: 6
    });
    blob = new Blob([buffer], { type: "image/avif" });
  } else {
    blob = await canvasToBlob(canvas, format, quality);
  }

  return {
    blob,
    originalSize: file.size,
    convertedSize: blob.size,
    width: image.naturalWidth,
    height: image.naturalHeight,
    previewUrl: URL.createObjectURL(blob),
    sourceUrl
  };
}
