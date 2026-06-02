import { type HistoryMessage } from "./api";
import { type ChatMessage } from "@/components/MessageBubble";

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  history: HistoryMessage[];  // sent to backend
  messages: ChatMessage[];    // displayed in UI
}

const STORE_KEY = "plumber_bot_conversations";
const ACTIVE_KEY = "plumber_bot_active_conversation";
const MAX_CONVERSATIONS = 20;

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function saveConversations(convos: Conversation[]): void {
  if (typeof window === "undefined") return;
  // keep most recent MAX_CONVERSATIONS
  const trimmed = convos
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
  window.localStorage.setItem(STORE_KEY, JSON.stringify(trimmed));
}

export function getActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_KEY, id);
}

export function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    history: [],
    messages: [],
  };
}

export function titleFromMessage(text: string): string {
  return text.length > 40 ? text.slice(0, 40).trimEnd() + "…" : text;
}
