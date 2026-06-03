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
  text: `Hi! I'm ${BOT_NAME}. Ask me anything and I'll answer from our knowledge base.`,
};

export default function ChatWindow() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveIdState] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<"groq" | "openai">("groq");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations and active provider from backend on mount
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

    // Fetch active provider from backend as default
    fetchProviders()
      .then((r) => setActiveProvider(r.active))
      .catch(() => {}); // silently fall back to "groq"
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversations, activeId, loading, streamingText]);

  const activeConvo = conversations.find((c) => c.id === activeId);

  const displayMessages: ChatMessage[] = (() => {
    const base: ChatMessage[] = activeConvo ? [...activeConvo.messages] : [];
    if (streamingText !== null) {
      base.push({ role: "bot", text: streamingText, streaming: true, provider: activeProvider });
    }
    return [GREETING, ...base];
  })();

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

    setLoading(true);
    setStreamingText("");

    const historySnapshot = activeConvo?.history ?? [];
    const providerSnapshot = activeProvider;
    let botAnswer = "";

    try {
      await streamMessage(
        text,
        historySnapshot,
        (chunk) => {
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
          { role: "bot", text: "Sorry — something went wrong. Please try again." },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
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
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        <header className="flex items-center gap-3 bg-gradient-to-r from-brand to-brand-dark px-4 py-3 text-white shadow">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
            🔧
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">{BOT_NAME}</p>
            <p className="text-xs text-white/80">Online</p>
          </div>
          {/* Active provider badge in header */}
          <div className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/30 ${
            activeProvider === "openai" ? "text-emerald-300" : "text-orange-300"
          }`}>
            {activeProvider === "openai" ? "GPT-4o mini" : "LLaMA 3.3"}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {displayMessages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {loading && <TypingIndicator />}
        </div>

        <ChatInput onSend={handleSend} disabled={loading || streamingText !== null} />

        <p className="bg-white pb-2 text-center text-[10px] text-slate-400">
          Powered by {BOT_NAME}
        </p>
      </div>
    </div>
  );
}
