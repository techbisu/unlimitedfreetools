import { useEffect, useRef, useState } from "react";
import Toast from "./Toast.jsx";
import { useToolToast } from "./useToolToast.js";
import { downloadCanvas } from "../../utils/browser-media.js";

export default function FakeChatGeneratorTool() {
  const canvasRef = useRef(null);
  const [contactName, setContactName] = useState("Avery");
  const [selfName, setSelfName] = useState("You");
  const [draft, setDraft] = useState("We should turn this launch into a meme.");
  const [side, setSide] = useState("self");
  const [messages, setMessages] = useState([
    { id: 1, side: "other", text: "Quick update: the feature is live.", time: "09:12" },
    { id: 2, side: "self", text: "Nice. Give me 10 minutes and I’ll make it look intentional.", time: "09:13" }
  ]);
  const { toast, showToast } = useToolToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = Math.max(960, 220 + messages.length * 150);
    context.fillStyle = "#efeae2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0b141a";
    context.fillRect(0, 0, canvas.width, 118);
    context.fillStyle = "#ffffff";
    context.font = "700 40px Inter, sans-serif";
    context.fillText(contactName, 140, 70);
    context.font = "400 24px Inter, sans-serif";
    context.fillText("online", 140, 100);

    let y = 170;
    messages.forEach((message) => {
      const bubbleWidth = Math.min(700, 220 + message.text.length * 8);
      const x = message.side === "self" ? canvas.width - bubbleWidth - 60 : 60;
      context.fillStyle = message.side === "self" ? "#d9fdd3" : "#ffffff";
      context.fillRect(x, y, bubbleWidth, 96);
      context.fillStyle = "#111827";
      context.font = "500 28px Inter, sans-serif";
      context.fillText(message.text, x + 24, y + 42, bubbleWidth - 48);
      context.fillStyle = "#64748b";
      context.font = "400 20px Inter, sans-serif";
      context.fillText(message.time, x + bubbleWidth - 92, y + 74);
      y += 126;
    });
  }, [contactName, messages]);

  const addMessage = () => {
    if (!draft.trim()) {
      showToast("Type a message first.", "error");
      return;
    }

    setMessages((current) => current.concat({
      id: Date.now(),
      side,
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }));
    setDraft("");
  };

  return (
    <section className="surface-panel-strong p-5 sm:p-7">
      <div>
        <span className="eyebrow">Interactive Tool</span>
        <h2 className="mt-4 text-3xl font-semibold text-strong">Build a fake chat screenshot for jokes, mockups, and announcements</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Create a WhatsApp-style chat thread, customize names and messages, preview the conversation instantly, and export it as an image.
        </p>
      </div>

      <div className="mt-6 tool-shell">
        <div className="tool-sidebar">
          <div className="tool-control-grid">
            <div className="space-y-3">
              <label className="field-label" htmlFor="chat-contact">Contact name</label>
              <input id="chat-contact" className="input-field" value={contactName} onChange={(event) => setContactName(event.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="field-label" htmlFor="chat-self">Your label</label>
              <input id="chat-self" className="input-field" value={selfName} onChange={(event) => setSelfName(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="chat-message">New message</label>
            <textarea id="chat-message" className="textarea-field min-h-[120px]" value={draft} onChange={(event) => setDraft(event.target.value)} />
          </div>

          <div className="space-y-3">
            <label className="field-label" htmlFor="chat-side">Message side</label>
            <select id="chat-side" className="select-field" value={side} onChange={(event) => setSide(event.target.value)}>
              <option value="self">{selfName}</option>
              <option value="other">{contactName}</option>
            </select>
          </div>

          <div className="tool-actions">
            <button className="btn-primary" type="button" onClick={addMessage}>Add message</button>
            <button className="btn-secondary" type="button" onClick={() => downloadCanvas(canvasRef.current, "fake-chat.png")}>Download PNG</button>
          </div>

          <div className="surface-panel p-4">
            <p className="text-sm font-semibold text-strong">Messages</p>
            <div className="mt-3 space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="value-box">
                  <p className="text-sm font-semibold text-strong">{message.side === "self" ? selfName : contactName}</p>
                  <p className="mt-1 text-sm text-muted">{message.text}</p>
                </div>
              ))}
            </div>
          </div>

          <Toast message={toast.message} tone={toast.tone} />
        </div>

        <div className="tool-display">
          <div className="surface-panel p-5">
            <div className="tool-preview min-h-[320px] sm:min-h-[560px]">
              <canvas ref={canvasRef} className="max-h-[720px] rounded-[2rem] object-contain shadow-xl shadow-slate-900/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
