import { useEffect, useMemo, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import {
  copyCanvasToClipboard,
  downloadCanvas,
  formatBytes,
  readImageFile,
  shareCanvas
} from "../../utils/browser-media.js";

const gradients = [
  { id: "sunset", label: "Sunset punch", colors: ["#fb7185", "#f59e0b", "#fde68a"] },
  { id: "ocean", label: "Ocean depth", colors: ["#0f172a", "#0f766e", "#67e8f9"] },
  { id: "neon", label: "Neon pulse", colors: ["#111827", "#7c3aed", "#f472b6"] },
  { id: "mint", label: "Mint glass", colors: ["#d1fae5", "#67e8f9", "#1d4ed8"] }
];

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

export default function ScreenshotBeautifier() {
  const canvasRef = useRef(null);
  const [asset, setAsset] = useState(null);
  const [padding, setPadding] = useState(56);
  const [radius, setRadius] = useState(28);
  const [shadow, setShadow] = useState(34);
  const [gradientId, setGradientId] = useState("sunset");
  const [exportBytes, setExportBytes] = useState(0);
  const { toast, showToast } = useToolToast(2800);

  const selectedGradient = useMemo(
    () => gradients.find((item) => item.id === gradientId) ?? gradients[0],
    [gradientId]
  );

  useEffect(() => {
    if (!asset || !canvasRef.current) {
      return undefined;
    }

    let active = true;

    const render = async () => {
      const canvas = canvasRef.current;
      const outerGap = padding + shadow * 1.8;
      canvas.width = Math.round(asset.width + outerGap * 2);
      canvas.height = Math.round(asset.height + outerGap * 2);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      selectedGradient.colors.forEach((color, index) => {
        gradient.addColorStop(index / (selectedGradient.colors.length - 1), color);
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const x = outerGap;
      const y = outerGap;

      ctx.save();
      ctx.shadowColor = "rgba(15, 23, 42, 0.26)";
      ctx.shadowBlur = shadow * 2;
      ctx.shadowOffsetY = shadow * 0.7;
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      drawRoundedRect(ctx, x, y, asset.width, asset.height, radius);
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedRect(ctx, x, y, asset.width, asset.height, radius);
      ctx.clip();
      ctx.drawImage(asset.image, x, y, asset.width, asset.height);
      ctx.restore();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (active) {
        setExportBytes(blob?.size ?? 0);
      }
    };

    render().catch((error) => showToast(error.message, "error"));

    return () => {
      active = false;
    };
  }, [asset, padding, radius, shadow, selectedGradient]);

  const handleFileSelect = async (file) => {
    try {
      const { dataUrl, image } = await readImageFile(file);
      setAsset({
        name: file.name.replace(/\.[^.]+$/, ""),
        dataUrl,
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: file.size
      });
      showToast("Screenshot loaded. Adjust the frame and export.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCopy = async () => {
    try {
      await copyCanvasToClipboard(canvasRef.current);
      showToast("Beautified screenshot copied as an image.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleShare = async () => {
    try {
      const mode = await shareCanvas(canvasRef.current, {
        filename: `${asset?.name ?? "beautified-screenshot"}.png`,
        title: "Screenshot Beautifier",
        text: "Styled with rounded corners, shadow, and a custom gradient background."
      });
      showToast(mode === "copied-url" ? "Share link copied to the clipboard." : "Share sheet opened.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Turn flat screenshots into share-ready cards</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a screenshot, wrap it in a gradient backdrop, add padding, soften the corners, and export a cleaner image for launch posts, changelogs, and social shares.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone
            label="Upload screenshot"
            help="PNG and JPG screenshots work best. Drag and drop is supported."
            fileName={asset ? `${asset.name}.${asset.dataUrl.startsWith("data:image/png") ? "png" : "jpg"}` : ""}
            onFileSelect={handleFileSelect}
          />

          <div className="space-y-3">
            <label className="field-label" htmlFor="beautifier-gradient">Gradient background</label>
            <select
              id="beautifier-gradient"
              className="select-field"
              value={gradientId}
              onChange={(event) => setGradientId(event.target.value)}
            >
              {gradients.map((gradient) => (
                <option key={gradient.id} value={gradient.id}>
                  {gradient.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="field-label" htmlFor="beautifier-padding">Padding</label>
              <span className="text-sm font-semibold text-muted">{padding}px</span>
            </div>
            <input
              id="beautifier-padding"
              className="w-full"
              type="range"
              min="16"
              max="120"
              value={padding}
              onChange={(event) => setPadding(Number(event.target.value))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="field-label" htmlFor="beautifier-radius">Rounded corners</label>
              <span className="text-sm font-semibold text-muted">{radius}px</span>
            </div>
            <input
              id="beautifier-radius"
              className="w-full"
              type="range"
              min="0"
              max="60"
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="field-label" htmlFor="beautifier-shadow">Shadow depth</label>
              <span className="text-sm font-semibold text-muted">{shadow}px</span>
            </div>
            <input
              id="beautifier-shadow"
              className="w-full"
              type="range"
              min="0"
              max="48"
              value={shadow}
              onChange={(event) => setShadow(Number(event.target.value))}
            />
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Original file</p>
              <p className="mt-2 text-lg font-semibold text-strong">{asset ? formatBytes(asset.size) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Export size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{asset ? formatBytes(exportBytes) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Canvas</p>
              <p className="mt-2 text-lg font-semibold text-strong">
                {asset && canvasRef.current ? `${canvasRef.current.width} x ${canvasRef.current.height}` : "Preview"}
              </p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[260px] sm:min-h-[360px]">
              {asset ? (
                <canvas ref={canvasRef} className="max-h-[520px] w-full rounded-xl object-contain" />
              ) : (
                <p className="max-w-md text-sm leading-7 text-muted">
                  Upload a screenshot to see the live beautified preview. The export stays fully client-side and never leaves the browser.
                </p>
              )}
            </div>
            <div className="tool-actions mt-5">
              <button
                className="btn-primary"
                type="button"
                onClick={() => downloadCanvas(canvasRef.current, `${asset?.name ?? "beautified-screenshot"}.png`)}
                disabled={!asset}
              >
                Download PNG
              </button>
              <button className="btn-secondary" type="button" onClick={handleCopy} disabled={!asset}>
                Copy image
              </button>
              <button className="btn-secondary" type="button" onClick={handleShare} disabled={!asset}>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
