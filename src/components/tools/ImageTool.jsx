import { useEffect, useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { convertImage, formatBytes } from "../../utils/image.js";

const formatOptions = [
  { value: "image/webp", label: "WebP" },
  { value: "image/avif", label: "AVIF" },
  { value: "image/jpeg", label: "JPG" },
  { value: "image/png", label: "PNG" }
];

const extensions = {
  "image/webp": "webp",
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png"
};

export default function ImageTool({ initialMode = "compress" }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [sourcePreview, setSourcePreview] = useState("");
  const [quality, setQuality] = useState(initialMode === "compress" ? 0.78 : 0.88);
  const [format, setFormat] = useState("image/webp");
  const [busy, setBusy] = useState(false);
  const { toast, showToast } = useToolToast(3000);

  useEffect(() => {
    return () => {
      if (sourcePreview) {
        URL.revokeObjectURL(sourcePreview);
      }
    };
  }, [sourcePreview]);

  useEffect(() => {
    return () => {
      if (result?.previewUrl) {
        URL.revokeObjectURL(result.previewUrl);
      }
    };
  }, [result]);

  const reduction = useMemo(() => {
    if (!result) {
      return "0%";
    }

    const delta = (1 - result.convertedSize / result.originalSize) * 100;
    return `${delta >= 0 ? delta.toFixed(1) : 0}%`;
  }, [result]);

  const handleFileChange = async (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

    setFile(nextFile);
    setSourcePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(nextFile);
    });
    setResult(null);
    showToast("Image ready. Choose the output format and convert.");
  };

  const processImage = async () => {
    if (!file) {
      showToast("Choose an image before converting.", "error");
      return;
    }

    try {
      setBusy(true);
      const nextResult = await convertImage({
        file,
        format,
        quality
      });
      setResult((previous) => {
        if (previous?.previewUrl) {
          URL.revokeObjectURL(previous.previewUrl);
        }
        return nextResult;
      });
      showToast("Image converted successfully.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const downloadName = file ? `${file.name.replace(/\.[^.]+$/, "")}.${extensions[format]}` : `converted.${extensions[format]}`;

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Compress and convert images in seconds</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Reduce image size, convert formats, and compare file savings for websites, blogs, store listings, and social media uploads.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor="image-upload">Upload image</label>
            <input
              id="image-upload"
              className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-slate-100 dark:file:text-slate-900"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="image-format">Output format</label>
            <select id="image-format" className="select-field" value={format} onChange={(event) => setFormat(event.target.value)}>
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="field-label" htmlFor="image-quality">Quality</label>
              <span className="text-sm font-semibold text-muted">{Math.round(quality * 100)}%</span>
            </div>
            <input
              id="image-quality"
              className="w-full accent-brand-500"
              type="range"
              min="0.4"
              max="0.95"
              step="0.05"
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
            />
            <p className="field-help">Choose WebP or AVIF for smaller files, or JPG and PNG when you need a specific format.</p>
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={processImage} disabled={busy}>
              {busy ? "Processing..." : "Compress and convert"}
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Original size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{result ? formatBytes(result.originalSize) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Converted size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{result ? formatBytes(result.convertedSize) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Reduction</p>
              <p className="mt-2 text-lg font-semibold text-strong">{reduction}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Original</p>
              <div className="tool-preview mt-4">
                {sourcePreview ? <img className="max-h-[240px] rounded-lg object-contain" src={sourcePreview} alt="Original upload preview" /> : <p className="text-sm text-muted">Upload a file to preview the original image.</p>}
              </div>
            </div>

            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Converted</p>
              <div className="tool-preview mt-4">
                {result ? <img className="max-h-[240px] rounded-lg object-contain" src={result.previewUrl} alt="Converted preview" /> : <p className="text-sm text-muted">The processed preview appears here.</p>}
              </div>
            </div>
          </div>

          {result ? (
            <div className="surface-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-strong">{downloadName}</p>
                  <p className="mt-1 text-sm text-muted">{result.width} x {result.height} pixels</p>
                </div>
                <a className="btn-primary" href={result.previewUrl} download={downloadName}>
                  Download image
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
