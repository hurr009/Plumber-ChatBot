const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SESSION_KEY = "plumber_bot_session_id";

export interface Source {
  text: string;
  page: number | null;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProvidersResult {
  active: "groq" | "openai";
  available: string[];
  models: Record<string, string>;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function fetchProviders(): Promise<ProvidersResult> {
  const res = await fetch(`${API_URL}/providers`, {
    headers: { "ngrok-skip-browser-warning": "1" },
  });
  if (!res.ok) throw new Error("Failed to fetch providers");
  return res.json();
}

export async function streamMessage(
  message: string,
  history: HistoryMessage[],
  onChunk: (text: string) => void,
  onSources: (sources: Source[]) => void,
  provider?: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify({ session_id: getSessionId(), message, history, llm_provider: provider ?? null }),
  });

  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by \n\n
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? ""; // last incomplete part stays in buffer

    for (const part of parts) {
      const lines = part.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!dataLine) continue;

      const raw = dataLine.slice("data:".length).trim();
      const eventType = eventLine ? eventLine.slice("event:".length).trim() : "message";

      if (eventType === "error") throw new Error(raw);
      if (eventType === "sources") {
        try { onSources(JSON.parse(raw)); } catch { /* ignore */ }
      } else {
        try { onChunk(JSON.parse(raw)); } catch { onChunk(raw); }
      }
    }
  }
}
