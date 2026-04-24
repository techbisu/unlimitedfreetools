import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { downloadCanvas, readImageFile } from "../../utils/browser-media.js";
import { renderPdfFirstPageToImage } from "../../utils/pdf-images.js";

function wrapLines(context, text, maxWidth) {
  const lines = [];
  const paragraphs = text.split("\n");

  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      return;
    }

    let current = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const next = `${current} ${words[index]}`;
      if (context.measureText(next).width <= maxWidth) {
        current = next;
      } else {
        lines.push(current);
        current = words[index];
      }
    }
    lines.push(current);
  });

  return lines;
}

export default function ResumeScreenshotGenerator() {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState("text");
  const [resumeText, setResumeText] = useState("Alex Carter\nProduct Designer\n\nExperience\nLed mobile redesigns for fintech and creator tools.\nBuilt design systems used across 4 product teams.\n\nSkills\nFigma, UX writing, prototyping, design systems");
  const [asset, setAsset] = useState(null);
  const [accent, setAccent] = useState("#0f8b8d");
  const { toast, showToast } = useToolToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    canvas.width = 1100;
    canvas.height = 1500;

    context.fillStyle = "#e2e8f0";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(80, 72, 940, 1360);
    context.fillStyle = accent;
    context.fillRect(80, 72, 940, 24);

    if (mode === "upload" && asset?.dataUrl) {
      const image = new Image();
      image.onload = () => {
        context.fillStyle = "#0f172a";
        context.font = "700 48px Inter, sans-serif";
        context.fillText("Resume Snapshot", 140, 170);
        context.fillStyle = "#64748b";
        context.font = "400 26px Inter, sans-serif";
        context.fillText(asset.caption, 140, 214);
        context.fillStyle = "#f8fafc";
        context.fillRect(140, 260, 820, 1040);
        context.drawImage(image, 160, 280, 780, 1000);
      };
      image.src = asset.dataUrl;
      return;
    }

    context.fillStyle = "#0f172a";
    context.font = "700 54px Inter, sans-serif";
    const [titleLine = "Resume", subtitleLine = ""] = resumeText.split("\n");
    context.fillText(titleLine, 140, 180);
    context.fillStyle = accent;
    context.font = "600 28px Inter, sans-serif";
    context.fillText(subtitleLine, 140, 228);

    context.fillStyle = "#334155";
    context.font = "400 25px Inter, sans-serif";
    const lines = wrapLines(context, resumeText.split("\n").slice(2).join("\n"), 760);
    let y = 310;
    lines.slice(0, 28).forEach((line) => {
      if (!line) {
        y += 18;
        return;
      }
      context.fillText(line, 140, y);
      y += 42;
    });

    context.fillStyle = "#ecfeff";
    context.fillRect(760, 160, 180, 64);
    context.fillStyle = accent;
    context.font = "700 22px Inter, sans-serif";
    context.fillText("Ready to Share", 784, 200);
  }, [accent, asset, mode, resumeText]);

  const handleAsset = async (file) => {
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const rendered = await renderPdfFirstPageToImage(file);
        setAsset({
          dataUrl: rendered.dataUrl,
          caption: `${file.name} · ${rendered.pageCount} page${rendered.pageCount === 1 ? "" : "s"}`
        });
      } else {
        const image = await readImageFile(file);
        setAsset({
          dataUrl: image.dataUrl,
          caption: file.name
        });
      }

      setMode("upload");
      showToast("Resume asset ready for a screenshot card.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Turn a resume into a polished screenshot card for sharing</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Start from plain resume text or upload a PDF or image, generate a cleaner card layout, and export a screenshot-style PNG for portfolios and social posts.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="grid grid-cols-2 gap-3">
            <button className={`btn-secondary ${mode === "text" ? "ring-2 ring-cyan-500" : ""}`} type="button" onClick={() => setMode("text")}>Text Mode</button>
            <button className={`btn-secondary ${mode === "upload" ? "ring-2 ring-cyan-500" : ""}`} type="button" onClick={() => setMode("upload")}>Upload Mode</button>
          </div>

          {mode === "text" ? (
            <div className="space-y-3">
              <label className="field-label" htmlFor="resume-text">Resume content</label>
              <textarea id="resume-text" className="textarea-field min-h-[260px]" value={resumeText} onChange={(event) => setResumeText(event.target.value)} />
            </div>
          ) : (
            <UploadDropzone
              label="Upload resume PDF or image"
              accept="application/pdf,.pdf,image/*"
              help="PDF, PNG, and JPG files work best."
              fileName={asset?.caption ?? ""}
              onFileSelect={handleAsset}
            />
          )}

          <div className="space-y-3">
            <label className="field-label" htmlFor="resume-accent">Accent color</label>
            <input id="resume-accent" className="input-field h-12" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} />
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={() => downloadCanvas(canvasRef.current, "resume-screenshot-card.png")}>
              Download PNG
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[320px] sm:min-h-[520px]">
              <canvas ref={canvasRef} className="max-h-[640px] rounded-xl object-contain shadow-xl shadow-slate-900/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
