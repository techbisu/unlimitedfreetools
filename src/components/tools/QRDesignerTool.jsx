import { useEffect, useState, useRef } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import {
  copyCanvasToClipboard,
  downloadCanvas,
  downloadTextFile,
  readFileAsDataUrl,
  shareCanvas
} from "../../utils/browser-media.js";
import {
  buildQrScene,
  drawQrSceneToCanvas,
  renderQrSceneToSvg
} from "../../utils/qr-designer.js";

const dotStyles = [
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
  { value: "diamond", label: "Diamond" },
  { value: "dots", label: "Dots" }
];

const cornerStyles = [
  { value: "frame", label: "Frame" },
  { value: "rounded", label: "Rounded" },
  { value: "leaf", label: "Leaf" },
  { value: "square", label: "Square" }
];

export default function QRDesignerTool() {
  const canvasRef = useRef(null);
  const [value, setValue] = useState("https://utilityhub.example.com/screenshot-beautifier");
  const [foreground, setForeground] = useState("#111827");
  const [background, setBackground] = useState("#ffffff");
  const [dotStyle, setDotStyle] = useState("rounded");
  const [cornerStyle, setCornerStyle] = useState("frame");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [svgMarkup, setSvgMarkup] = useState("");
  const [moduleCount, setModuleCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const { toast, showToast } = useToolToast(2800);

  useEffect(() => {
    let active = true;

    const render = async () => {
      try {
        setBusy(true);
        const scene = await buildQrScene({
          text: value,
          foreground,
          background,
          dotStyle,
          cornerStyle,
          logoDataUrl
        });
        if (!active) {
          return;
        }

        await drawQrSceneToCanvas(canvasRef.current, scene);
        if (!active) {
          return;
        }

        setSvgMarkup(renderQrSceneToSvg(scene));
        setModuleCount(scene.count);
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
  }, [background, cornerStyle, dotStyle, foreground, logoDataUrl, value]);

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setLogoDataUrl(await readFileAsDataUrl(file));
      showToast("Logo added to the QR preview.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCopy = async () => {
    try {
      await copyCanvasToClipboard(canvasRef.current);
      showToast("QR image copied to the clipboard.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleShare = async () => {
    try {
      const mode = await shareCanvas(canvasRef.current, {
        filename: "advanced-qr-code.png",
        title: "QR Code Designer",
        text: "Styled QR code with custom dots, eyes, and logo overlay."
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
        <h2 className="mt-4 text-3xl font-semibold text-strong">Design a branded QR code with custom dots and logo overlay</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Generate a QR code for campaigns, menus, packaging, or creator links, then customize the shape language, colors, and center logo before exporting PNG or SVG.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor="qr-designer-value">Text or URL</label>
            <textarea
              id="qr-designer-value"
              className="textarea-field min-h-[120px]"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>

          <div className="tool-control-grid">
            <div className="space-y-3">
              <label className="field-label" htmlFor="qr-designer-foreground">Foreground</label>
              <input id="qr-designer-foreground" className="input-field h-12" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="field-label" htmlFor="qr-designer-background">Background</label>
              <input id="qr-designer-background" className="input-field h-12" type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="qr-designer-dot-style">Dot style</label>
            <select id="qr-designer-dot-style" className="select-field" value={dotStyle} onChange={(event) => setDotStyle(event.target.value)}>
              {dotStyles.map((style) => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="qr-designer-corner-style">Corner style</label>
            <select id="qr-designer-corner-style" className="select-field" value={cornerStyle} onChange={(event) => setCornerStyle(event.target.value)}>
              {cornerStyles.map((style) => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="qr-designer-logo">Center logo</label>
            <input
              id="qr-designer-logo"
              className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-slate-100 dark:file:text-slate-900"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
            />
            <p className="field-help">Keep the logo compact for reliable scanning on print and mobile screens.</p>
          </div>

          {logoDataUrl ? (
            <button className="btn-secondary" type="button" onClick={() => setLogoDataUrl("")}>
              Remove logo
            </button>
          ) : null}

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Modules</p>
              <p className="mt-2 text-lg font-semibold text-strong">{moduleCount || "..."}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Exports</p>
              <p className="mt-2 text-lg font-semibold text-strong">PNG and SVG</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Status</p>
              <p className="mt-2 text-lg font-semibold text-strong">{busy ? "Rendering" : "Live preview"}</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[260px] sm:min-h-[380px]">
              <canvas ref={canvasRef} className="w-full max-w-[360px] rounded-[2rem] bg-white p-3 shadow-2xl shadow-slate-900/10" width="620" height="620" />
            </div>
            <div className="tool-actions mt-5">
              <button className="btn-primary" type="button" onClick={() => downloadCanvas(canvasRef.current, "advanced-qr-code.png")}>
                Download PNG
              </button>
              <button className="btn-secondary" type="button" onClick={() => downloadTextFile(svgMarkup, "advanced-qr-code.svg", "image/svg+xml;charset=utf-8")} disabled={!svgMarkup}>
                Download SVG
              </button>
              <button className="btn-secondary" type="button" onClick={handleCopy}>
                Copy image
              </button>
              <button className="btn-secondary" type="button" onClick={handleShare}>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
