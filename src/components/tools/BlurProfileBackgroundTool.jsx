import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { downloadCanvas, readImageFile } from "../../utils/browser-media.js";

export default function BlurProfileBackgroundTool() {
  const canvasRef = useRef(null);
  const [asset, setAsset] = useState(null);
  const [blurAmount, setBlurAmount] = useState(18);
  const [focusSize, setFocusSize] = useState(36);
  const [lift, setLift] = useState(-8);
  const { toast, showToast } = useToolToast();

  useEffect(() => {
    if (!asset || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = asset.image.naturalWidth;
    canvas.height = asset.image.naturalHeight;
    const context = canvas.getContext("2d");
    const focusRadius = Math.min(canvas.width, canvas.height) * (focusSize / 100);
    const centerX = canvas.width / 2;
    const centerY = canvas.height * (0.5 + lift / 100);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.filter = `blur(${blurAmount}px)`;
    context.drawImage(asset.image, 0, 0, canvas.width, canvas.height);
    context.filter = "none";

    context.save();
    context.beginPath();
    context.arc(centerX, centerY, focusRadius, 0, Math.PI * 2);
    context.clip();
    context.drawImage(asset.image, 0, 0, canvas.width, canvas.height);
    context.restore();
  }, [asset, blurAmount, focusSize, lift]);

  const handleUpload = async (file) => {
    try {
      const image = await readImageFile(file);
      setAsset({
        ...image,
        name: file.name.replace(/\.[^.]+$/, "")
      });
      showToast("Profile photo loaded.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Blur the background while keeping the profile subject crisp</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a portrait, keep the center focus sharp, blur the outer background, and export a cleaner social profile image.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone label="Upload portrait" help="Center-focused portraits work best." fileName={asset?.name ?? ""} onFileSelect={handleUpload} />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><label className="field-label" htmlFor="profile-blur">Blur strength</label><span className="text-sm font-semibold text-muted">{blurAmount}px</span></div>
            <input id="profile-blur" className="w-full" type="range" min="4" max="30" value={blurAmount} onChange={(event) => setBlurAmount(Number(event.target.value))} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><label className="field-label" htmlFor="profile-focus">Focus size</label><span className="text-sm font-semibold text-muted">{focusSize}%</span></div>
            <input id="profile-focus" className="w-full" type="range" min="22" max="48" value={focusSize} onChange={(event) => setFocusSize(Number(event.target.value))} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><label className="field-label" htmlFor="profile-lift">Focus lift</label><span className="text-sm font-semibold text-muted">{lift}%</span></div>
            <input id="profile-lift" className="w-full" type="range" min="-18" max="18" value={lift} onChange={(event) => setLift(Number(event.target.value))} />
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={() => downloadCanvas(canvasRef.current, `${asset?.name ?? "profile"}-blurred-background.png`)} disabled={!asset}>
              Download PNG
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[300px] sm:min-h-[460px]">
              {asset ? <canvas ref={canvasRef} className="max-h-[620px] rounded-xl object-contain" /> : <p className="text-sm text-muted">The blurred-background preview appears here after upload.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
