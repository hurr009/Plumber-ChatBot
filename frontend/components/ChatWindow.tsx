"use client";

import { useEffect, useRef, useState } from "react";
import {
  streamMessage,
  loadHistory,
  saveHistory,
  clearHistory,
  type HistoryMessage,
} from "@/lib/api";
import MessageBubble, { ChatMessage } from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME ?? "Plumber Bot";

const GREETING: ChatMessage = {
  role: "bot",
  text: `Hi! I'm ${BOT_NAME}. Ask me anything and I'll answer from our knowledge base.`,
};

function historyToMessages(history: HistoryMessage[]): ChatMessage[] {
  return history.map((m) => ({
    role: m.role === "user" ? "user" : "bot",
    text: m.content,
  }));
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const historyRef = useRef<HistoryMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingChunks = useRef<string>("");
  const rafId = useRef<number | null>(null);

  // Restore history from localStorage on first mount
  useEffect(() => {
    const saved = loadHistory();
    if (saved.length > 0) {
      historyRef.current = saved;
      setMessages([GREETING, ...historyToMessages(saved)]);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text: string) {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    pendingChunks.current = "";

    // snapshot history before this turn to send to backend
    const historySnapshot = [...historyRef.current];

    function flush() {
      rafId.current = null;
      const text = pendingChunks.current;
      if (!text) return;
      pendingChunks.current = "";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "bot") {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "bot", text: last.text + text, streaming: true };
          return updated;
        }
        return [...prev, { role: "bot", text, streaming: true }];
      });
    }

    let botAnswer = "";

    try {
      await streamMessage(
        text,
        historySnapshot,
        (chunk) => {
          setLoading(false);
          botAnswer += chunk;
          pendingChunks.current += chunk;
          if (rafId.current === null) {
            rafId.current = requestAnimationFrame(flush);
          }
        },
        () => {},
      );
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      flush();
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "bot") updated[updated.length - 1] = { ...last, streaming: false };
        return updated;
      });

      // persist this turn to localStorage
      const newHistory: HistoryMessage[] = [
        ...historySnapshot,
        { role: "user", content: text },
        { role: "assistant", content: botAnswer },
      ];
      historyRef.current = newHistory;
      saveHistory(newHistory);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry — something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    clearHistory();
    historyRef.current = [];
    setMessages([GREETING]);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 bg-gradient-to-r from-brand to-brand-dark px-4 py-3 text-white shadow">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
          🔧
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">{BOT_NAME}</p>
          <p className="text-xs text-white/80">Online</p>
        </div>
        {historyRef.current.length > 0 && (
          <button
            onClick={handleClear}
            className="rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            title="Clear chat history"
          >
            Clear
          </button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {loading && <TypingIndicator />}
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />

      <p className="bg-white pb-2 text-center text-[10px] text-slate-400">
        Powered by {BOT_NAME}
      </p>
    </div>
  );
}
