import QRCode from "qrcode";

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the overlay image."));
    image.src = src;
  });

export async function drawQrCodeWithLogo({
  canvas,
  text,
  size = 360,
  foreground = "#0f172a",
  background = "#ffffff",
  logoDataUrl
}) {
  if (!canvas) {
    throw new Error("QR canvas is not available.");
  }

  if (!text.trim()) {
    throw new Error("Enter text or a URL before generating a QR code.");
  }

  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: logoDataUrl ? "H" : "M",
    color: {
      dark: foreground,
      light: background
    }
  });

  if (!logoDataUrl) {
    return canvas;
  }

  const context = canvas.getContext("2d");
  const logo = await loadImage(logoDataUrl);
  const overlaySize = Math.round(size * 0.24);
  const x = (size - overlaySize) / 2;
  const y = (size - overlaySize) / 2;
  const padding = Math.round(overlaySize * 0.18);
  const radius = Math.round(overlaySize * 0.18);

  context.save();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.moveTo(x - padding + radius, y - padding);
  context.lineTo(x + overlaySize + padding - radius, y - padding);
  context.quadraticCurveTo(x + overlaySize + padding, y - padding, x + overlaySize + padding, y - padding + radius);
  context.lineTo(x + overlaySize + padding, y + overlaySize + padding - radius);
  context.quadraticCurveTo(
    x + overlaySize + padding,
    y + overlaySize + padding,
    x + overlaySize + padding - radius,
    y + overlaySize + padding
  );
  context.lineTo(x - padding + radius, y + overlaySize + padding);
  context.quadraticCurveTo(x - padding, y + overlaySize + padding, x - padding, y + overlaySize + padding - radius);
  context.lineTo(x - padding, y - padding + radius);
  context.quadraticCurveTo(x - padding, y - padding, x - padding + radius, y - padding);
  context.closePath();
  context.fill();
  context.drawImage(logo, x, y, overlaySize, overlaySize);
  context.restore();

  return canvas;
}

export function downloadCanvas(canvas, filename = "qr-code.png") {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}
