import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { downloadCanvas, readImageFile } from "../../utils/browser-media.js";

function getComparisonBounds(beforeImage, afterImage) {
  return {
    width: Math.max(beforeImage.naturalWidth, afterImage.naturalWidth),
    height: Math.max(beforeImage.naturalHeight, afterImage.naturalHeight)
  };
}

function drawContainedImage(context, image, targetWidth, targetHeight) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = targetWidth / targetHeight;

  let drawWidth = targetWidth;
  let drawHeight = targetHeight;

  if (imageRatio > targetRatio) {
    drawHeight = targetWidth / imageRatio;
  } else {
    drawWidth = targetHeight * imageRatio;
  }

  const offsetX = (targetWidth - drawWidth) / 2;
  const offsetY = (targetHeight - drawHeight) / 2;

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function renderComparisonCanvas(canvas, beforeImage, afterImage, slider) {
  const { width, height } = getComparisonBounds(beforeImage, afterImage);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  const splitX = canvas.width * (slider / 100);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f4efe6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawContainedImage(context, beforeImage, canvas.width, canvas.height);

  context.save();
  context.beginPath();
  context.rect(0, 0, splitX, canvas.height);
  context.clip();
  drawContainedImage(context, afterImage, canvas.width, canvas.height);
  context.restore();

  context.fillStyle = "#ffffff";
  context.fillRect(splitX - 2, 0, 4, canvas.height);

  context.fillStyle = "rgba(15, 23, 42, 0.86)";
  context.beginPath();
  context.roundRect(18, 18, 88, 34, 999);
  context.roundRect(canvas.width - 106, 18, 88, 34, 999);
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "600 18px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("After", 62, 35);
  context.fillText("Before", canvas.width - 62, 35);
}

export default function ImageComparisonTool() {
  const previewCanvasRef = useRef(null);
  const exportCanvasRef = useRef(null);
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [slider, setSlider] = useState(50);
  const { toast, showToast } = useToolToast();

  useEffect(() => {
    if (!before || !after || !exportCanvasRef.current || !previewCanvasRef.current) {
      return;
    }

    renderComparisonCanvas(exportCanvasRef.current, before.image, after.image, slider);
    renderComparisonCanvas(previewCanvasRef.current, before.image, after.image, slider);
  }, [after, before, slider]);

  const handleFile = async (setter, file) => {
    try {
      const image = await readImageFile(file);
      setter({
        ...image,
        name: file.name
      });
      showToast("Comparison image loaded.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Compare two images with a swipe slider and export the result</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a before image and an after image, scrub the slider to reveal the difference, and save the current comparison frame.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone label="Before image" help="Upload the original state." fileName={before?.name ?? ""} onFileSelect={(file) => handleFile(setBefore, file)} />
          <UploadDropzone label="After image" help="Upload the edited or improved state." fileName={after?.name ?? ""} onFileSelect={(file) => handleFile(setAfter, file)} />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><label className="field-label" htmlFor="compare-slider">Reveal point</label><span className="text-sm font-semibold text-muted">{slider}%</span></div>
            <input id="compare-slider" className="w-full" type="range" min="0" max="100" value={slider} onChange={(event) => setSlider(Number(event.target.value))} />
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={() => downloadCanvas(exportCanvasRef.current, "before-after-comparison.png")} disabled={!before || !after}>Download PNG</button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[280px] sm:min-h-[520px]">
              {before && after ? (
                <canvas ref={previewCanvasRef} className="block w-full max-w-3xl rounded-2xl shadow-panel" />
              ) : (
                <p className="text-sm text-muted">Upload both images to start comparing them.</p>
              )}
            </div>
          </div>

          <canvas ref={exportCanvasRef} className="hidden" />
        </div>
      </div>
    </section>
  );
}
