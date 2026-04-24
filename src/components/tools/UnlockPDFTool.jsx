import { useEffect, useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { formatBytes } from "../../utils/browser-media.js";
import { unlockPdfFile } from "../../utils/pdfUnlock.js";

export default function UnlockPDFTool() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ tone: "default", message: "" });
  const [result, setResult] = useState(null);
  const { toast, showToast } = useToolToast(2800);

  useEffect(() => {
    return () => {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    };
  }, [result]);

  const stats = useMemo(
    () => ({
      originalSize: file ? formatBytes(file.size) : "Waiting",
      outputSize: result ? formatBytes(result.convertedSize) : "Waiting",
      pages: result?.pageCount ?? "Waiting"
    }),
    [file, result]
  );

  const handleFileSelect = async (nextFile) => {
    if (!(nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf"))) {
      setStatus({ tone: "error", message: "Invalid PDF" });
      showToast("Choose a .pdf file only.", "error");
      return;
    }

    setFile(nextFile);
    setProgress(0);
    setStatus({ tone: "default", message: "" });
    setResult((current) => {
      if (current?.downloadUrl) {
        URL.revokeObjectURL(current.downloadUrl);
      }

      return null;
    });
    showToast("PDF ready. Enter the password to unlock it.");
  };

  const handleUnlock = async () => {
    if (!file) {
      setStatus({ tone: "error", message: "Choose a password-protected PDF first." });
      showToast("Choose a PDF before unlocking.", "error");
      return;
    }

    if (!password) {
      setStatus({ tone: "error", message: "Enter the correct password to unlock the PDF." });
      showToast("Enter the PDF password.", "error");
      return;
    }

    try {
      setBusy(true);
      setProgress(4);
      setStatus({ tone: "default", message: "" });

      const unlocked = await unlockPdfFile(file, password, {
        onProgress: setProgress
      });

      setResult((current) => {
        if (current?.downloadUrl) {
          URL.revokeObjectURL(current.downloadUrl);
        }

        return {
          ...unlocked,
          downloadUrl: URL.createObjectURL(unlocked.blob)
        };
      });
      setStatus({ tone: "success", message: "PDF unlocked successfully" });
      showToast("PDF unlocked successfully");
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Incorrect password" });
      showToast(error.message || "Incorrect password", "error");
    } finally {
      setBusy(false);
    }
  };

  const statusClasses =
    status.tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100"
      : status.tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100"
        : "border-[var(--surface-border)] bg-[var(--card-fill)] text-muted";

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Unlock a PDF using the password you already have</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Remove the password from a protected PDF for easier viewing, sharing, and archiving. This tool does not crack or bypass security. It only works when you enter the correct password.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone
            label="Upload protected PDF"
            accept="application/pdf,.pdf"
            help="Drag and drop a PDF here or choose it from your device."
            fileName={file?.name ?? ""}
            onFileSelect={handleFileSelect}
          />

          <div className="space-y-3">
            <label className="field-label" htmlFor="unlock-pdf-password">PDF password</label>
            <input
              id="unlock-pdf-password"
              className="input-field"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter the correct password"
            />
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm leading-7 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
            {"\uD83D\uDD12"} Your files are processed locally in your browser. No upload to server.
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={handleUnlock} disabled={busy}>
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Unlocking...
                </span>
              ) : (
                "Unlock PDF"
              )}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setFile(null);
                setPassword("");
                setProgress(0);
                setStatus({ tone: "default", message: "" });
                setResult((current) => {
                  if (current?.downloadUrl) {
                    URL.revokeObjectURL(current.downloadUrl);
                  }

                  return null;
                });
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
              <p className="text-xs uppercase tracking-[0.16em] text-soft">File name</p>
              <p className="mt-2 break-all text-lg font-semibold text-strong">{file?.name ?? "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">File size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{stats.originalSize}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Unlocked pages</p>
              <p className="mt-2 text-lg font-semibold text-strong">{stats.pages}</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-strong">Unlock progress</p>
                <p className="mt-1 text-sm text-muted">
                  The PDF is opened locally with your password, then rebuilt into a new unlocked file in the browser.
                </p>
              </div>
              <p className="text-sm font-semibold text-strong">{progress}%</p>
            </div>
            <div className="progress-track mt-4">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="surface-panel p-5">
            <p className="text-sm font-semibold text-strong">Result</p>
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${statusClasses}`}>
              {status.message || "Upload a protected PDF and enter the correct password to create an unlocked copy."}
            </div>

            {result ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-strong break-all">{result.fileName}</p>
                  <p className="mt-1 text-sm text-muted">
                    Unlocked PDF ready. Output size: {stats.outputSize}
                  </p>
                </div>
                <a className="btn-primary" href={result.downloadUrl} download={result.fileName}>
                  Download unlocked PDF
                </a>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">The unlocked PDF download appears here after processing succeeds.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
