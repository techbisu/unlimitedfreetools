import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { downloadCanvas, readImageFile } from "../../utils/browser-media.js";
import { calculateFunFaceScores, detectFaceLocally } from "../../utils/fun-face.js";

export default function FaceAnalyzerTool() {
  const canvasRef = useRef(null);
  const [asset, setAsset] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, showToast } = useToolToast();

  useEffect(() => {
    if (!asset || !analysis || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = analysis.image.naturalWidth;
    canvas.height = analysis.image.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(analysis.image, 0, 0);
    context.lineWidth = 6;
    context.strokeStyle = "#22d3ee";
    context.strokeRect(analysis.box.x, analysis.box.y, analysis.box.width, analysis.box.height);
  }, [analysis, asset]);

  const analyze = async (file) => {
    try {
      setBusy(true);
      const image = await readImageFile(file);
      setAsset({
        ...image,
        name: file.name
      });
      const detection = await detectFaceLocally(image.dataUrl);
      const scores = calculateFunFaceScores(detection.image, detection.box);
      setAnalysis({
        ...detection,
        ...scores
      });
      showToast(detection.mode === "detector" ? "Face analyzed locally." : "Using a local fallback estimate.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Entertainment Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Run a playful local face scan and get fun scores</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a portrait, detect the face locally in the browser when supported, and generate smile, confidence, and fun-rating scores with a visible face box.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm leading-7 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-100">
        For entertainment purposes only
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone label="Upload portrait" help="Front-facing photos work best." fileName={asset?.name ?? ""} onFileSelect={analyze} />

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={() => downloadCanvas(canvasRef.current, "face-analyzer-result.png")} disabled={!analysis || busy}>Download result</button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Smile score</p>
              <p className="mt-2 text-lg font-semibold text-strong">{analysis?.smileScore ?? "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Confidence</p>
              <p className="mt-2 text-lg font-semibold text-strong">{analysis?.confidence ?? "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Fun rating</p>
              <p className="mt-2 text-lg font-semibold text-strong">{analysis?.funRating ?? "Waiting"}</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[300px] sm:min-h-[520px]">
              {analysis ? <canvas ref={canvasRef} className="max-h-[680px] rounded-xl object-contain" /> : <p className="text-sm text-muted">The local face box and fun scores appear here after upload.</p>}
            </div>
            {analysis ? (
              <p className="mt-4 text-sm text-muted">
                {analysis.mode === "detector" ? "Used browser-supported local face detection." : "Used a local fallback framing estimate because browser face detection was unavailable."}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
