import { useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { copyText, downloadTextFile, shareTextResult } from "../../utils/browser-media.js";
import { generateFancyVariants } from "../../utils/fancy-text.js";

export default function FancyTextGenerator() {
  const [value, setValue] = useState("Make my bio impossible to ignore");
  const { toast, showToast } = useToolToast(2600);
  const variants = useMemo(() => generateFancyVariants(value), [value]);

  const downloadAll = () => {
    const payload = variants.map((variant) => `${variant.label}\n${variant.text}`).join("\n\n");
    downloadTextFile(payload, "fancy-text-styles.txt");
    showToast("All text styles downloaded as a text file.");
  };

  const copyVariant = async (text) => {
    try {
      await copyText(text);
      showToast("Fancy text copied to the clipboard.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const shareVariant = async (variant) => {
    try {
      const mode = await shareTextResult(variant.text, {
        title: `${variant.label} style`,
        shareText: `${variant.label}: ${variant.text}`
      });
      showToast(mode === "copied-text" ? "Styled text copied for sharing." : "Share sheet opened.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Generate social-ready fancy text instantly</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Type once and copy stylized Unicode versions for bios, usernames, captions, memes, Discord servers, and viral posts without installing any font pack.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="surface-panel p-5">
          <div className="space-y-3">
            <label className="field-label" htmlFor="fancy-text-input">Your text</label>
            <textarea
              id="fancy-text-input"
              className="textarea-field min-h-[220px]"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Type a caption, nickname, or headline"
            />
            <p className="field-help">Unicode styles work in many apps, but some platforms may normalize certain characters.</p>
          </div>

          <div className="tool-actions mt-5">
            <button className="btn-primary" type="button" onClick={() => copyText(variants[0].text).then(() => showToast("Top style copied to the clipboard.")).catch((error) => showToast(error.message, "error"))}>
              Copy top style
            </button>
            <button className="btn-secondary" type="button" onClick={downloadAll}>
              Download TXT
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="space-y-4">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Styles</p>
              <p className="mt-2 text-lg font-semibold text-strong">{variants.length} outputs</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Characters</p>
              <p className="mt-2 text-lg font-semibold text-strong">{value.length}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Use case</p>
              <p className="mt-2 text-lg font-semibold text-strong">Bios, posts, memes</p>
            </div>
          </div>

          <div className="grid gap-4">
            {variants.map((variant) => (
              <article key={variant.id} className="surface-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-strong">{variant.label}</p>
                    <p className="mt-3 break-words text-xl leading-9 text-muted">{variant.text}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-ghost" type="button" onClick={() => copyVariant(variant.text)}>
                      Copy
                    </button>
                    <button className="btn-ghost" type="button" onClick={() => shareVariant(variant)}>
                      Share
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
