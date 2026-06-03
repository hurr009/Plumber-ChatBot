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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Moon, Sun, Wrench } from "lucide-react";
import MessageBubble, { ChatMessage } from "./MessageBubble";
import ConversationSidebar from "./ConversationSidebar";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME ?? "Plumber Bot";

const GREETING: ChatMessage = {
  role: "bot",
  text: `Hi there! I'm **${BOT_NAME}**, your AI-powered plumbing assistant.\n\nI can help you with:\n- Troubleshooting leaks, blockages, and pressure issues\n- Step-by-step repair guidance\n- Maintenance tips and best practices\n- Product and parts recommendations\n\nWhat can I help you with today?`,
};

const SUGGESTIONS = [
  "How do I fix a leaky faucet?",
  "Why is my water pressure low?",
  "How to unclog a drain?",
  "What causes pipe noises?",
];

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-darker text-white shadow-card dark:bg-brand-dark">
        <Wrench className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Start a conversation</p>
        <p className="text-sm text-muted-foreground">Ask me anything about plumbing</p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {SUGGESTIONS.map((q) => (
          <Button
            key={q}
            variant="outline"
            size="sm"
            onClick={() => onSuggest(q)}
            className="h-auto whitespace-normal rounded-xl py-2 text-left text-xs leading-snug text-muted-foreground hover:text-primary hover:border-primary/40"
          >
            {q}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveIdState] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<"groq" | "openai">("groq");
  const [darkMode, setDarkMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const storedDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(storedDark);
    document.documentElement.classList.toggle("dark", storedDark);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  function handleSelectConvo(id: string) { setActiveIdState(id); setActiveId(id); }

  function handleNewConvo() {
    const fresh = createConversation();
    setConversations((prev) => { const u = [fresh, ...prev]; saveConversations(u); return u; });
    setActiveIdState(fresh.id);
    setActiveId(fresh.id);
  }

  function handleDeleteConvo(id: string) {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);
      if (id === activeId) {
        const next = updated[0] ?? createConversation();
        if (updated.length === 0) { saveConversations([next]); setConversations([next]); }
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
    setStreamingText(null);

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
          { role: "bot", text: "Sorry — something went wrong. Please try again.", streaming: false },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  const providerLabel = activeProvider === "openai" ? "GPT-4o mini" : "LLaMA 3.3";
  const providerDotClass = activeProvider === "openai" ? "bg-emerald-400" : "bg-orange-400";

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
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
        <header className="flex items-center gap-3 border-b border-border bg-background px-5 py-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-darker text-white shadow-md dark:bg-brand-dark">
            <Wrench className="h-[17px] w-[17px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight text-foreground">{BOT_NAME}</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse2" />
              <p className="text-xs text-muted-foreground leading-tight">Online · AI-powered support</p>
            </div>
          </div>

          {/* Active model badge */}
          <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full ${providerDotClass}`} />
            {providerLabel}
          </Badge>

          {/* Dark mode toggle */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-8 w-8 rounded-lg"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {darkMode ? "Switch to light mode" : "Switch to dark mode"}
            </TooltipContent>
          </Tooltip>
        </header>

        {/* Messages */}
        <div className="chat-bg flex-1 overflow-y-auto" ref={scrollRef}>
          {isEmpty ? (
            <EmptyState onSuggest={handleSend} />
          ) : (
            <div className="space-y-4 p-5">
              {displayMessages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {loading && !streamingText && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={loading || streamingText !== null} />
      </div>
    </div>
  );
}
