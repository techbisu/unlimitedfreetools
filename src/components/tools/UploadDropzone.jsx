import { useId, useRef, useState } from "react";

export default function UploadDropzone({
  label,
  help,
  accept = "image/*",
  fileName = "",
  cta = "Drop a file here or browse from your device",
  onFileSelect
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    await onFileSelect(file);
  };

  return (
    <div className="space-y-3">
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept={accept}
        onChange={async (event) => {
          await handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        className={`drop-zone w-full text-left ${dragging ? "is-dragging" : ""}`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setDragging(false);
          await handleFiles(event.dataTransfer.files);
        }}
      >
        <span className="text-sm font-semibold text-strong">{cta}</span>
        <span className="mt-2 text-sm leading-6 text-muted">
          {fileName ? `Selected: ${fileName}` : help}
        </span>
      </button>
      {fileName ? <p className="field-help">{help}</p> : null}
    </div>
  );
}
