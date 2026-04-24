import { useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { convertValue, unitDefinitions } from "../../utils/convert.js";

export default function UnitTool() {
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("foot");
  const [value, setValue] = useState("1");
  const { toast, showToast } = useToolToast();

  const units = unitDefinitions[category].units;
  const converted = useMemo(() => convertValue(category, fromUnit, toUnit, value), [category, fromUnit, toUnit, value]);

  const handleCategoryChange = (nextCategory) => {
    const unitKeys = Object.keys(unitDefinitions[nextCategory].units);
    setCategory(nextCategory);
    setFromUnit(unitKeys[0]);
    setToUnit(unitKeys[1]);
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(converted);
      showToast("Converted value copied.");
    } catch {
      showToast("Clipboard access was blocked.", "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Convert common units instantly</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Switch between length, weight, and temperature values with a clean converter built for quick everyday calculations.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor="unit-category">Category</label>
            <select id="unit-category" className="select-field" value={category} onChange={(event) => handleCategoryChange(event.target.value)}>
              {Object.entries(unitDefinitions).map(([key, definition]) => (
                <option key={key} value={key}>
                  {definition.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="unit-value">Value</label>
            <input id="unit-value" className="input-field" type="number" value={value} onChange={(event) => setValue(event.target.value)} />
          </div>

          <div className="tool-control-grid">
            <div className="space-y-3">
              <label className="field-label" htmlFor="unit-from">From</label>
              <select id="unit-from" className="select-field" value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>
                {Object.entries(units).map(([key, definition]) => (
                  <option key={key} value={key}>
                    {definition.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="field-label" htmlFor="unit-to">To</label>
              <select id="unit-to" className="select-field" value={toUnit} onChange={(event) => setToUnit(event.target.value)}>
                {Object.entries(units).map(([key, definition]) => (
                  <option key={key} value={key}>
                    {definition.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={handleSwap}>Swap units</button>
            <button className="btn-secondary" type="button" onClick={handleCopy}>Copy result</button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="surface-panel p-5">
            <p className="text-sm font-semibold text-strong">Converted output</p>
            <div className="value-box mt-4 p-5">
              <p className="break-words text-3xl font-semibold text-strong sm:text-4xl">{converted || "Enter a value"}</p>
              <p className="mt-3 text-sm text-muted">
                {units[toUnit]?.label}
              </p>
            </div>
          </div>

          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Category</p>
              <p className="mt-2 text-lg font-semibold text-strong">{unitDefinitions[category].label}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">From</p>
              <p className="mt-2 text-lg font-semibold text-strong">{units[fromUnit]?.label}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">To</p>
              <p className="mt-2 text-lg font-semibold text-strong">{units[toUnit]?.label}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
