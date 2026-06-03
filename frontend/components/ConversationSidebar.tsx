"use client";

import { type Conversation } from "@/lib/conversations";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  activeProvider: "groq" | "openai";
  onProviderChange: (p: "groq" | "openai") => void;
}

const PROVIDERS: { id: "groq" | "openai"; label: string; sub: string; dot: string }[] = [
  { id: "groq",   label: "Groq",   sub: "LLaMA 3.3 · 70B",  dot: "bg-orange-400" },
  { id: "openai", label: "OpenAI", sub: "GPT-4o mini",       dot: "bg-emerald-400" },
];

function PipeWrenchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-40">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, activeProvider, onProviderChange,
}: Props) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full w-60 flex-shrink-0 flex-col bg-brand-darker">

      {/* Logo / brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-copper text-white shadow-md">
          <PipeWrenchIcon />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight leading-tight">Plumber Bot</p>
          <p className="text-[10px] text-blue-300 leading-tight">AI Support Assistant</p>
        </div>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 transition-all duration-150"
        >
          <PlusIcon />
          New conversation
        </button>
      </div>

      {/* Section label */}
      <p className="mt-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
        Recent
      </p>

      {/* Conversation list */}
      <div className="mt-1 flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {sorted.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-500">No conversations yet</p>
        )}
        {sorted.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={[
              "group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150",
              c.id === activeId
                ? "bg-white/15 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
            ].join(" ")}
          >
            <ChatBubbleIcon />
            <span className="flex-1 truncate text-xs leading-snug">{c.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="invisible group-hover:visible shrink-0 rounded-md p-1 text-slate-500 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      {/* LLM provider switcher */}
      <div className="border-t border-white/10 px-3 py-3">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
          AI Model
        </p>
        <div className="flex flex-col gap-1">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => onProviderChange(p.id)}
              className={[
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all duration-150",
                activeProvider === p.id
                  ? "bg-white/15 ring-1 ring-white/20 text-white"
                  : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
              ].join(" ")}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${p.dot} ${activeProvider === p.id ? "shadow-[0_0_6px_2px] shadow-current" : "opacity-50"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight truncate">{p.label}</p>
                <p className="text-[10px] text-slate-500 leading-tight truncate">{p.sub}</p>
              </div>
              {activeProvider === p.id && (
                <span className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/80">
                  ON
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
