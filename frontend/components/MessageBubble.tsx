"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wrench, User } from "lucide-react";

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  streaming?: boolean;
  provider?: "groq" | "openai";
}

const PROVIDER_META: Record<string, { label: string; dotClass: string; textClass: string }> = {
  groq:   { label: "Groq · LLaMA 3.3",    dotClass: "bg-orange-400",  textClass: "text-orange-400" },
  openai: { label: "OpenAI · GPT-4o mini", dotClass: "bg-emerald-500", textClass: "text-emerald-500" },
};

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-darker text-white shadow-md mt-0.5 dark:bg-brand-dark">
      <Wrench className="h-[14px] w-[14px]" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md mt-0.5">
      <User className="h-[14px] w-[14px]" />
    </div>
  );
}

function BlurWord({ word, index }: { word: string; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <span
      className="inline transition-[opacity,filter] duration-[420ms] ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0px)" : "blur(6px)",
        transitionDelay: `${Math.min(index * 8, 80)}ms`,
      }}
    >
      {word}{" "}
    </span>
  );
}

function StreamingBubble({ text }: { text: string }) {
  const endsWithSpace = text.endsWith(" ") || text.endsWith("\n");
  const words: string[] = [];
  let trailingFragment = "";

  if (endsWithSpace) {
    words.push(...text.trimEnd().split(/\s+/).filter(Boolean));
  } else {
    const tokens = text.split(/\s+/).filter(Boolean);
    words.push(...tokens.slice(0, -1));
    trailingFragment = tokens[tokens.length - 1] ?? "";
  }

  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {words.map((word, i) => (
        <BlurWord key={`${i}-${word}`} word={word} index={i} />
      ))}
      {trailingFragment && <span className="opacity-85">{trailingFragment}</span>}
      <span
        aria-hidden="true"
        className="animate-blink inline-block w-[2px] h-[1em] bg-current ml-[2px] align-text-bottom rounded-[1px]"
      />
    </span>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const providerMeta = !isUser && message.provider ? PROVIDER_META[message.provider] : null;

  return (
    <div className={cn(
      "flex items-start gap-2.5 animate-fade-in",
      isUser ? "flex-row-reverse animate-slide-in-right" : "animate-slide-in-left",
    )}>
      {isUser ? <UserAvatar /> : <BotAvatar />}

      <div className={cn("flex max-w-[75%] flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-bubble",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-card text-card-foreground ring-1 ring-border",
        )}>
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.text}</span>
          ) : message.streaming ? (
            <StreamingBubble text={message.text} />
          ) : (
            <div className="prose-sm prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  p:      ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  ul:     ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                  ol:     ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                  li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h1:     ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h1>,
                  h2:     ({ children }) => <h2 className="mb-1.5 mt-3 text-sm font-bold first:mt-0">{children}</h2>,
                  h3:     ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h3>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code:   ({ children }) => (
                    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs ring-1 ring-border">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground">{children}</blockquote>
                  ),
                  hr: () => <hr className="my-2 border-border" />,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {providerMeta && (
          <Badge
            variant="secondary"
            className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-transparent", providerMeta.textClass)}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", providerMeta.dotClass)} />
            {providerMeta.label}
          </Badge>
        )}
      </div>
    </div>
  );
}
