function loadQrLibrary() {
  return import("qrcode").then((module) => module.default ?? module);
}

function round(value) {
  return Number(value.toFixed(2));
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function buildRoundedRectPath(x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  if (safeRadius === 0) {
    return `M ${round(x)} ${round(y)} H ${round(x + width)} V ${round(y + height)} H ${round(x)} Z`;
  }

  return [
    `M ${round(x + safeRadius)} ${round(y)}`,
    `H ${round(x + width - safeRadius)}`,
    `Q ${round(x + width)} ${round(y)} ${round(x + width)} ${round(y + safeRadius)}`,
    `V ${round(y + height - safeRadius)}`,
    `Q ${round(x + width)} ${round(y + height)} ${round(x + width - safeRadius)} ${round(y + height)}`,
    `H ${round(x + safeRadius)}`,
    `Q ${round(x)} ${round(y + height)} ${round(x)} ${round(y + height - safeRadius)}`,
    `V ${round(y + safeRadius)}`,
    `Q ${round(x)} ${round(y)} ${round(x + safeRadius)} ${round(y)}`,
    "Z"
  ].join(" ");
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawDiamond(ctx, x, y, size) {
  const half = size / 2;
  ctx.beginPath();
  ctx.moveTo(x + half, y);
  ctx.lineTo(x + size, y + half);
  ctx.lineTo(x + half, y + size);
  ctx.lineTo(x, y + half);
  ctx.closePath();
}

function moduleShapeSvg(dotStyle, x, y, size, fill) {
  if (dotStyle === "dots") {
    return `<circle cx="${round(x + size / 2)}" cy="${round(y + size / 2)}" r="${round(size * 0.34)}" fill="${fill}" />`;
  }

  if (dotStyle === "diamond") {
    return `<path d="M ${round(x + size / 2)} ${round(y)} L ${round(x + size)} ${round(y + size / 2)} L ${round(x + size / 2)} ${round(y + size)} L ${round(x)} ${round(y + size / 2)} Z" fill="${fill}" />`;
  }

  if (dotStyle === "rounded") {
    return `<path d="${buildRoundedRectPath(x, y, size, size, size * 0.34)}" fill="${fill}" />`;
  }

  return `<rect x="${round(x)}" y="${round(y)}" width="${round(size)}" height="${round(size)}" fill="${fill}" />`;
}

function drawModule(ctx, dotStyle, x, y, size, fill) {
  ctx.fillStyle = fill;

  if (dotStyle === "dots") {
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (dotStyle === "diamond") {
    drawDiamond(ctx, x, y, size);
    ctx.fill();
    return;
  }

  if (dotStyle === "rounded") {
    drawRoundedRect(ctx, x, y, size, size, size * 0.34);
    ctx.fill();
    return;
  }

  ctx.fillRect(x, y, size, size);
}

function getFinderOrigins(count) {
  return [
    { x: 0, y: 0 },
    { x: count - 7, y: 0 },
    { x: 0, y: count - 7 }
  ];
}

function isFinderModule(x, y, count) {
  return getFinderOrigins(count).some((origin) => x >= origin.x && x < origin.x + 7 && y >= origin.y && y < origin.y + 7);
}

function cornerShapeSvg(style, x, y, size, foreground, background) {
  const outerRadius = style === "rounded" ? size * 0.24 : style === "frame" ? size * 0.3 : style === "leaf" ? size * 0.4 : 0;
  const innerRadius = style === "rounded" ? size * 0.12 : style === "frame" ? size * 0.22 : style === "leaf" ? size * 0.32 : 0;
  const eyeRadius = style === "leaf" ? size * 0.18 : size * 0.16;
  const cutoutInset = size * 0.16;
  const eyeSize = size * 0.38;
  const eyeOffset = (size - eyeSize) / 2;

  return [
    `<path d="${buildRoundedRectPath(x, y, size, size, outerRadius)}" fill="${foreground}" />`,
    `<path d="${buildRoundedRectPath(x + cutoutInset, y + cutoutInset, size - cutoutInset * 2, size - cutoutInset * 2, innerRadius)}" fill="${background}" />`,
    `<path d="${buildRoundedRectPath(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize, eyeRadius)}" fill="${foreground}" />`
  ].join("");
}

function drawCorner(ctx, style, x, y, size, foreground, background) {
  const outerRadius = style === "rounded" ? size * 0.24 : style === "frame" ? size * 0.3 : style === "leaf" ? size * 0.4 : 0;
  const innerRadius = style === "rounded" ? size * 0.12 : style === "frame" ? size * 0.22 : style === "leaf" ? size * 0.32 : 0;
  const eyeRadius = style === "leaf" ? size * 0.18 : size * 0.16;
  const cutoutInset = size * 0.16;
  const eyeSize = size * 0.38;
  const eyeOffset = (size - eyeSize) / 2;

  ctx.fillStyle = foreground;
  drawRoundedRect(ctx, x, y, size, size, outerRadius);
  ctx.fill();

  ctx.fillStyle = background;
  drawRoundedRect(ctx, x + cutoutInset, y + cutoutInset, size - cutoutInset * 2, size - cutoutInset * 2, innerRadius);
  ctx.fill();

  ctx.fillStyle = foreground;
  drawRoundedRect(ctx, x + eyeOffset, y + eyeOffset, eyeSize, eyeSize, eyeRadius);
  ctx.fill();
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the logo image."));
    image.src = src;
  });
}

export async function buildQrScene({
  text,
  size = 620,
  margin = 42,
  foreground = "#111827",
  background = "#ffffff",
  dotStyle = "rounded",
  cornerStyle = "frame",
  logoDataUrl = ""
}) {
  if (!text.trim()) {
    throw new Error("Enter text or a URL before generating the QR code.");
  }

  const QRCode = await loadQrLibrary();
  const qr = QRCode.create(text, {
    errorCorrectionLevel: logoDataUrl ? "H" : "M",
    margin: 0
  });

  const count = qr.modules.size;
  const moduleSize = (size - margin * 2) / count;
  const finderOrigins = getFinderOrigins(count).map((origin) => ({
    x: margin + origin.x * moduleSize,
    y: margin + origin.y * moduleSize
  }));
  const logoSize = logoDataUrl ? size * 0.2 : 0;
  const logoX = (size - logoSize) / 2;
  const logoY = (size - logoSize) / 2;

  return {
    text,
    size,
    margin,
    foreground,
    background,
    dotStyle,
    cornerStyle,
    logoDataUrl,
    qr,
    count,
    moduleSize,
    finderOrigins,
    logoBox: logoDataUrl
      ? {
          x: logoX,
          y: logoY,
          size: logoSize,
          padding: logoSize * 0.18,
          radius: logoSize * 0.22
        }
      : null
  };
}

export async function drawQrSceneToCanvas(canvas, scene) {
  if (!canvas) {
    throw new Error("QR canvas is not available.");
  }

  canvas.width = scene.size;
  canvas.height = scene.size;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, scene.size, scene.size);
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.size, scene.size);

  const data = scene.qr.modules.data;

  for (let y = 0; y < scene.count; y += 1) {
    for (let x = 0; x < scene.count; x += 1) {
      if (!data[y * scene.count + x] || isFinderModule(x, y, scene.count)) {
        continue;
      }

      const left = scene.margin + x * scene.moduleSize;
      const top = scene.margin + y * scene.moduleSize;
      drawModule(ctx, scene.dotStyle, left, top, scene.moduleSize, scene.foreground);
    }
  }

  scene.finderOrigins.forEach((origin) => {
    drawCorner(
      ctx,
      scene.cornerStyle,
      origin.x,
      origin.y,
      scene.moduleSize * 7,
      scene.foreground,
      scene.background
    );
  });

  if (scene.logoBox && scene.logoDataUrl) {
    const logo = await loadImage(scene.logoDataUrl);
    ctx.fillStyle = scene.background;
    drawRoundedRect(
      ctx,
      scene.logoBox.x - scene.logoBox.padding,
      scene.logoBox.y - scene.logoBox.padding,
      scene.logoBox.size + scene.logoBox.padding * 2,
      scene.logoBox.size + scene.logoBox.padding * 2,
      scene.logoBox.radius
    );
    ctx.fill();
    ctx.drawImage(logo, scene.logoBox.x, scene.logoBox.y, scene.logoBox.size, scene.logoBox.size);
  }
}

export function renderQrSceneToSvg(scene) {
  const shapes = [
    `<rect width="${scene.size}" height="${scene.size}" fill="${scene.background}" />`
  ];

  const data = scene.qr.modules.data;

  for (let y = 0; y < scene.count; y += 1) {
    for (let x = 0; x < scene.count; x += 1) {
      if (!data[y * scene.count + x] || isFinderModule(x, y, scene.count)) {
        continue;
      }

      const left = scene.margin + x * scene.moduleSize;
      const top = scene.margin + y * scene.moduleSize;
      shapes.push(moduleShapeSvg(scene.dotStyle, left, top, scene.moduleSize, scene.foreground));
    }
  }

  scene.finderOrigins.forEach((origin) => {
    shapes.push(
      cornerShapeSvg(
        scene.cornerStyle,
        origin.x,
        origin.y,
        scene.moduleSize * 7,
        scene.foreground,
        scene.background
      )
    );
  });

  if (scene.logoBox && scene.logoDataUrl) {
    shapes.push(
      `<path d="${buildRoundedRectPath(
        scene.logoBox.x - scene.logoBox.padding,
        scene.logoBox.y - scene.logoBox.padding,
        scene.logoBox.size + scene.logoBox.padding * 2,
        scene.logoBox.size + scene.logoBox.padding * 2,
        scene.logoBox.radius
      )}" fill="${scene.background}" />`
    );
    shapes.push(
      `<image x="${round(scene.logoBox.x)}" y="${round(scene.logoBox.y)}" width="${round(scene.logoBox.size)}" height="${round(scene.logoBox.size)}" href="${escapeAttribute(scene.logoDataUrl)}" preserveAspectRatio="xMidYMid meet" />`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scene.size} ${scene.size}" width="${scene.size}" height="${scene.size}">${shapes.join("")}</svg>`;
}
