const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Source {
  text: string;
  page: number | null;
}

export interface ChatResult {
  answer: string;
  sources: Source[];
}

const SESSION_KEY = "plumber_bot_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function sendMessage(message: string): Promise<ChatResult> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: getSessionId(), message }),
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as ChatResult;
}

export async function streamMessage(
  message: string,
  onChunk: (text: string) => void,
  onSources: (sources: Source[]) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: getSessionId(), message }),
  });

  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Sources are sent as a final line: \n__SOURCES__[...]
    const sourcesIdx = buffer.indexOf("\n__SOURCES__");
    if (sourcesIdx !== -1) {
      onChunk(buffer.slice(0, sourcesIdx));
      const raw = buffer.slice(sourcesIdx + "\n__SOURCES__".length);
      try { onSources(JSON.parse(raw)); } catch { /* ignore parse errors */ }
      return;
    }

    const errorIdx = buffer.indexOf("\n__ERROR__");
    if (errorIdx !== -1) {
      throw new Error(buffer.slice(errorIdx + "\n__ERROR__".length));
    }

    onChunk(buffer);
    buffer = "";
  }
}
