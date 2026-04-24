import { useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { copyText, downloadTextFile, shareTextResult } from "../../utils/browser-media.js";

const openers = [
  "This bio reads like",
  "Somehow this sounds like",
  "Respectfully, this feels like",
  "Your profile is giving"
];
const closers = [
  "but with better lighting.",
  "and a suspicious amount of self-confidence.",
  "after one productivity podcast too many.",
  "trying extremely hard to look effortless."
];
const cores = [
  "a startup pitch trapped inside a dating app",
  "LinkedIn discovering caffeine for the first time",
  "a motivational quote wearing sneakers indoors",
  "someone who says 'building in public' before breakfast",
  "a side hustle introducing itself at a wedding"
];

function buildRoasts(bio) {
  const seed = bio.trim() || "mysterious internet main character";
  return Array.from({ length: 6 }, (_, index) => `${openers[index % openers.length]} ${cores[(seed.length + index) % cores.length]}, ${closers[(seed.length * 2 + index) % closers.length]} "${seed.slice(0, 42)}${seed.length > 42 ? "..." : ""}"`);
}

export default function RoastMyBioTool() {
  const [bio, setBio] = useState("Digital nomad | building 7 projects | sharing hot takes and matcha reviews");
  const [shuffleKey, setShuffleKey] = useState(0);
  const { toast, showToast } = useToolToast();
  const roasts = useMemo(() => buildRoasts(`${bio}-${shuffleKey}`), [bio, shuffleKey]);

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Entertainment Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Turn an over-serious bio into a shareable roast in seconds</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Paste your bio, generate multiple punchy roast variations, copy your favorite, and download the whole set as a text file.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm leading-7 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/40 dark:text-amber-100">
        For entertainment purposes only
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="surface-panel p-5">
          <div className="space-y-3">
            <label className="field-label" htmlFor="roast-bio">Bio text</label>
            <textarea id="roast-bio" className="textarea-field min-h-[220px]" value={bio} onChange={(event) => setBio(event.target.value)} />
          </div>

          <div className="tool-actions mt-5">
            <button className="btn-primary" type="button" onClick={() => setShuffleKey((value) => value + 1)}>Roast Again</button>
            <button className="btn-secondary" type="button" onClick={() => {
              downloadTextFile(roasts.join("\n\n"), "roast-my-bio.txt");
              showToast("Roast pack downloaded.");
            }}>
              Download TXT
            </button>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="grid gap-4">
          {roasts.map((roast, index) => (
            <article key={`${roast}-${index}`} className="surface-panel p-5">
              <p className="text-lg leading-8 text-strong">{roast}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-ghost" type="button" onClick={() => copyText(roast).then(() => showToast("Roast copied.")).catch((error) => showToast(error.message, "error"))}>Copy</button>
                <button className="btn-ghost" type="button" onClick={() => shareTextResult(roast, { title: "Roast My Bio", shareText: roast }).then(() => showToast("Roast ready to share.")).catch((error) => showToast(error.message, "error"))}>Share</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
