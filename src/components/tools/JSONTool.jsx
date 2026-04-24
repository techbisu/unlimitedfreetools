import { useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { formatJSON, minifyJSON, validateJSON } from "../../utils/json.js";

const starterJSON = `{
  "name": "Sample Product",
  "slug": "sample-product",
  "price": 29.99,
  "inStock": true
}`;

export default function JSONTool() {
  const [input, setInput] = useState(starterJSON);
  const [output, setOutput] = useState(formatJSON(starterJSON));
  const { toast, showToast } = useToolToast();
  const validation = useMemo(() => validateJSON(input), [input]);

  const handleFormat = () => {
    try {
      setOutput(formatJSON(input));
      showToast("JSON formatted.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleMinify = () => {
    try {
      setOutput(minifyJSON(input));
      showToast("JSON minified.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      showToast("Output copied to the clipboard.");
    } catch {
      showToast("Clipboard access was blocked.", "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Paste raw JSON and clean it instantly</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Format JSON, validate syntax, minify payloads, and copy clean output in a single fast workflow.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor="json-input">JSON input</label>
            <textarea
              id="json-input"
              className="textarea-field min-h-[320px]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={handleFormat}>Pretty format</button>
            <button className="btn-secondary" type="button" onClick={handleMinify}>Minify</button>
            <button className="btn-secondary" type="button" onClick={() => setInput("")}>Clear</button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Validation</p>
              <p className="mt-2 text-lg font-semibold text-strong">{validation.valid ? "Valid" : "Invalid"}</p>
            </div>
            <div className="tool-stat sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Parser message</p>
              <p className="mt-2 text-sm font-medium text-strong">{validation.message}</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-strong">Formatted output</p>
              <button className="btn-secondary" type="button" onClick={handleCopy}>Copy output</button>
            </div>
            <textarea className="textarea-field mt-4 min-h-[320px] font-mono text-xs" readOnly value={output} />
          </div>
        </div>
      </div>
    </section>
  );
}
