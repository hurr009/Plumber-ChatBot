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
