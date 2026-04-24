import { useMemo, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { extractYoutubeVideoId, getYoutubeThumbnailOptions } from "../../utils/youtube.js";

export default function YTTool() {
  const [input, setInput] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [hiddenVariants, setHiddenVariants] = useState({});
  const { toast, showToast } = useToolToast(3200);

  const thumbnails = useMemo(
    () => getYoutubeThumbnailOptions(videoId).filter((item) => !hiddenVariants[item.key]),
    [videoId, hiddenVariants]
  );

  const handleExtract = () => {
    try {
      const nextId = extractYoutubeVideoId(input);
      setVideoId(nextId);
      setHiddenVariants({});
      showToast("Thumbnail images loaded.");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Thumbnail URL copied.");
    } catch {
      showToast("Clipboard access was blocked.", "error");
    }
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Extract YouTube thumbnails instantly</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Paste a YouTube URL, extract the video ID, preview available thumbnail sizes, and download the image you need. This tool handles thumbnails only.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="space-y-3">
            <label className="field-label" htmlFor="yt-url">YouTube URL</label>
            <textarea
              id="yt-url"
              className="textarea-field min-h-[140px]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={handleExtract}>Extract thumbnails</button>
          </div>

          <div className="surface-panel p-4">
            <p className="text-sm font-semibold text-strong">Video ID</p>
            <div className="value-box mt-4">
              <code className="break-all text-lg font-semibold text-strong">{videoId || "Waiting"}</code>
            </div>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="tool-stat-grid">
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Supported variants</p>
              <p className="mt-2 text-lg font-semibold text-strong">{thumbnails.length}</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Input type</p>
              <p className="mt-2 text-lg font-semibold text-strong">URL or ID</p>
            </div>
            <div className="tool-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">Scope</p>
              <p className="mt-2 text-lg font-semibold text-strong">Thumbnail images only</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {thumbnails.map((item) => (
              <div key={item.key} className="surface-panel p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-strong">{item.label}</p>
                  <button className="btn-ghost" type="button" onClick={() => handleCopy(item.url)}>Copy URL</button>
                </div>
                <div className="tool-preview mt-4">
                  <img
                    className="max-h-[220px] w-full rounded-lg object-cover"
                    src={item.url}
                    alt={`${item.label} preview`}
                    referrerPolicy="no-referrer"
                    onError={() => setHiddenVariants((current) => ({ ...current, [item.key]: true }))}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a className="btn-primary" href={item.url} download={`${videoId}-${item.key}.jpg`} target="_blank" rel="noreferrer">
                    Download image
                  </a>
                </div>
              </div>
            ))}
          </div>

          {!thumbnails.length ? (
            <div className="surface-panel p-5">
              <p className="text-sm text-muted">No thumbnail variants were available for this video. Try another YouTube link.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
