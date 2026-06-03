"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { streamMessage, fetchProviders } from "@/lib/api";
import {
  loadConversations, saveConversations, getActiveId, setActiveId,
  createConversation, titleFromMessage, type Conversation,
} from "@/lib/conversations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, SendHorizonal, RotateCcw, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME ?? "Plumber Bot";

interface Message {
  role: "user" | "bot";
  text: string;
  streaming?: boolean;
}

const GREETING: Message = {
  role: "bot",
  text: "Hi! I'm your plumbing assistant. Ask me anything — leaks, clogs, pressure issues, repairs.",
};

function BlurWord({ word, index }: { word: string; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <span
      className="inline transition-[opacity,filter] duration-[420ms] ease-in-out"
      style={{ opacity: visible ? 1 : 0, filter: visible ? "blur(0px)" : "blur(6px)", transitionDelay: `${Math.min(index * 8, 80)}ms` }}
    >
      {word}{" "}
    </span>
  );
}

function StreamingText({ text }: { text: string }) {
  const endsWithSpace = text.endsWith(" ") || text.endsWith("\n");
  const words: string[] = [];
  let trailing = "";
  if (endsWithSpace) {
    words.push(...text.trimEnd().split(/\s+/).filter(Boolean));
  } else {
    const tokens = text.split(/\s+/).filter(Boolean);
    words.push(...tokens.slice(0, -1));
    trailing = tokens[tokens.length - 1] ?? "";
  }
  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {words.map((w, i) => <BlurWord key={`${i}-${w}`} word={w} index={i} />)}
      {trailing && <span className="opacity-85">{trailing}</span>}
      <span aria-hidden className="animate-blink inline-block w-[2px] h-[1em] bg-current ml-[2px] align-text-bottom rounded-[1px]" />
    </span>
  );
}

export default function WidgetChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [provider, setProvider] = useState<"groq" | "openai">("groq");
  const [isEmbedded, setIsEmbedded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchProviders().then((r) => setProvider(r.active)).catch(() => {});
    setIsEmbedded(new URLSearchParams(window.location.search).get("embedded") === "1");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [input]);

  const displayMessages = streamingText !== null
    ? [...messages, { role: "bot" as const, text: streamingText, streaming: true }]
    : messages;

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    setStreamingText(null);

    const historySnap = history;
    let answer = "";

    try {
      await streamMessage(text, historySnap, (chunk) => {
        setLoading(false);
        answer += chunk;
        setStreamingText((prev) => (prev ?? "") + chunk);
      }, () => {}, provider);

      setStreamingText(null);
      setMessages((prev) => [...prev, { role: "bot", text: answer }]);
      setHistory((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: answer }]);
    } catch {
      setStreamingText(null);
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry — something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([GREETING]);
    setHistory([]);
    setStreamingText(null);
    setLoading(false);
  }

  const providerLabel = provider === "openai" ? "GPT-4o mini" : "LLaMA 3.3";
  const providerDot = provider === "openai" ? "bg-emerald-400" : "bg-orange-400";

  return (
    <div className="flex h-full flex-col bg-background text-foreground">

      {/* Header — hidden when embedded (widget.js draws its own header outside the iframe) */}
      <div className={cn("flex items-center gap-2.5 border-b border-border bg-brand-darker px-4 py-3 shrink-0", isEmbedded && "hidden")}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-copper text-white shadow-sm">
          <Wrench className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight text-white">{BOT_NAME}</p>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <p className="text-[10px] text-blue-300 leading-tight">Online</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white hover:bg-white/10"
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", providerDot)} />
          {providerLabel}
        </Badge>
        <button
          onClick={handleReset}
          className="flex h-6 w-6 items-center justify-center rounded-md text-blue-300 transition-colors hover:bg-white/10 hover:text-white"
          title="Reset conversation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {displayMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "bot" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-darker text-white shadow-sm mr-2 mt-0.5">
                <Wrench className="h-3 w-3" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-bubble",
              m.role === "user"
                ? "rounded-tr-sm bg-primary text-primary-foreground"
                : "rounded-tl-sm bg-card text-card-foreground ring-1 ring-border",
            )}>
              {m.streaming ? (
                <StreamingText text={m.text} />
              ) : m.role === "bot" ? (
                <div className="prose prose-xs prose-slate max-w-none dark:prose-invert [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal [&_li]:mb-0.5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-[10px]">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{m.text}</span>
              )}
            </div>
          </div>
        ))}

        {loading && !streamingText && (
          <div className="flex items-start gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-darker text-white shadow-sm">
              <Wrench className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-card px-3 py-2.5 ring-1 ring-border">
              <span className="h-1.5 w-1.5 animate-bounce2 rounded-full bg-muted-foreground/50 [animation-delay:-0.32s]" />
              <span className="h-1.5 w-1.5 animate-bounce2 rounded-full bg-muted-foreground/50 [animation-delay:-0.16s]" />
              <span className="h-1.5 w-1.5 animate-bounce2 rounded-full bg-muted-foreground/50" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-background p-2.5">
        <div className={cn(
          "flex items-end gap-2 rounded-xl border bg-background px-3 py-2 transition-all",
          loading ? "opacity-70 border-input" : "border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        )}>
          <Textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={loading}
            placeholder="Ask about plumbing…"
            className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-xs shadow-none outline-none focus-visible:ring-0 disabled:cursor-not-allowed leading-relaxed"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-7 w-7 shrink-0 rounded-lg"
          >
            <SendHorizonal className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[9px] text-muted-foreground">
          Powered by {provider === "openai" ? <><Sparkles className="inline h-2.5 w-2.5" /> OpenAI</> : <><Zap className="inline h-2.5 w-2.5" /> Groq</>}
        </p>
      </div>
    </div>
  );
}
