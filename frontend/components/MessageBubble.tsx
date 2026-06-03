import ReactMarkdown from "react-markdown";

const PROVIDER_LABEL: Record<string, { label: string; color: string }> = {
  groq: { label: "Groq · LLaMA 3.3", color: "text-orange-400" },
  openai: { label: "OpenAI · GPT-4o mini", color: "text-emerald-500" },
};

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  streaming?: boolean;
  provider?: "groq" | "openai";
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const providerMeta = !isUser && message.provider ? PROVIDER_LABEL[message.provider] : null;

  return (
    <div className={`flex animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[80%] flex-col gap-1">
        <div
          className={[
            "break-words rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-brand text-white"
              : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200",
          ].join(" ")}
        >
          {isUser || message.streaming ? (
            <span className="whitespace-pre-wrap">{message.text}</span>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
                h1: ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">
                    {children}
                  </code>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          )}
        </div>
        {providerMeta && (
          <span className={`pl-1 text-[10px] font-medium ${providerMeta.color}`}>
            {providerMeta.label}
          </span>
        )}
      </div>
    </div>
  );
}
