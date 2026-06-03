"use client";

import { useState, useRef, useEffect } from "react";

function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className={[
        "flex items-end gap-3 rounded-2xl border bg-white px-4 py-3 transition-all duration-150",
        disabled ? "border-slate-200 opacity-70" : "border-slate-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
      ].join(" ")}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          placeholder={disabled ? "Generating response…" : "Ask me anything about plumbing…"}
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed leading-relaxed"
        />
        <button
          onClick={submit}
          disabled={!canSend}
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-150",
            canSend
              ? "bg-brand text-white shadow-md hover:bg-brand-dark hover:shadow-lg active:scale-95"
              : "bg-slate-100 text-slate-400 cursor-not-allowed",
          ].join(" ")}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-400">
        Press <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">Enter</kbd> to send · <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
