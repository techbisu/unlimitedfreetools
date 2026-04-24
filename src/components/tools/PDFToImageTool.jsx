import { useEffect, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { formatBytes, downloadBlob } from "../../utils/browser-media.js";
import { renderPdfToImages } from "../../utils/pdf-images.js";

export default function PDFToImageTool() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("image/png");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const { toast, showToast } = useToolToast(3200);

  useEffect(() => () => {
    result?.images?.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }, [result]);

  const handleFile = async (nextFile) => {
    if (!(nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf"))) {
      showToast("Choose a PDF file only.", "error");
      return;
    }

    setFile(nextFile);
    setResult((current) => {
      current?.images?.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return null;
    });
    setProgress(0);
    showToast("PDF ready. Convert it into page images.");
  };

  const convert = async () => {
    if (!file) {
      showToast("Choose a PDF file first.", "error");
      return;
    }

    try {
      setBusy(true);
      const next = await renderPdfToImages(file, {
        format,
        onProgress: setProgress
      });
      setResult(next);
      showToast("PDF converted into image previews.");
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
        <h2 className="mt-4 text-3xl font-semibold text-strong">Convert every PDF page into a clean image download</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a PDF, render each page locally with PDF.js, preview the results instantly, and download individual page images as PNG or JPG.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone
            label="Upload PDF"
            accept="application/pdf,.pdf"
            help="Drop a PDF here or browse from your device."
            fileName={file?.name ?? ""}
            onFileSelect={handleFile}
          />

          <div className="space-y-3">
            <label className="field-label" htmlFor="pdf-image-format">Image format</label>
            <select id="pdf-image-format" className="select-field" value={format} onChange={(event) => setFormat(event.target.value)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG</option>
            </select>
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={convert} disabled={busy}>
              {busy ? "Rendering pages..." : "Convert PDF"}
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Source size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{file ? formatBytes(file.size) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Pages</p>
              <p className="mt-2 text-lg font-semibold text-strong">{result?.pageCount ?? "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Progress</p>
              <p className="mt-2 text-lg font-semibold text-strong">{progress}%</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result?.images?.map((image) => (
              <article key={image.pageNumber} className="surface-panel p-4">
                <p className="text-sm font-semibold text-strong">Page {image.pageNumber}</p>
                <div className="tool-preview mt-4 min-h-[180px]">
                  <img src={image.previewUrl} alt={`PDF page ${image.pageNumber}`} className="max-h-[280px] rounded-lg object-contain" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">{image.width} x {image.height}</p>
                  <button className="btn-ghost" type="button" onClick={() => downloadBlob(image.blob, image.suggestedName)}>
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!result ? (
            <div className="surface-panel p-5">
              <p className="text-sm text-muted">Converted page images appear here after the PDF is processed.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
