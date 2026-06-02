export interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={[
          "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-brand text-white"
            : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200",
        ].join(" ")}
      >
        {message.text}
      </div>
    </div>
  );
}
