import { useEffect, useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { calculatePasswordStrength, generatePassword } from "../../utils/password.js";

const initialOptions = {
  length: 18,
  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: true
};

export default function PasswordTool() {
  const [options, setOptions] = useState(initialOptions);
  const [password, setPassword] = useState("");
  const { toast, showToast } = useToolToast();

  const strength = useMemo(() => calculatePasswordStrength(password, options), [password, options]);

  const refreshPassword = () => {
    try {
      setPassword(generatePassword(options));
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    refreshPassword();
  }, [options]);

  const toggleOption = (key) => {
    setOptions((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      showToast("Password copied to the clipboard.");
    } catch {
      showToast("Clipboard access was blocked.", "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Generate strong passwords fast</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Create unlimited passwords for email, hosting, admin panels, ecommerce accounts, and private dashboards with one click copy.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="field-label" htmlFor="password-length">Length</label>
              <span className="text-sm font-semibold text-muted">{options.length}</span>
            </div>
            <input
              id="password-length"
              className="w-full accent-brand-500"
              type="range"
              min="8"
              max="40"
              step="1"
              value={options.length}
              onChange={(event) => setOptions((current) => ({ ...current, length: Number(event.target.value) }))}
            />
          </div>

          <div className="grid gap-3">
            {[
              ["includeLowercase", "Lowercase letters"],
              ["includeUppercase", "Uppercase letters"],
              ["includeNumbers", "Numbers"],
              ["includeSymbols", "Symbols"]
            ].map(([key, label]) => (
              <label key={key} className="surface-panel flex items-center justify-between gap-4 p-4">
                <span className="text-sm font-medium text-strong">{label}</span>
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleOption(key)}
                />
              </label>
            ))}
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={refreshPassword}>Generate new password</button>
            <button className="btn-secondary" type="button" onClick={handleCopy}>Copy password</button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="surface-panel p-5">
            <p className="text-sm font-semibold text-strong">Generated password</p>
            <div className="value-box mt-4">
              <code className="break-all text-lg font-semibold text-strong">{password}</code>
            </div>
          </div>

          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Strength</p>
              <p className="mt-2 text-lg font-semibold text-strong">{strength.label}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Score</p>
              <p className="mt-2 text-lg font-semibold text-strong">{strength.score}/100</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Security Level</p>
              <p className="mt-2 text-lg font-semibold text-strong">{options.length >= 20 ? "High" : "Moderate"}</p>
            </div>
          </div>

          <div className="surface-panel p-5">
            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-3 rounded-full bg-[linear-gradient(135deg,#f59e0b,#0f8b8d)] transition-all"
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">
              Higher scores come from longer passwords and more varied character groups. Use a password manager whenever possible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
