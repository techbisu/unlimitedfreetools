import { useEffect, useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { removeImageBackground } from "../../utils/background.js";
import { formatBytes } from "../../utils/image.js";

export default function BGRemover() {
  const [file, setFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast, showToast } = useToolToast(3200);

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

  const savings = useMemo(() => {
    if (!result?.originalSize || !result?.convertedSize) {
      return "Waiting";
    }

    return `${Math.max(0, (1 - result.convertedSize / result.originalSize) * 100).toFixed(1)}%`;
  }, [result]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    setFile(nextFile);
    setSourcePreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(nextFile);
    });
    setResult((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });
    setProgress(0);
    showToast("Image ready for background removal.");
  };

  const processImage = async () => {
    if (!file) {
      showToast("Choose an image first.", "error");
      return;
    }

    try {
      setBusy(true);
      setProgress(5);
      const nextResult = await removeImageBackground(file, setProgress);
      setResult((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }

        return nextResult;
      });
      setProgress(100);
      showToast("Background removed.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Remove image backgrounds with AI</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a product photo, profile image, or design asset, preview the result, and download a transparent PNG with no login.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor="bg-remove-upload">Upload image</label>
            <input
              id="bg-remove-upload"
              className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-slate-100 dark:file:text-slate-900"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="surface-panel p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-strong">Model load and processing</p>
                <p className="mt-1 text-sm text-muted">The AI model loads only when you use this tool.</p>
              </div>
              <p className="text-sm font-semibold text-strong">{progress}%</p>
            </div>
            <div className="progress-track mt-4">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={processImage} disabled={busy}>
              {busy ? "Removing..." : "Remove background"}
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Original size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{file ? formatBytes(file.size) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">PNG output size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{result ? formatBytes(result.convertedSize) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Size change</p>
              <p className="mt-2 text-lg font-semibold text-strong">{savings}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Original image</p>
              <div className="tool-preview mt-4">
                {sourcePreview ? (
                  <img className="max-h-[280px] rounded-lg object-contain" src={sourcePreview} alt="Original preview" />
                ) : (
                  <p className="text-sm text-muted">Upload an image to preview the source.</p>
                )}
              </div>
            </div>

            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Transparent result</p>
              <div className="tool-preview mt-4 bg-[linear-gradient(45deg,rgba(148,163,184,0.15)_25%,transparent_25%,transparent_50%,rgba(148,163,184,0.15)_50%,rgba(148,163,184,0.15)_75%,transparent_75%,transparent)] bg-[length:24px_24px]">
                {result ? (
                  <img className="max-h-[280px] rounded-lg object-contain" src={result.previewUrl} alt="Background removed preview" />
                ) : (
                  <p className="text-sm text-muted">The transparent PNG preview appears here.</p>
                )}
              </div>
            </div>
          </div>

          {result ? (
            <div className="surface-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-strong">transparent-image.png</p>
                  <p className="mt-1 text-sm text-muted">Download the processed PNG with transparency.</p>
                </div>
                <a className="btn-primary" href={result.previewUrl} download="transparent-image.png">
                  Download PNG
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
