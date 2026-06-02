"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage } from "@/lib/api";
import MessageBubble, { ChatMessage } from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME ?? "Plumber Bot";

const GREETING: ChatMessage = {
  role: "bot",
  text: `Hi! I'm ${BOT_NAME}. Ask me anything and I'll answer from our knowledge base.`,
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text: string) {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const { answer } = await sendMessage(text);
      setMessages((prev) => [...prev, { role: "bot", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry — something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 bg-gradient-to-r from-brand to-brand-dark px-4 py-3 text-white shadow">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
          🔧
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{BOT_NAME}</p>
          <p className="text-xs text-white/80">Online</p>
        </div>
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
