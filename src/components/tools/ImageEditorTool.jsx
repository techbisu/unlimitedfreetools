import { useEffect, useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { formatBytes } from "../../utils/image.js";
import { blurImage, getEditorExtension, transformImage, watermarkImage } from "../../utils/image-editor.js";

const outputOptions = [
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPG" },
  { value: "image/webp", label: "WebP" }
];

const modeCopy = {
  transform: {
    heading: "Crop, rotate, and flip images online",
    description:
      "Trim unwanted edges, rotate the frame, mirror the image, and export a fresh file without opening a design app.",
    action: "Apply edits"
  },
  watermark: {
    heading: "Add a text or logo watermark in seconds",
    description:
      "Place a text watermark or brand logo over your image with control over opacity, size, and corner placement.",
    action: "Add watermark"
  },
  blur: {
    heading: "Blur the whole image or keep the center sharp",
    description:
      "Create a soft blur effect for the full frame or use a center focus blur that keeps the middle area clearer than the background.",
    action: "Blur image"
  }
};

const positionOptions = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "center", label: "Center" }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ImageEditorTool({ mode = "transform" }) {
  const [file, setFile] = useState(null);
  const [sourcePreview, setSourcePreview] = useState("");
  const [result, setResult] = useState(null);
  const [outputFormat, setOutputFormat] = useState("image/png");
  const [busy, setBusy] = useState(false);

  const [cropLeft, setCropLeft] = useState(0);
  const [cropTop, setCropTop] = useState(0);
  const [cropWidth, setCropWidth] = useState(100);
  const [cropHeight, setCropHeight] = useState(100);
  const [rotate, setRotate] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);

  const [watermarkKind, setWatermarkKind] = useState("text");
  const [watermarkText, setWatermarkText] = useState("Sample Watermark");
  const [watermarkFile, setWatermarkFile] = useState(null);
  const [watermarkPreview, setWatermarkPreview] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkScale, setWatermarkScale] = useState(22);
  const [watermarkPadding, setWatermarkPadding] = useState(4);
  const [watermarkTextSize, setWatermarkTextSize] = useState(6);
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#0f172a");

  const [blurMode, setBlurMode] = useState("entire");
  const [blurAmount, setBlurAmount] = useState(14);
  const [focusWidth, setFocusWidth] = useState(60);
  const [focusHeight, setFocusHeight] = useState(65);
  const [focusFeather, setFocusFeather] = useState(18);

  const { toast, showToast } = useToolToast(3200);

  useEffect(() => {
    return () => {
      if (sourcePreview) {
        URL.revokeObjectURL(sourcePreview);
      }
    };
  }, [sourcePreview]);

  useEffect(() => {
    return () => {
      if (watermarkPreview) {
        URL.revokeObjectURL(watermarkPreview);
      }
    };
  }, [watermarkPreview]);

  useEffect(() => {
    return () => {
      if (result?.previewUrl) {
        URL.revokeObjectURL(result.previewUrl);
      }
    };
  }, [result]);

  useEffect(() => {
    setCropWidth((current) => clamp(current, 1, 100 - cropLeft));
  }, [cropLeft]);

  useEffect(() => {
    setCropHeight((current) => clamp(current, 1, 100 - cropTop));
  }, [cropTop]);

  const copy = modeCopy[mode] ?? modeCopy.transform;
  const extension = getEditorExtension(outputFormat);
  const downloadName = useMemo(() => {
    if (!file) {
      return `edited-image.${extension}`;
    }

    const suffix =
      mode === "watermark" ? "watermarked" : mode === "blur" ? "blurred" : "edited";

    return `${file.name.replace(/\.[^.]+$/, "")}-${suffix}.${extension}`;
  }, [extension, file, mode]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      showToast("Choose a valid image file.", "error");
      return;
    }

    setFile(nextFile);
    setSourcePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(nextFile);
    });
    setResult((previous) => {
      if (previous?.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }

      return null;
    });
    showToast("Image ready for editing.");
  };

  const handleWatermarkFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      showToast("Upload an image file for the watermark logo.", "error");
      return;
    }

    setWatermarkFile(nextFile);
    setWatermarkPreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(nextFile);
    });
    showToast("Watermark logo loaded.");
  };

  const processImage = async () => {
    if (!file) {
      showToast("Upload an image before processing.", "error");
      return;
    }

    try {
      setBusy(true);

      const nextResult =
        mode === "watermark"
          ? await watermarkImage({
              file,
              format: outputFormat,
              watermarkKind,
              watermarkFile,
              watermarkText,
              position: watermarkPosition,
              opacity: watermarkOpacity,
              scale: watermarkScale,
              padding: watermarkPadding,
              textSize: watermarkTextSize,
              textColor,
              backgroundColor
            })
          : mode === "blur"
            ? await blurImage({
                file,
                format: outputFormat,
                blurMode,
                blurAmount,
                focusWidth,
                focusHeight,
                focusFeather
              })
            : await transformImage({
                file,
                format: outputFormat,
                cropLeft,
                cropTop,
                cropWidth,
                cropHeight,
                rotate,
                flipX,
                flipY
              });

      setResult((previous) => {
        if (previous?.previewUrl) {
          URL.revokeObjectURL(previous.previewUrl);
        }

        return nextResult;
      });
      showToast("Edited image is ready to download.");
    } catch (error) {
      showToast(error.message || "Image processing failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  const resetTransform = () => {
    setCropLeft(0);
    setCropTop(0);
    setCropWidth(100);
    setCropHeight(100);
    setRotate(0);
    setFlipX(false);
    setFlipY(false);
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">{copy.heading}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{copy.description}</p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor={`${mode}-image-upload`}>Upload image</label>
            <input
              id={`${mode}-image-upload`}
              className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-slate-100 dark:file:text-slate-900"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor={`${mode}-output-format`}>Output format</label>
            <select
              id={`${mode}-output-format`}
              className="select-field"
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value)}
            >
              {outputOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {mode === "transform" ? (
            <>
              <div className="tool-control-grid">
                <SliderField
                  label="Crop left"
                  value={cropLeft}
                  min={0}
                  max={99}
                  onChange={setCropLeft}
                  suffix="%"
                />
                <SliderField
                  label="Crop top"
                  value={cropTop}
                  min={0}
                  max={99}
                  onChange={setCropTop}
                  suffix="%"
                />
                <SliderField
                  label="Crop width"
                  value={cropWidth}
                  min={1}
                  max={Math.max(1, 100 - cropLeft)}
                  onChange={setCropWidth}
                  suffix="%"
                />
                <SliderField
                  label="Crop height"
                  value={cropHeight}
                  min={1}
                  max={Math.max(1, 100 - cropTop)}
                  onChange={setCropHeight}
                  suffix="%"
                />
              </div>

              <div className="space-y-3">
                <label className="field-label" htmlFor="rotate-image">Rotation</label>
                <select
                  id="rotate-image"
                  className="select-field"
                  value={rotate}
                  onChange={(event) => setRotate(Number(event.target.value))}
                >
                  <option value={0}>0 degrees</option>
                  <option value={90}>90 degrees</option>
                  <option value={180}>180 degrees</option>
                  <option value={270}>270 degrees</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-muted" style={{ borderColor: "var(--surface-border)", background: "var(--card-fill)" }}>
                  <input type="checkbox" checked={flipX} onChange={(event) => setFlipX(event.target.checked)} />
                  Flip horizontally
                </label>
                <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-muted" style={{ borderColor: "var(--surface-border)", background: "var(--card-fill)" }}>
                  <input type="checkbox" checked={flipY} onChange={(event) => setFlipY(event.target.checked)} />
                  Flip vertically
                </label>
              </div>

              <p className="field-help">Crop values use image percentages, which keeps the controls predictable on both desktop and mobile.</p>
            </>
          ) : null}

          {mode === "watermark" ? (
            <>
              <div className="space-y-3">
                <label className="field-label" htmlFor="watermark-kind">Watermark type</label>
                <select
                  id="watermark-kind"
                  className="select-field"
                  value={watermarkKind}
                  onChange={(event) => setWatermarkKind(event.target.value)}
                >
                  <option value="text">Text watermark</option>
                  <option value="logo">Logo watermark</option>
                </select>
              </div>

              {watermarkKind === "text" ? (
                <>
                  <div className="space-y-3">
                    <label className="field-label" htmlFor="watermark-text">Watermark text</label>
                    <input
                      id="watermark-text"
                      className="input-field"
                      type="text"
                      value={watermarkText}
                      onChange={(event) => setWatermarkText(event.target.value)}
                      placeholder="Your brand name"
                    />
                  </div>

                  <div className="tool-control-grid">
                    <div className="space-y-3">
                      <label className="field-label" htmlFor="watermark-text-color">Text color</label>
                      <input
                        id="watermark-text-color"
                        className="input-field h-12 p-2"
                        type="color"
                        value={textColor}
                        onChange={(event) => setTextColor(event.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="field-label" htmlFor="watermark-bg-color">Label color</label>
                      <input
                        id="watermark-bg-color"
                        className="input-field h-12 p-2"
                        type="color"
                        value={backgroundColor}
                        onChange={(event) => setBackgroundColor(event.target.value)}
                      />
                    </div>
                  </div>

                  <SliderField
                    label="Text size"
                    value={watermarkTextSize}
                    min={2}
                    max={12}
                    onChange={setWatermarkTextSize}
                    suffix="%"
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <label className="field-label" htmlFor="watermark-logo-upload">Watermark logo</label>
                  <input
                    id="watermark-logo-upload"
                    className="input-field file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-slate-100 dark:file:text-slate-900"
                    type="file"
                    accept="image/*"
                    onChange={handleWatermarkFileChange}
                  />
                  {watermarkPreview ? (
                    <div className="tool-preview min-h-[120px] p-3">
                      <img className="max-h-[90px] object-contain" src={watermarkPreview} alt="Watermark logo preview" />
                    </div>
                  ) : null}
                </div>
              )}

              <div className="space-y-3">
                <label className="field-label" htmlFor="watermark-position">Position</label>
                <select
                  id="watermark-position"
                  className="select-field"
                  value={watermarkPosition}
                  onChange={(event) => setWatermarkPosition(event.target.value)}
                >
                  {positionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <SliderField
                label="Opacity"
                value={Math.round(watermarkOpacity * 100)}
                min={5}
                max={100}
                onChange={(value) => setWatermarkOpacity(value / 100)}
                suffix="%"
              />
              <SliderField
                label="Watermark size"
                value={watermarkScale}
                min={5}
                max={60}
                onChange={setWatermarkScale}
                suffix="%"
              />
              <SliderField
                label="Padding"
                value={watermarkPadding}
                min={0}
                max={12}
                onChange={setWatermarkPadding}
                suffix="%"
              />
            </>
          ) : null}

          {mode === "blur" ? (
            <>
              <div className="space-y-3">
                <label className="field-label" htmlFor="blur-mode">Blur mode</label>
                <select
                  id="blur-mode"
                  className="select-field"
                  value={blurMode}
                  onChange={(event) => setBlurMode(event.target.value)}
                >
                  <option value="entire">Blur full image</option>
                  <option value="focus">Blur background, keep center clearer</option>
                </select>
              </div>

              <SliderField
                label="Blur strength"
                value={blurAmount}
                min={1}
                max={40}
                onChange={setBlurAmount}
                suffix="px"
              />

              {blurMode === "focus" ? (
                <>
                  <SliderField
                    label="Focus width"
                    value={focusWidth}
                    min={15}
                    max={95}
                    onChange={setFocusWidth}
                    suffix="%"
                  />
                  <SliderField
                    label="Focus height"
                    value={focusHeight}
                    min={15}
                    max={95}
                    onChange={setFocusHeight}
                    suffix="%"
                  />
                  <SliderField
                    label="Edge softness"
                    value={focusFeather}
                    min={0}
                    max={45}
                    onChange={setFocusFeather}
                    suffix="%"
                  />
                  <p className="field-help">Background blur keeps the center sharper. It is a guided spotlight effect, not AI subject detection.</p>
                </>
              ) : null}
            </>
          ) : null}

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={processImage} disabled={busy}>
              {busy ? "Processing..." : copy.action}
            </button>
            {mode === "transform" ? (
              <button className="btn-secondary" type="button" onClick={resetTransform}>
                Reset edits
              </button>
            ) : null}
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Original size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{file ? formatBytes(file.size) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Output size</p>
              <p className="mt-2 text-lg font-semibold text-strong">{result ? formatBytes(result.outputSize) : "Waiting"}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Output details</p>
              <p className="mt-2 text-sm font-semibold text-strong">{result ? `${result.width} x ${result.height}px` : "No processed image yet"}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Original</p>
              <div className="tool-preview mt-4">
                {sourcePreview ? (
                  <img className="max-h-[260px] rounded-lg object-contain" src={sourcePreview} alt="Original upload preview" />
                ) : (
                  <p className="text-sm text-muted">Upload an image to preview the original file.</p>
                )}
              </div>
            </div>

            <div className="surface-panel p-5">
              <p className="text-sm font-semibold text-strong">Edited</p>
              <div className="tool-preview mt-4">
                {result ? (
                  <img className="max-h-[260px] rounded-lg object-contain" src={result.previewUrl} alt="Edited preview" />
                ) : (
                  <p className="text-sm text-muted">Your edited preview appears here after processing.</p>
                )}
              </div>
            </div>
          </div>

          {result ? (
            <div className="surface-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-strong">{result.fileName || downloadName}</p>
                  <p className="mt-1 text-sm text-muted">{result.summary}</p>
                </div>
                <a className="btn-primary" href={result.previewUrl} download={result.fileName || downloadName}>
                  Download image
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SliderField({ label, value, min, max, onChange, suffix }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label className="field-label">{label}</label>
        <span className="text-sm font-semibold text-muted">{value}{suffix}</span>
      </div>
      <input
        className="w-full accent-brand-500"
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
