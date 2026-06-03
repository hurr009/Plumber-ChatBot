"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { streamMessage, fetchProviders } from "@/lib/api";
import {
  loadConversations, saveConversations, getActiveId, setActiveId,
  createConversation, titleFromMessage, type Conversation,
} from "@/lib/conversations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wrench, Plus, Trash2, MessageSquare,
  Home, Zap, Sparkles, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MessageBubble, { ChatMessage } from "./MessageBubble";
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

const PROVIDERS: { id: "groq" | "openai"; label: string; sub: string; dot: string; Icon: React.ElementType }[] = [
  { id: "groq",   label: "Groq",   sub: "LLaMA 3.3 · 70B", dot: "bg-orange-400",  Icon: Zap },
  { id: "openai", label: "OpenAI", sub: "GPT-4o mini",      dot: "bg-emerald-400", Icon: Sparkles },
];

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-darker text-white shadow-card">
        <Wrench className="h-7 w-7" />
      </div>
      <div>
        <p className="text-base font-semibold">Start a conversation</p>
        <p className="mt-1 text-sm text-muted-foreground">Ask me anything about plumbing</p>
      </div>
      <div className="grid w-full max-w-xs grid-cols-2 gap-2">
        {SUGGESTIONS.map((q) => (
          <Button
            key={q}
            variant="outline"
            size="sm"
            onClick={() => onSuggest(q)}
            className="h-auto whitespace-normal rounded-xl py-2 text-left text-xs leading-snug text-muted-foreground hover:border-primary/40 hover:text-primary"
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
  const [showProviderPanel, setShowProviderPanel] = useState(false);
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
        ? savedActiveId : saved[0].id;
      setActiveIdState(active);
      setActiveId(active);
    }
    fetchProviders().then((r) => setActiveProvider(r.active)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeId, loading, streamingText]);

  const activeConvo = conversations.find((c) => c.id === activeId);
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

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

  function handleNewConvo() {
    const fresh = createConversation();
    setConversations((prev) => { const u = [fresh, ...prev]; saveConversations(u); return u; });
    setActiveIdState(fresh.id);
    setActiveId(fresh.id);
  }

  function handleSelectConvo(id: string) { setActiveIdState(id); setActiveId(id); }

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
      await streamMessage(text, historySnapshot, (chunk) => {
        setLoading(false);
        botAnswer += chunk;
        setStreamingText((prev) => (prev ?? "") + chunk);
      }, () => {}, providerSnapshot);
      setStreamingText(null);
      updateConvo(activeId, (c) => ({
        ...c,
        messages: [...c.messages, { role: "bot", text: botAnswer, streaming: false, provider: providerSnapshot }],
        history: [...historySnapshot, { role: "user", content: text }, { role: "assistant", content: botAnswer }],
        updatedAt: Date.now(),
      }));
    } catch {
      setStreamingText(null);
      updateConvo(activeId, (c) => ({
        ...c,
        messages: [...c.messages, { role: "bot", text: "Sorry — something went wrong. Please try again.", streaming: false }],
      }));
    } finally {
      setLoading(false);
    }
  }

  const activeProviderMeta = PROVIDERS.find((p) => p.id === activeProvider)!;

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* ── Panel 1: Icon rail ── */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-brand-darker py-3">
        {/* Logo */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-copper text-white shadow-md mb-2">
          <Wrench className="h-[18px] w-[18px]" />
        </div>

        <Separator className="w-8 bg-white/10 my-1" />

        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={handleNewConvo}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">New conversation</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <Link href="/">
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-300 transition-colors hover:bg-white/10 hover:text-white">
                <Home className="h-4 w-4" />
              </button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Home</TooltipContent>
        </Tooltip>

        {/* Push remaining to bottom */}
        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => setShowProviderPanel((v) => !v)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                showProviderPanel
                  ? "bg-white/15 text-white"
                  : "text-blue-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Settings className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Model settings</TooltipContent>
        </Tooltip>

      </div>

      {/* ── Panel 2: Conversation list (or settings panel) ── */}
      <div className="flex w-56 shrink-0 flex-col border-r border-border bg-background dark:bg-card">
        {showProviderPanel ? (
          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Model</p>
            </div>
            <Separator />
            <div className="flex flex-col gap-1 p-2">
              {PROVIDERS.map(({ id, label, sub, dot, Icon }) => {
                const isActive = activeProvider === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveProvider(id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all",
                      isActive
                        ? "bg-primary/10 ring-1 ring-primary/20 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", dot, !isActive && "opacity-50")} />
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight">{label}</p>
                      <p className="truncate text-[10px] leading-tight text-muted-foreground">{sub}</p>
                    </div>
                    {isActive && (
                      <Badge variant="secondary" className="shrink-0 rounded-full px-1.5 py-0 text-[9px] font-bold uppercase">ON</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Conversations</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {conversations.length}
              </span>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="space-y-0.5 p-2">
                {sorted.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">No conversations yet</p>
                )}
                {sorted.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConvo(c.id)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition-all",
                      c.id === activeId
                        ? "bg-primary/10 text-foreground ring-1 ring-primary/15"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate text-xs leading-snug">{c.title}</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteConvo(c.id); }}
                          className="invisible shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:visible"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Delete</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* ── Panel 3: Chat area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border bg-background px-5 py-3 shadow-sm dark:bg-background">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">{BOT_NAME}</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse2" />
              <p className="text-xs text-muted-foreground leading-tight">Online · AI-powered support</p>
            </div>
          </div>

          {/* Active model badge */}
          <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold">
            <span className={cn("h-1.5 w-1.5 rounded-full", activeProviderMeta.dot)} />
            {activeProviderMeta.label} · {activeProviderMeta.sub}
          </Badge>
        </header>

        {/* Messages */}
        <div className="chat-bg flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState onSuggest={handleSend} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
              {displayMessages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {loading && !streamingText && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border bg-background">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={handleSend} disabled={loading || streamingText !== null} />
          </div>
        </div>
      </div>
    </div>
  );
}
