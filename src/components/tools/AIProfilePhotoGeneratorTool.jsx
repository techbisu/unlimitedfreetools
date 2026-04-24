import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import UploadDropzone from "./UploadDropzone.jsx";
import { useToolToast } from "./useToolToast.js";
import { downloadCanvas, fitWithin, readImageFile } from "../../utils/browser-media.js";
import { applyLiteProfileFilter } from "../../utils/profile-filters.js";

export default function AIProfilePhotoGeneratorTool() {
  const canvasRef = useRef(null);
  const [asset, setAsset] = useState(null);
  const [style, setStyle] = useState("cartoon");
  const { toast, showToast } = useToolToast();

  useEffect(() => {
    if (!asset || !canvasRef.current) {
      return;
    }

    const { width, height } = fitWithin(asset.image.naturalWidth, asset.image.naturalHeight, 1400);
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(asset.image, 0, 0, width, height);
    const source = context.getImageData(0, 0, width, height);
    const filtered = applyLiteProfileFilter(source, style);
    context.putImageData(filtered, 0, 0);
  }, [asset, style]);

  const handleUpload = async (file) => {
    try {
      const image = await readImageFile(file);
      setAsset({
        ...image,
        name: file.name.replace(/\.[^.]+$/, "")
      });
      showToast("Profile photo ready for styling.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Generate a lighter stylized profile photo with local canvas effects</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Upload a portrait, apply cartoon, sketch, or professional-tone filters, preview the transformed image instantly, and download the result.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <UploadDropzone label="Upload profile photo" help="Portrait images work best." fileName={asset?.name ?? ""} onFileSelect={handleUpload} />

          <div className="space-y-3">
            <label className="field-label" htmlFor="profile-style">Style filter</label>
            <select id="profile-style" className="select-field" value={style} onChange={(event) => setStyle(event.target.value)}>
              <option value="cartoon">Cartoon</option>
              <option value="sketch">Sketch</option>
              <option value="professional">Professional tone</option>
            </select>
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={() => downloadCanvas(canvasRef.current, `${asset?.name ?? "profile"}-${style}.png`)} disabled={!asset}>
              Download PNG
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Original</p>
              <div className="tool-preview mt-4">{asset ? <img src={asset.dataUrl} alt="Original profile" className="max-h-[320px] rounded-xl object-contain" /> : <p className="text-sm text-muted">Upload a portrait to preview the original image.</p>}</div>
            </div>
            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Styled result</p>
              <div className="tool-preview mt-4">{asset ? <canvas ref={canvasRef} className="max-h-[320px] rounded-xl object-contain" /> : <p className="text-sm text-muted">The filtered profile photo appears here.</p>}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
