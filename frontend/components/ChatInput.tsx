"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SendHorizonal } from "lucide-react";

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className={[
        "flex items-end gap-2 rounded-xl border bg-background px-3 py-2 transition-all duration-150",
        disabled
          ? "opacity-70 border-border"
          : "border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
      ].join(" ")}>
        <Textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          placeholder={disabled ? "Generating response…" : "Ask me anything about plumbing…"}
          className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0 disabled:cursor-not-allowed leading-relaxed"
        />
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={submit}
              disabled={!canSend}
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg"
              aria-label="Send message"
            >
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Send (Enter)</TooltipContent>
        </Tooltip>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">Enter</kbd> to send ·{" "}
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
