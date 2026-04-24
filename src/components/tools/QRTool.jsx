import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { downloadCanvas, drawQrCodeWithLogo, fileToDataUrl } from "../../utils/qr.js";

export default function QRTool() {
  const canvasRef = useRef(null);
  const [value, setValue] = useState("https://example.com/campaign");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [foreground, setForeground] = useState("#0f172a");
  const [background, setBackground] = useState("#ffffff");
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToolToast();

  const generate = async () => {
    try {
      setLoading(true);
      await drawQrCodeWithLogo({
        canvas: canvasRef.current,
        text: value,
        foreground,
        background,
        logoDataUrl
      });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
  }, []);

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const nextLogo = await fileToDataUrl(file);
      setLogoDataUrl(nextLogo);
      showToast("Logo added to the QR code.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      showToast("QR content copied to the clipboard.");
    } catch {
      showToast("Clipboard access was blocked.", "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Interactive Tool</span>
          <h2 className="mt-4 text-3xl font-semibold text-strong">Create a branded QR code in one pass</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Create custom QR codes for websites, menus, business cards, product labels, and offline campaigns, then download a clean PNG in seconds.
          </p>
        </div>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor="qr-value">Text or URL</label>
            <textarea
              id="qr-value"
              className="textarea-field min-h-[132px]"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>

          <div className="tool-control-grid">
            <div className="space-y-3">
              <label className="field-label" htmlFor="qr-foreground">Foreground</label>
              <input id="qr-foreground" className="input-field h-12" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="field-label" htmlFor="qr-background">Background</label>
              <input id="qr-background" className="input-field h-12" type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="qr-logo">Overlay logo</label>
            <input id="qr-logo" className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-slate-100 dark:file:text-slate-900" type="file" accept="image/*" onChange={handleLogoUpload} />
            <p className="field-help">PNG with transparent background works best for centered branding.</p>
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate QR"}
            </button>
            <button className="btn-secondary" type="button" onClick={handleCopy}>Copy text</button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Download</p>
              <p className="mt-2 text-lg font-semibold text-strong">PNG export</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Overlay</p>
              <p className="mt-2 text-lg font-semibold text-strong">{logoDataUrl ? "Logo attached" : "No logo"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Usage</p>
              <p className="mt-2 text-lg font-semibold text-strong">Unlimited</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[220px] sm:min-h-[320px]">
              <canvas ref={canvasRef} className="w-full max-w-[320px] rounded-xl sm:max-w-[360px]" width="360" height="360" />
            </div>
            <div className="tool-actions mt-5">
              <button className="btn-primary" type="button" onClick={() => downloadCanvas(canvasRef.current)}>
                Download PNG
              </button>
              {logoDataUrl ? (
                <button className="btn-secondary" type="button" onClick={() => setLogoDataUrl("")}>
                  Remove logo
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
