import Compressor from "compressorjs";

export const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MIME_EXTENSION_MAP = {
  "image/avif": "avif",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png"
};

export const futureRoadmap = Object.freeze({
  bulkUpload: {
    enabled: false,
    queueLimit: 10
  },
  targetSize: {
    enabled: false,
    preferredSizeKb: null
  },
  apiUpgrade: {
    enabled: false,
    endpoint: null
  }
});

export const DEFAULT_QUALITY_PERCENT = 80;

export function getSmartSettings(file) {
  if (file.size > 5 * 1024 * 1024) {
    return {
      quality: 0.4,
      maxWidth: file.size > 6 * 1024 * 1024 ? 1200 : 1600
    };
  }

  if (file.size > 2 * 1024 * 1024) {
    return {
      quality: 0.6,
      maxWidth: file.size > 3 * 1024 * 1024 ? 1600 : 1920
    };
  }

  return {
    quality: 0.8,
    maxWidth: 1920
  };
}

export function isSupportedInput(file) {
  return ACCEPTED_TYPES.has(file.type);
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function normalizeQualityPercent(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_QUALITY_PERCENT;
  }

  return Math.min(95, Math.max(30, Math.round(numericValue)));
}

export function percentToQuality(value) {
  return normalizeQualityPercent(value) / 100;
}

export function getReduction(beforeBytes, afterBytes) {
  if (!beforeBytes || !afterBytes) {
    return 0;
  }

  return ((beforeBytes - afterBytes) / beforeBytes) * 100;
}

export function getOutputFileName(mimeType, sourceName = "optimized") {
  const extension = MIME_EXTENSION_MAP[mimeType] ?? "jpg";
  return `optimized.${extension}`;
}

export function isCanvasMimeSupported(mimeType) {
  const canvas = document.createElement("canvas");

  try {
    return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

const mimeSupportCache = new Map();

export async function canEncodeMimeType(mimeType) {
  if (mimeSupportCache.has(mimeType)) {
    return mimeSupportCache.get(mimeType);
  }

  const supportPromise = detectCanvasEncodeSupport(mimeType);
  mimeSupportCache.set(mimeType, supportPromise);
  return supportPromise;
}

export async function resolveConversionMime(requestedMimeType) {
  if (requestedMimeType === "image/webp" && !(await canEncodeMimeType("image/webp"))) {
    return "image/jpeg";
  }

  return requestedMimeType;
}

export function compressWithCompressor(file, options) {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      convertSize: Number.POSITIVE_INFINITY,
      ...options,
      success(result) {
        resolve(result);
      },
      error(error) {
        reject(error);
      }
    });
  });
}

export async function canvasTranscode(blob, mimeType, quality = 0.8, fillColor = null) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is not available in this environment.");
  }

  const source = await loadCanvasSource(blob);
  canvas.width = source.width;
  canvas.height = source.height;

  if (fillColor) {
    context.fillStyle = fillColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(source.element, 0, 0, canvas.width, canvas.height);
  source.dispose();

  const transcoded = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
          return;
        }

        reject(new Error("The selected format could not be encoded."));
      },
      mimeType,
      quality
    );
  });

  return transcoded;
}

export async function blobToImageData(blob, fillColor = null) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is not available in this environment.");
  }

  const source = await loadCanvasSource(blob);
  canvas.width = source.width;
  canvas.height = source.height;

  if (fillColor) {
    context.fillStyle = fillColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(source.element, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  source.dispose();
  return imageData;
}

function detectCanvasEncodeSupport(mimeType) {
  if (!isCanvasMimeSupported(mimeType)) {
    return Promise.resolve(false);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");

  if (!context) {
    return Promise.resolve(false);
  }

  context.fillStyle = "#000";
  context.fillRect(0, 0, 1, 1);

  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          resolve(Boolean(blob) && blob.type === mimeType);
        },
        mimeType,
        0.8
      );
    } catch {
      resolve(false);
    }
  });
}

async function loadCanvasSource(blob) {
  if ("createImageBitmap" in window) {
    const imageBitmap = await createImageBitmap(blob);
    return {
      element: imageBitmap,
      width: imageBitmap.width,
      height: imageBitmap.height,
      dispose: () => imageBitmap.close()
    };
  }

  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("The image could not be prepared for conversion."));
      img.src = objectUrl;
    });

    return {
      element: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(objectUrl)
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
