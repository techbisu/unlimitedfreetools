const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
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
          reject(new Error("The browser could not create the edited image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getMimeExtension = (format) => {
  if (format === "image/jpeg") {
    return "jpg";
  }

  if (format === "image/webp") {
    return "webp";
  }

  return "png";
};

const getPosition = ({ position, width, height, padding, containerWidth, containerHeight }) => {
  const positions = {
    "top-left": { x: padding, y: padding },
    "top-right": { x: containerWidth - width - padding, y: padding },
    "bottom-left": { x: padding, y: containerHeight - height - padding },
    "bottom-right": { x: containerWidth - width - padding, y: containerHeight - height - padding },
    center: {
      x: (containerWidth - width) / 2,
      y: (containerHeight - height) / 2
    }
  };

  return positions[position] ?? positions["bottom-right"];
};

const drawRoundedRect = (context, x, y, width, height, radius) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const buildResult = async ({ canvas, file, format, quality = 0.92, fileName, summary }) => {
  const blob = await canvasToBlob(canvas, format, format === "image/png" ? undefined : quality);

  return {
    blob,
    originalSize: file.size,
    outputSize: blob.size,
    width: canvas.width,
    height: canvas.height,
    previewUrl: URL.createObjectURL(blob),
    fileName,
    summary
  };
};

const loadFileImage = async (file) => {
  const sourceUrl = await readFileAsDataUrl(file);
  return loadImageElement(sourceUrl);
};

export function getEditorExtension(format) {
  return getMimeExtension(format);
}

export async function transformImage({
  file,
  format = "image/png",
  quality = 0.92,
  cropLeft = 0,
  cropTop = 0,
  cropWidth = 100,
  cropHeight = 100,
  rotate = 0,
  flipX = false,
  flipY = false
}) {
  const image = await loadFileImage(file);
  const safeLeft = clamp(cropLeft, 0, 100);
  const safeTop = clamp(cropTop, 0, 100);
  const safeWidth = clamp(cropWidth, 1, 100 - safeLeft);
  const safeHeight = clamp(cropHeight, 1, 100 - safeTop);

  const sourceX = Math.round((image.naturalWidth * safeLeft) / 100);
  const sourceY = Math.round((image.naturalHeight * safeTop) / 100);
  const sourceWidth = Math.max(1, Math.round((image.naturalWidth * safeWidth) / 100));
  const sourceHeight = Math.max(1, Math.round((image.naturalHeight * safeHeight) / 100));
  const radians = (rotate * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(sourceWidth * cos + sourceHeight * sin));
  canvas.height = Math.max(1, Math.round(sourceWidth * sin + sourceHeight * cos));

  const context = canvas.getContext("2d");
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -sourceWidth / 2,
    -sourceHeight / 2,
    sourceWidth,
    sourceHeight
  );

  return buildResult({
    canvas,
    file,
    format,
    quality,
    fileName: `${file.name.replace(/\.[^.]+$/, "")}-edited.${getMimeExtension(format)}`,
    summary: `Crop ${safeWidth}% x ${safeHeight}% | Rotate ${rotate}deg${flipX || flipY ? ` | Flip ${[flipX ? "H" : "", flipY ? "V" : ""].filter(Boolean).join("/")}` : ""}`
  });
}

export async function watermarkImage({
  file,
  format = "image/png",
  quality = 0.92,
  watermarkKind = "text",
  watermarkFile,
  watermarkText = "",
  position = "bottom-right",
  opacity = 0.3,
  scale = 22,
  padding = 4,
  textSize = 6,
  textColor = "#ffffff",
  backgroundColor = "#0f172a"
}) {
  const image = await loadFileImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);

  const paddingPx = Math.round((Math.min(canvas.width, canvas.height) * clamp(padding, 0, 20)) / 100);
  const safeOpacity = clamp(opacity, 0.05, 1);

  if (watermarkKind === "logo") {
    if (!watermarkFile) {
      throw new Error("Upload a watermark logo before processing the image.");
    }

    const watermark = await loadFileImage(watermarkFile);
    const maxWidth = Math.max(40, Math.round((canvas.width * clamp(scale, 5, 60)) / 100));
    const ratio = watermark.naturalWidth / watermark.naturalHeight;
    const width = maxWidth;
    const height = Math.max(24, Math.round(width / ratio));
    const { x, y } = getPosition({
      position,
      width,
      height,
      padding: paddingPx,
      containerWidth: canvas.width,
      containerHeight: canvas.height
    });

    context.save();
    context.globalAlpha = safeOpacity;
    context.drawImage(watermark, x, y, width, height);
    context.restore();
  } else {
    const safeText = watermarkText.trim();
    if (!safeText) {
      throw new Error("Enter watermark text before processing the image.");
    }

    const fontSize = Math.max(16, Math.round((canvas.width * clamp(textSize, 2, 12)) / 100));
    const boxPaddingX = Math.round(fontSize * 0.6);
    const boxPaddingY = Math.round(fontSize * 0.38);
    context.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    const metrics = context.measureText(safeText);
    const width = Math.ceil(metrics.width + boxPaddingX * 2);
    const height = Math.ceil(fontSize + boxPaddingY * 2);
    const { x, y } = getPosition({
      position,
      width,
      height,
      padding: paddingPx,
      containerWidth: canvas.width,
      containerHeight: canvas.height
    });

    context.save();
    context.globalAlpha = Math.min(safeOpacity + 0.18, 0.92);
    context.fillStyle = backgroundColor;
    drawRoundedRect(context, x, y, width, height, Math.max(10, Math.round(fontSize * 0.36)));
    context.fill();
    context.globalAlpha = Math.min(safeOpacity + 0.4, 1);
    context.fillStyle = textColor;
    context.textBaseline = "middle";
    context.fillText(safeText, x + boxPaddingX, y + height / 2);
    context.restore();
  }

  return buildResult({
    canvas,
    file,
    format,
    quality,
    fileName: `${file.name.replace(/\.[^.]+$/, "")}-watermarked.${getMimeExtension(format)}`,
    summary: watermarkKind === "logo" ? `Logo watermark | ${position}` : `Text watermark | ${position}`
  });
}

export async function blurImage({
  file,
  format = "image/png",
  quality = 0.92,
  blurMode = "entire",
  blurAmount = 14,
  focusWidth = 60,
  focusHeight = 65,
  focusFeather = 18
}) {
  const image = await loadFileImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  const safeBlur = clamp(blurAmount, 1, 40);

  context.filter = `blur(${safeBlur}px)`;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.filter = "none";

  if (blurMode === "focus") {
    const sharpCanvas = document.createElement("canvas");
    sharpCanvas.width = canvas.width;
    sharpCanvas.height = canvas.height;
    const sharpContext = sharpCanvas.getContext("2d");
    sharpContext.drawImage(image, 0, 0, canvas.width, canvas.height);

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskContext = maskCanvas.getContext("2d");
    const radiusX = Math.max(32, Math.round((canvas.width * clamp(focusWidth, 15, 95)) / 200));
    const radiusY = Math.max(32, Math.round((canvas.height * clamp(focusHeight, 15, 95)) / 200));
    const outerRadius = Math.max(radiusX, radiusY);
    const innerScale = clamp(1 - clamp(focusFeather, 0, 45) / 100, 0.28, 0.98);

    maskContext.save();
    maskContext.translate(canvas.width / 2, canvas.height / 2);
    maskContext.scale(1, radiusY / radiusX);
    const gradient = maskContext.createRadialGradient(0, 0, outerRadius * innerScale, 0, 0, outerRadius);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    maskContext.fillStyle = gradient;
    maskContext.beginPath();
    maskContext.arc(0, 0, outerRadius, 0, Math.PI * 2);
    maskContext.fill();
    maskContext.restore();

    sharpContext.globalCompositeOperation = "destination-in";
    sharpContext.drawImage(maskCanvas, 0, 0);
    context.drawImage(sharpCanvas, 0, 0);
  }

  return buildResult({
    canvas,
    file,
    format,
    quality,
    fileName: `${file.name.replace(/\.[^.]+$/, "")}-blurred.${getMimeExtension(format)}`,
    summary:
      blurMode === "focus"
        ? `Center focus blur | ${safeBlur}px blur`
        : `Full image blur | ${safeBlur}px blur`
  });
}
