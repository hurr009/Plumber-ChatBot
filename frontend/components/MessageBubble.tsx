"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  streaming?: boolean;
  provider?: "groq" | "openai";
}

const PROVIDER_META: Record<string, { label: string; color: string }> = {
  groq:   { label: "Groq · LLaMA 3.3", color: "text-orange-400" },
  openai: { label: "OpenAI · GPT-4o mini", color: "text-emerald-500" },
};

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-darker text-white shadow-md mt-0.5">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md mt-0.5">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      </svg>
    </div>
  );
}

// A single word that blurs in on mount
function BlurWord({ word, index }: { word: string; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <span
      style={{
        display: "inline",
        transition: "opacity 0.42s ease, filter 0.42s ease",
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0px)" : "blur(6px)",
        // small stagger based on position so rapid bursts still feel smooth
        transitionDelay: `${Math.min(index * 8, 80)}ms`,
      }}
    >
      {word}{" "}
    </span>
  );
}

// Renders streaming text as blur-in words + blinking caret
function StreamingBubble({ text }: { text: string }) {
  // Split on spaces but hold back the last "word" if it doesn't end with a space
  // (it may be a partial token still being assembled)
  const endsWithSpace = text.endsWith(" ") || text.endsWith("\n");
  const parts = text.split(/(\s+)/);

  // Build revealed words: everything except the trailing fragment when mid-word
  const words: string[] = [];
  let trailingFragment = "";

  if (endsWithSpace) {
    // All words are complete — reveal everything
    const tokens = text.trimEnd().split(/\s+/).filter(Boolean);
    words.push(...tokens);
  } else {
    // Hold back the last token as it may still be growing
    const tokens = text.split(/\s+/).filter(Boolean);
    words.push(...tokens.slice(0, -1));
    trailingFragment = tokens[tokens.length - 1] ?? "";
  }

  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {words.map((word, i) => (
        <BlurWord key={`${i}-${word}`} word={word} index={i} />
      ))}
      {trailingFragment && (
        <span style={{ opacity: 0.85 }}>{trailingFragment}</span>
      )}
      <span
        className="animate-blink"
        style={{
          display: "inline-block",
          width: "2px",
          height: "1em",
          background: "currentColor",
          marginLeft: "2px",
          verticalAlign: "text-bottom",
          borderRadius: "1px",
        }}
      />
    </span>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const providerMeta = !isUser && message.provider ? PROVIDER_META[message.provider] : null;

  return (
    <div className={`flex items-start gap-2.5 animate-fade-in ${isUser ? "flex-row-reverse animate-slide-in-right" : "animate-slide-in-left"}`}>
      {isUser ? <UserAvatar /> : <BotAvatar />}

      <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={[
            "break-words rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-brand text-white shadow-bubble"
              : "rounded-tl-sm bg-white text-slate-800 shadow-bubble ring-1 ring-slate-100",
          ].join(" ")}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.text}</span>
          ) : message.streaming ? (
            <StreamingBubble text={message.text} />
          ) : (
            <div className="prose-sm prose-slate max-w-none">
              <ReactMarkdown
                components={{
                  p:      ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  ul:     ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                  ol:     ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                  li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h1:     ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold text-slate-900 first:mt-0">{children}</h1>,
                  h2:     ({ children }) => <h2 className="mb-1.5 mt-3 text-sm font-bold text-slate-900 first:mt-0">{children}</h2>,
                  h3:     ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold text-slate-800 first:mt-0">{children}</h3>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                  code:   ({ children }) => (
                    <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-slate-200">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-brand/40 pl-3 italic text-slate-500">{children}</blockquote>
                  ),
                  hr: () => <hr className="my-2 border-slate-200" />,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {providerMeta && (
          <span className={`flex items-center gap-1 text-[10px] font-medium ${providerMeta.color}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {providerMeta.label}
          </span>
        )}
      </div>
    </div>
  );
}
