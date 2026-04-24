import { useEffect, useMemo, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import {
  clamp,
  copyCanvasToClipboard,
  downloadCanvas,
  loadImage,
  readImageFile,
  shareCanvas
} from "../../utils/browser-media.js";

const templates = [
  { id: "galaxy-brain", label: "Galaxy Brain", src: "/images/meme-templates/galaxy-brain.svg" },
  { id: "office-chaos", label: "Office Chaos", src: "/images/meme-templates/office-chaos.svg" },
  { id: "retro-panic", label: "Retro Panic", src: "/images/meme-templates/retro-panic.svg" },
  { id: "victory-laptop", label: "Victory Laptop", src: "/images/meme-templates/victory-laptop.svg" }
];

function wrapText(ctx, text, maxWidth) {
  const lines = [];

  text.split("\n").forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      return;
    }

    let current = words[0];

    for (let index = 1; index < words.length; index += 1) {
      const next = `${current} ${words[index]}`;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
      } else {
        lines.push(current);
        current = words[index];
      }
    }

    lines.push(current);
  });

  return lines.length > 0 ? lines : [text];
}

export default function MemeGenerator() {
  const canvasRef = useRef(null);
  const boundsRef = useRef([]);
  const dragRef = useRef(null);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [source, setSource] = useState({
    name: templates[0].label,
    src: templates[0].src
  });
  const [topText, setTopText] = useState("WHEN THE FEATURE SHIPS");
  const [bottomText, setBottomText] = useState("AND THE COMMENTS TURN INTO FREE MARKETING");
  const [fontScale, setFontScale] = useState(0.09);
  const [textPositions, setTextPositions] = useState({
    top: { xRatio: 0.5, yRatio: 0.11 },
    bottom: { xRatio: 0.5, yRatio: 0.82 }
  });
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0 });
  const { toast, showToast } = useToolToast(2600);

  const layers = useMemo(
    () => [
      { id: "top", text: topText, position: textPositions.top },
      { id: "bottom", text: bottomText, position: textPositions.bottom }
    ],
    [bottomText, textPositions.bottom, textPositions.top, topText]
  );

  useEffect(() => {
    const template = templates.find((item) => item.id === selectedTemplate);
    if (template) {
      setSource({ name: template.label, src: template.src });
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (!source?.src || !canvasRef.current) {
      return undefined;
    }

    let active = true;

    const render = async () => {
      const image = await loadImage(source.src);
      if (!active) {
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      setImageMeta({ width: canvas.width, height: canvas.height });

      const fontSize = Math.max(42, canvas.width * fontScale);
      ctx.font = `900 ${fontSize}px Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineJoin = "round";

      const nextBounds = [];

      layers.forEach((layer) => {
        const lines = wrapText(ctx, layer.text.toUpperCase(), canvas.width * 0.82);
        const lineHeight = fontSize * 0.94;
        const widest = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
        const x = layer.position.xRatio * canvas.width;
        const y = layer.position.yRatio * canvas.height;

        nextBounds.push({
          id: layer.id,
          left: x - widest / 2 - 18,
          right: x + widest / 2 + 18,
          top: y - 10,
          bottom: y + lineHeight * lines.length + 10
        });

        lines.forEach((line, index) => {
          const offsetY = y + index * lineHeight;
          ctx.lineWidth = Math.max(6, fontSize * 0.09);
          ctx.strokeStyle = "#111111";
          ctx.fillStyle = "#ffffff";
          ctx.strokeText(line, x, offsetY);
          ctx.fillText(line, x, offsetY);
        });
      });

      boundsRef.current = nextBounds;
    };

    render().catch((error) => showToast(error.message, "error"));

    return () => {
      active = false;
    };
  }, [fontScale, layers, source]);

  const pointerToCanvas = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handlePointerDown = (event) => {
    if (!canvasRef.current) {
      return;
    }

    const point = pointerToCanvas(event);
    const activeLayer = [...boundsRef.current].reverse().find((bound) => point.x >= bound.left && point.x <= bound.right && point.y >= bound.top && point.y <= bound.bottom);

    if (!activeLayer) {
      return;
    }

    const current = textPositions[activeLayer.id];
    dragRef.current = {
      id: activeLayer.id,
      dx: point.x - current.xRatio * canvasRef.current.width,
      dy: point.y - current.yRatio * canvasRef.current.height
    };

    canvasRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || !canvasRef.current) {
      return;
    }

    const point = pointerToCanvas(event);
    const canvas = canvasRef.current;
    setTextPositions((previous) => ({
      ...previous,
      [dragRef.current.id]: {
        xRatio: clamp((point.x - dragRef.current.dx) / canvas.width, 0.16, 0.84),
        yRatio: clamp((point.y - dragRef.current.dy) / canvas.height, 0.04, 0.92)
      }
    }));
  };

  const stopDragging = () => {
    dragRef.current = null;
  };

  const handleUpload = async (file) => {
    try {
      const { dataUrl } = await readImageFile(file);
      setSelectedTemplate("");
      setSource({
        name: file.name.replace(/\.[^.]+$/, ""),
        src: dataUrl
      });
      showToast("Image uploaded. Drag the text directly on the preview.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCopy = async () => {
    try {
      await copyCanvasToClipboard(canvasRef.current);
      showToast("Meme copied as an image.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleShare = async () => {
    try {
      const mode = await shareCanvas(canvasRef.current, {
        filename: `${source.name.toLowerCase().replace(/\s+/g, "-")}-meme.png`,
        title: "Meme Generator",
        text: "Made in the browser with draggable top and bottom text."
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
        <h2 className="mt-4 text-3xl font-semibold text-strong">Make memes with uploads, templates, and drag-to-place text</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Start from a built-in template or upload your own image, then drag top and bottom captions until the joke lands. Everything renders directly in the browser.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone
            label="Upload your own image"
            help="Or skip upload and start from one of the built-in meme templates below."
            fileName={selectedTemplate ? "" : source.name}
            onFileSelect={handleUpload}
          />

          <div className="space-y-3">
            <p className="field-label">Template gallery</p>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={`overflow-hidden rounded-2xl border text-left transition ${selectedTemplate === template.id ? "border-cyan-500 shadow-lg shadow-cyan-500/15" : "border-[var(--surface-border)]"}`}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <img src={template.src} alt={template.label} className="aspect-square w-full object-cover" />
                  <span className="block px-3 py-2 text-sm font-medium text-strong">{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="meme-top-text">Top text</label>
            <input id="meme-top-text" className="input-field" value={topText} onChange={(event) => setTopText(event.target.value)} />
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="meme-bottom-text">Bottom text</label>
            <input id="meme-bottom-text" className="input-field" value={bottomText} onChange={(event) => setBottomText(event.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="field-label" htmlFor="meme-font-scale">Text size</label>
              <span className="text-sm font-semibold text-muted">{Math.round(fontScale * 100)}%</span>
            </div>
            <input
              id="meme-font-scale"
              className="w-full"
              type="range"
              min="0.05"
              max="0.14"
              step="0.01"
              value={fontScale}
              onChange={(event) => setFontScale(Number(event.target.value))}
            />
          </div>

          <div className="tool-actions">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setTextPositions({
                top: { xRatio: 0.5, yRatio: 0.11 },
                bottom: { xRatio: 0.5, yRatio: 0.82 }
              })}
            >
              Reset text layout
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Source</p>
              <p className="mt-2 text-lg font-semibold text-strong">{source.name}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Canvas</p>
              <p className="mt-2 text-lg font-semibold text-strong">{imageMeta.width ? `${imageMeta.width} x ${imageMeta.height}` : "Loading"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Tip</p>
              <p className="mt-2 text-lg font-semibold text-strong">Drag captions on preview</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[280px] sm:min-h-[440px]">
              <canvas
                ref={canvasRef}
                className="max-h-[640px] w-full cursor-grab rounded-xl object-contain active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDragging}
                onPointerLeave={stopDragging}
              />
            </div>
            <p className="mt-4 text-sm text-muted">Drag the top or bottom caption directly on the canvas to reposition it before downloading.</p>
            <div className="tool-actions mt-5">
              <button
                className="btn-primary"
                type="button"
                onClick={() => downloadCanvas(canvasRef.current, `${source.name.toLowerCase().replace(/\s+/g, "-")}-meme.png`)}
              >
                Download meme
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
