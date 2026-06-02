import ReactMarkdown from "react-markdown";

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] break-words rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-brand text-white"
            : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200",
        ].join(" ")}
      >
        {isUser ? (
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
    </div>
  );
}
