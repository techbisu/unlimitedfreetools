import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { copyText, downloadCanvas, downloadTextFile, readImageFile } from "../../utils/browser-media.js";
import { extractPaletteFromImage } from "../../utils/palette.js";

export default function ColorPaletteFromImageTool() {
  const paletteCanvasRef = useRef(null);
  const [asset, setAsset] = useState(null);
  const [palette, setPalette] = useState([]);
  const { toast, showToast } = useToolToast();

  useEffect(() => {
    if (!palette.length || !paletteCanvasRef.current) {
      return;
    }

    const canvas = paletteCanvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = 1200;
    canvas.height = 420;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0f172a";
    context.font = "700 34px Inter, sans-serif";
    context.fillText("Extracted Color Palette", 60, 62);

    const swatchWidth = 170;
    palette.slice(0, 6).forEach((color, index) => {
      const x = 60 + index * 180;
      context.fillStyle = color;
      context.fillRect(x, 110, swatchWidth, 170);
      context.fillStyle = "#0f172a";
      context.font = "600 24px Inter, sans-serif";
      context.fillText(color.toUpperCase(), x, 328);
    });
  }, [palette]);

  const handleUpload = async (file) => {
    try {
      const image = await readImageFile(file);
      setAsset({
        ...image,
        name: file.name.replace(/\.[^.]+$/, "")
      });
      setPalette(extractPaletteFromImage(image.image));
      showToast("Palette extracted from your image.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Pull dominant colors from an image and export a usable palette</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a photo, poster, or product image, extract dominant colors instantly, and copy the HEX values or download the palette card.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone label="Upload image" help="Photos, posters, and screenshots work well." fileName={asset?.name ?? ""} onFileSelect={handleUpload} />

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={() => downloadCanvas(paletteCanvasRef.current, `${asset?.name ?? "palette"}-palette.png`)} disabled={!palette.length}>Download palette PNG</button>
            <button className="btn-secondary" type="button" onClick={() => downloadTextFile(palette.join("\n"), `${asset?.name ?? "palette"}-colors.txt`)} disabled={!palette.length}>Download HEX list</button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Source image</p>
              <div className="tool-preview mt-4">{asset ? <img src={asset.dataUrl} alt="Palette source" className="max-h-[320px] rounded-xl object-contain" /> : <p className="text-sm text-muted">Upload an image to inspect its colors.</p>}</div>
            </div>

            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Palette</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {palette.map((color) => (
                  <button key={color} className="rounded-2xl border p-4 text-left" type="button" style={{ borderColor: "var(--surface-border)" }} onClick={() => copyText(color).then(() => showToast(`${color.toUpperCase()} copied.`)).catch((error) => showToast(error.message, "error"))}>
                    <div className="h-20 rounded-xl" style={{ backgroundColor: color }} />
                    <p className="mt-3 text-sm font-semibold text-strong">{color.toUpperCase()}</p>
                    <p className="mt-1 text-xs text-muted">Tap to copy</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[180px]">
              {palette.length ? <canvas ref={paletteCanvasRef} className="max-h-[260px] rounded-xl object-contain" /> : <p className="text-sm text-muted">The downloadable palette card appears here.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
