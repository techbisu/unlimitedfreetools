import { useEffect, useMemo, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import {
  blobToDownloadUrl,
  compressPdfFile,
  formatBytes,
  mergePdfFiles,
  splitPdfFile
} from "../../utils/pdf.js";

const toolModes = {
  merge: {
    title: "Merge PDF files into one download",
    description: "Drop multiple PDF files, keep them in one queue, and download a single merged document for packets, reports, and handouts.",
    buttonLabel: "Merge PDFs",
    allowMultiple: true
  },
  split: {
    title: "Split a PDF by page range",
    description: "Upload one PDF, choose the page range you want to extract, and download a smaller document in seconds.",
    buttonLabel: "Split PDF",
    allowMultiple: false
  },
  compress: {
    title: "Compress scanned or image-heavy PDFs",
    description: "Reduce PDF size for email, uploads, and sharing by rebuilding pages into optimized images with fast on-page processing.",
    buttonLabel: "Compress PDF",
    allowMultiple: false
  }
};

export default function PDFTool({ mode = "merge" }) {
  const config = toolModes[mode] ?? toolModes.merge;
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [rangeInput, setRangeInput] = useState("1-3");
  const [quality, setQuality] = useState(70);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const { toast, showToast } = useToolToast(3200);

  useEffect(() => {
    return () => {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    };
  }, [result]);

  const activeFile = files[0] ?? null;

  const beforeSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  const reduction = useMemo(() => {
    if (!result?.originalSize || !result?.convertedSize) {
      return "Waiting";
    }

    const delta = (1 - result.convertedSize / result.originalSize) * 100;
    return `${Math.max(delta, 0).toFixed(1)}%`;
  }, [result]);

  const applyFiles = (nextFiles) => {
    const pdfFiles = nextFiles.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));

    if (!pdfFiles.length) {
      showToast("Choose PDF files only.", "error");
      return;
    }

    setFiles(config.allowMultiple ? pdfFiles : [pdfFiles[0]]);
    setResult((current) => {
      if (current?.downloadUrl) {
        URL.revokeObjectURL(current.downloadUrl);
      }

      return null;
    });
    setProgress(0);
    showToast(mode === "merge" ? "PDF queue updated." : "PDF ready for processing.");
  };

  const handleFileChange = (event) => {
    applyFiles(Array.from(event.target.files ?? []));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    applyFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const processPdf = async () => {
    if (!files.length) {
      showToast("Choose a PDF before processing.", "error");
      return;
    }

    try {
      setBusy(true);
      setProgress(mode === "compress" ? 4 : 28);

      let nextResult;

      if (mode === "merge") {
        nextResult = await mergePdfFiles(files);
        setProgress(100);
      } else if (mode === "split") {
        nextResult = await splitPdfFile(activeFile, rangeInput);
        setProgress(100);
      } else {
        nextResult = await compressPdfFile(activeFile, {
          quality: quality / 100,
          onProgress: setProgress
        });
      }

      setResult((current) => {
        if (current?.downloadUrl) {
          URL.revokeObjectURL(current.downloadUrl);
        }

        return {
          ...nextResult,
          downloadUrl: blobToDownloadUrl(nextResult.blob)
        };
      });

      showToast(`${config.buttonLabel} complete.`);
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
        <h2 className="mt-4 text-3xl font-semibold text-strong">{config.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{config.description}</p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="application/pdf"
            multiple={config.allowMultiple}
            onChange={handleFileChange}
          />

          <button
            className={`drop-zone ${dragging ? "is-dragging" : ""}`}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <span className="text-base font-semibold text-strong">
              {config.allowMultiple ? "Drop PDF files here" : "Drop a PDF file here"}
            </span>
            <span className="mt-2 text-sm leading-7 text-muted">
              Drag and drop or tap to browse. {config.allowMultiple ? "Multiple files supported." : "One file at a time."}
            </span>
          </button>

          <div className="surface-panel p-4">
            <p className="text-sm font-semibold text-strong">Uploaded files</p>
            <div className="mt-3 space-y-3">
              {files.length ? (
                files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="value-box">
                    <p className="text-sm font-semibold text-strong break-all">{file.name}</p>
                    <p className="mt-1 text-xs text-muted">{formatBytes(file.size)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No PDF uploaded yet.</p>
              )}
            </div>
          </div>

          {mode === "split" ? (
            <div className="space-y-3">
              <label className="field-label" htmlFor="pdf-range">Page range</label>
              <input
                id="pdf-range"
                className="input-field"
                type="text"
                placeholder="Example: 1-3,5,8-10"
                value={rangeInput}
                onChange={(event) => setRangeInput(event.target.value)}
              />
              <p className="field-help">Extract selected pages into a new PDF download.</p>
            </div>
          ) : null}

          {mode === "compress" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="field-label" htmlFor="pdf-quality">Compression quality</label>
                <span className="text-sm font-semibold text-muted">{quality}%</span>
              </div>
              <input
                id="pdf-quality"
                className="w-full accent-brand-500"
                type="range"
                min="40"
                max="90"
                step="5"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
              <p className="field-help">Best for scanned or image-heavy PDFs. Text-based PDFs may see smaller gains.</p>
            </div>
          ) : null}

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={processPdf} disabled={busy}>
              {busy ? "Processing..." : config.buttonLabel}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setFiles([]);
                setResult((current) => {
                  if (current?.downloadUrl) {
                    URL.revokeObjectURL(current.downloadUrl);
                  }

                  return null;
                });
                setProgress(0);
              }}
            >
              Clear
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Before size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{formatBytes(result?.originalSize ?? beforeSize)}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">After size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{result ? formatBytes(result.convertedSize) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Size change</p>
              <p className="mt-2 text-lg font-semibold text-strong">{reduction}</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-strong">Processing progress</p>
                <p className="mt-1 text-sm text-muted">
                  {mode === "compress"
                    ? "Compression renders each page before rebuilding the PDF."
                    : "Process starts after you confirm the uploaded file list."}
                </p>
              </div>
              <p className="text-sm font-semibold text-strong">{progress}%</p>
            </div>
            <div className="progress-track mt-4">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="surface-panel p-5">
            <p className="text-sm font-semibold text-strong">Output summary</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="value-box">
                <p className="text-xs uppercase tracking-[0.16em] text-soft">Selected files</p>
                <p className="mt-2 text-lg font-semibold text-strong">{files.length || "Waiting"}</p>
              </div>
              <div className="value-box">
                <p className="text-xs uppercase tracking-[0.16em] text-soft">Pages in result</p>
                <p className="mt-2 text-lg font-semibold text-strong">{result?.pageCount ?? "Waiting"}</p>
              </div>
            </div>

            {result ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-strong break-all">{result.fileName}</p>
                  <p className="mt-1 text-sm text-muted">Ready to download.</p>
                </div>
                <a className="btn-primary" href={result.downloadUrl} download={result.fileName}>
                  Download PDF
                </a>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">The processed PDF download appears here after the job finishes.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
