import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import {
  copyCanvasToClipboard,
  downloadCanvas,
  fitWithin,
  readImageFile,
  shareCanvas
} from "../../utils/browser-media.js";
import { applySketchEffect } from "../../utils/sketch.js";

export default function ImageToSketchTool() {
  const canvasRef = useRef(null);
  const [source, setSource] = useState(null);
  const [blurRadius, setBlurRadius] = useState(5);
  const [edgeStrength, setEdgeStrength] = useState(0.65);
  const [contrast, setContrast] = useState(1.08);
  const [busy, setBusy] = useState(false);
  const [outputSize, setOutputSize] = useState({ width: 0, height: 0 });
  const { toast, showToast } = useToolToast(2800);

  useEffect(() => {
    if (!source || !canvasRef.current) {
      return undefined;
    }

    let active = true;

    const render = async () => {
      try {
        setBusy(true);
        const dimensions = fitWithin(source.image.naturalWidth, source.image.naturalHeight, 1400);
        const workerCanvas = document.createElement("canvas");
        workerCanvas.width = dimensions.width;
        workerCanvas.height = dimensions.height;
        const workerContext = workerCanvas.getContext("2d");
        workerContext.drawImage(source.image, 0, 0, dimensions.width, dimensions.height);

        const original = workerContext.getImageData(0, 0, dimensions.width, dimensions.height);
        const result = applySketchEffect(original, {
          blurRadius,
          edgeStrength,
          contrast
        });

        const previewCanvas = canvasRef.current;
        previewCanvas.width = dimensions.width;
        previewCanvas.height = dimensions.height;
        const previewContext = previewCanvas.getContext("2d");
        previewContext.putImageData(result, 0, 0);

        if (active) {
          setOutputSize({ width: dimensions.width, height: dimensions.height });
        }
      } catch (error) {
        if (active) {
          showToast(error.message, "error");
        }
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    };

    render();

    return () => {
      active = false;
    };
  }, [blurRadius, contrast, edgeStrength, source]);

  const handleUpload = async (file) => {
    try {
      const next = await readImageFile(file);
      setSource({
        ...next,
        name: file.name.replace(/\.[^.]+$/, ""),
        size: file.size
      });
      showToast("Image ready. Tune the sketch controls for the look you want.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCopy = async () => {
    try {
      await copyCanvasToClipboard(canvasRef.current);
      showToast("Sketch copied as an image.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleShare = async () => {
    try {
      const mode = await shareCanvas(canvasRef.current, {
        filename: `${source?.name ?? "image"}-sketch.png`,
        title: "Image to Sketch Converter",
        text: "Converted to a pencil-style sketch directly in the browser."
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
        <h2 className="mt-4 text-3xl font-semibold text-strong">Convert photos into a pencil-sketch effect in one pass</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload an image, blend grayscale shading with edge emphasis, and download a sketch-style render for posters, social posts, avatars, and moodboards.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone
            label="Upload image"
            help="The sketch preview updates in the browser as you adjust the sliders."
            fileName={source?.name ?? ""}
            onFileSelect={handleUpload}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="field-label" htmlFor="sketch-blur">Pencil softness</label>
              <span className="text-sm font-semibold text-muted">{blurRadius}</span>
            </div>
            <input
              id="sketch-blur"
              className="w-full"
              type="range"
              min="1"
              max="8"
              value={blurRadius}
              onChange={(event) => setBlurRadius(Number(event.target.value))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="field-label" htmlFor="sketch-edge">Edge depth</label>
              <span className="text-sm font-semibold text-muted">{Math.round(edgeStrength * 100)}%</span>
            </div>
            <input
              id="sketch-edge"
              className="w-full"
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={edgeStrength}
              onChange={(event) => setEdgeStrength(Number(event.target.value))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="field-label" htmlFor="sketch-contrast">Contrast</label>
              <span className="text-sm font-semibold text-muted">{contrast.toFixed(2)}x</span>
            </div>
            <input
              id="sketch-contrast"
              className="w-full"
              type="range"
              min="0.8"
              max="1.4"
              step="0.02"
              value={contrast}
              onChange={(event) => setContrast(Number(event.target.value))}
            />
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Effect</p>
              <p className="mt-2 text-lg font-semibold text-strong">Grayscale plus edge blend</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Preview</p>
              <p className="mt-2 text-lg font-semibold text-strong">{busy ? "Processing" : "Instant"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Output</p>
              <p className="mt-2 text-lg font-semibold text-strong">{outputSize.width ? `${outputSize.width} x ${outputSize.height}` : "Waiting"}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Original</p>
              <div className="tool-preview mt-4">
                {source ? (
                  <img src={source.dataUrl} alt="Original upload preview" className="max-h-[320px] rounded-xl object-contain" />
                ) : (
                  <p className="text-sm text-muted">Upload an image to preview the original photo here.</p>
                )}
              </div>
            </div>

            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Sketch result</p>
              <div className="tool-preview mt-4">
                {source ? (
                  <canvas ref={canvasRef} className="max-h-[320px] rounded-xl object-contain" />
                ) : (
                  <p className="text-sm text-muted">The sketch effect preview appears here.</p>
                )}
              </div>
            </div>
          </div>

          <div className="tool-actions">
            <button
              className="btn-primary"
              type="button"
              onClick={() => downloadCanvas(canvasRef.current, `${source?.name ?? "image"}-sketch.png`)}
              disabled={!source}
            >
              Download PNG
            </button>
            <button className="btn-secondary" type="button" onClick={handleCopy} disabled={!source}>
              Copy image
            </button>
            <button className="btn-secondary" type="button" onClick={handleShare} disabled={!source}>
              Share
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
