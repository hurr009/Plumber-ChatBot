"use client";

import { useEffect, useRef, useState } from "react";
import { streamMessage, fetchProviders } from "@/lib/api";
import {
  loadConversations,
  saveConversations,
  getActiveId,
  setActiveId,
  createConversation,
  titleFromMessage,
  type Conversation,
} from "@/lib/conversations";
import MessageBubble, { ChatMessage } from "./MessageBubble";
import ConversationSidebar from "./ConversationSidebar";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME ?? "Plumber Bot";

const GREETING: ChatMessage = {
  role: "bot",
  text: `Hi there! I'm **${BOT_NAME}**, your AI-powered plumbing assistant.\n\nI can help you with:\n- Troubleshooting leaks, blockages, and pressure issues\n- Step-by-step repair guidance\n- Maintenance tips and best practices\n- Product and parts recommendations\n\nWhat can I help you with today?`,
};

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  const suggestions = [
    "How do I fix a leaky faucet?",
    "Why is my water pressure low?",
    "How to unclog a drain?",
    "What causes pipe noises?",
  ];
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-darker text-white shadow-card dark:bg-brand-dark">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Start a conversation</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Ask me anything about plumbing</p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-2">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition-colors text-left leading-snug dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveIdState] = useState<string>("");
  // loading = waiting for first token (shows TypingIndicator)
  // streamingText !== null = first token received, show streaming bubble
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<"groq" | "openai">("groq");
  const [darkMode, setDarkMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadConversations();
    const savedActiveId = getActiveId();
    if (saved.length === 0) {
      const fresh = createConversation();
      setConversations([fresh]);
      setActiveIdState(fresh.id);
      setActiveId(fresh.id);
    } else {
      setConversations(saved);
      const active = savedActiveId && saved.find((c) => c.id === savedActiveId)
        ? savedActiveId
        : saved[0].id;
      setActiveIdState(active);
      setActiveId(active);
    }

    fetchProviders()
      .then((r) => setActiveProvider(r.active))
      .catch(() => {});

    // Restore dark mode preference
    const storedDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(storedDark);
    document.documentElement.classList.toggle("dark", storedDark);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversations, activeId, loading, streamingText]);

  function toggleDarkMode() {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("darkMode", String(next));
      return next;
    });
  }

  const activeConvo = conversations.find((c) => c.id === activeId);

  const displayMessages: ChatMessage[] = (() => {
    const base: ChatMessage[] = activeConvo ? [...activeConvo.messages] : [];
    // Only push the streaming bubble once we have content — prevents double-box
    if (streamingText !== null) {
      base.push({ role: "bot", text: streamingText, streaming: true, provider: activeProvider });
    }
    return [GREETING, ...base];
  })();

  const isEmpty = displayMessages.length === 1;

  function updateConvo(id: string, updater: (c: Conversation) => Conversation) {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? updater(c) : c));
      saveConversations(updated);
      return updated;
    });
  }

  function handleSelectConvo(id: string) {
    setActiveIdState(id);
    setActiveId(id);
  }

  function handleNewConvo() {
    const fresh = createConversation();
    setConversations((prev) => {
      const updated = [fresh, ...prev];
      saveConversations(updated);
      return updated;
    });
    setActiveIdState(fresh.id);
    setActiveId(fresh.id);
  }

  function handleDeleteConvo(id: string) {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);
      if (id === activeId) {
        const next = updated[0] ?? createConversation();
        if (updated.length === 0) {
          saveConversations([next]);
          setConversations([next]);
        }
        setActiveIdState(next.id);
        setActiveId(next.id);
      }
      return updated.length > 0 ? updated : conversations.filter((c) => c.id !== id);
    });
  }

  async function handleSend(text: string) {
    if (!activeId) return;

    updateConvo(activeId, (c) => ({
      ...c,
      title: c.history.length === 0 ? titleFromMessage(text) : c.title,
      messages: [...c.messages, { role: "user", text }],
      updatedAt: Date.now(),
    }));

    // Start in loading state — TypingIndicator shows, no streaming bubble yet
    setLoading(true);
    setStreamingText(null);

    const historySnapshot = activeConvo?.history ?? [];
    const providerSnapshot = activeProvider;
    let botAnswer = "";

    try {
      await streamMessage(
        text,
        historySnapshot,
        (chunk) => {
          // First chunk: hide TypingIndicator, show streaming bubble
          setLoading(false);
          botAnswer += chunk;
          setStreamingText((prev) => (prev ?? "") + chunk);
        },
        () => {},
        providerSnapshot,
      );

      setStreamingText(null);
      updateConvo(activeId, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          { role: "bot", text: botAnswer, streaming: false, provider: providerSnapshot },
        ],
        history: [
          ...historySnapshot,
          { role: "user", content: text },
          { role: "assistant", content: botAnswer },
        ],
        updatedAt: Date.now(),
      }));
    } catch {
      setStreamingText(null);
      updateConvo(activeId, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          { role: "bot", text: "Sorry — something went wrong. Please try again.", streaming: false },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  const providerLabel = activeProvider === "openai" ? "GPT-4o mini" : "LLaMA 3.3";

  return (
    <div className="flex h-full w-full overflow-hidden dark:bg-slate-900">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConvo}
        onNew={handleNewConvo}
        onDelete={handleDeleteConvo}
        activeProvider={activeProvider}
        onProviderChange={setActiveProvider}
      />

      {/* Chat panel */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-3 bg-white border-b border-slate-200 px-5 py-3.5 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-darker text-white shadow-md dark:bg-brand-dark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight dark:text-white">{BOT_NAME}</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse2" />
              <p className="text-xs text-slate-500 leading-tight dark:text-slate-400">Online · AI-powered support</p>
            </div>
          </div>

          {/* Active model pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
            <span className={`h-1.5 w-1.5 rounded-full ${activeProvider === "openai" ? "bg-emerald-400" : "bg-orange-400"}`} />
            {providerLabel}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="chat-bg flex-1 overflow-y-auto dark:bg-slate-950 dark:bg-none">
          {isEmpty ? (
            <EmptyState onSuggest={handleSend} />
          ) : (
            <div className="space-y-4 p-5">
              {displayMessages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {/* TypingIndicator shows only while waiting for first token */}
              {loading && !streamingText && <TypingIndicator />}
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={loading || streamingText !== null} />
      </div>
    </div>
  );
}
