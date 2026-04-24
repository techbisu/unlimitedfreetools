export default function Toast({ message, tone = "default" }) {
  if (!message) {
    return null;
  }

  const toneClasses =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${toneClasses}`}>
      {message}
    </div>
  );
}
