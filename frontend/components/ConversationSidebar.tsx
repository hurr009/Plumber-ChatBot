"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MessageSquare, Trash2, Wrench, Zap, Sparkles } from "lucide-react";
import { type Conversation } from "@/lib/conversations";
import { cn } from "@/lib/utils";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  activeProvider: "groq" | "openai";
  onProviderChange: (p: "groq" | "openai") => void;
}

const PROVIDERS: {
  id: "groq" | "openai";
  label: string;
  sub: string;
  dotClass: string;
  Icon: React.ElementType;
}[] = [
  { id: "groq",   label: "Groq",   sub: "LLaMA 3.3 · 70B", dotClass: "bg-orange-400",  Icon: Zap },
  { id: "openai", label: "OpenAI", sub: "GPT-4o mini",      dotClass: "bg-emerald-400", Icon: Sparkles },
];

export default function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, activeProvider, onProviderChange,
}: Props) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full w-60 shrink-0 flex-col bg-brand-darker text-white">

      {/* Brand header */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-copper shadow-md">
          <Wrench className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight tracking-tight">Plumber Bot</p>
          <p className="text-[10px] leading-tight text-blue-300">AI Support Assistant</p>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* New conversation */}
      <div className="px-3 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onNew}
          className="w-full justify-start gap-2 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
      </div>

      {/* Conversation list */}
      <p className="mt-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
        Recent
      </p>

      <ScrollArea className="mt-1 flex-1 px-2">
        <div className="space-y-0.5 pb-2">
          {sorted.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-500">No conversations yet</p>
          )}
          {sorted.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-150",
                c.id === activeId
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
              <span className="flex-1 truncate text-xs leading-snug">{c.title}</span>
              <Tooltip>
                <TooltipTrigger >
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    className="invisible shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-red-400 group-hover:visible"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Delete conversation</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator className="bg-white/10" />

      {/* Provider switcher */}
      <div className="px-3 py-3">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
          AI Model
        </p>
        <div className="flex flex-col gap-1">
          {PROVIDERS.map(({ id, label, sub, dotClass, Icon }) => {
            const isActive = activeProvider === id;
            return (
              <button
                key={id}
                onClick={() => onProviderChange(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all duration-150",
                  isActive
                    ? "bg-white/15 ring-1 ring-white/20 text-white"
                    : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
                )}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass, isActive ? "shadow-[0_0_6px_2px] shadow-current" : "opacity-50")} />
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{label}</p>
                  <p className="truncate text-[10px] leading-tight text-slate-500">{sub}</p>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="shrink-0 rounded-full bg-white/20 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-white/80 hover:bg-white/20">
                    ON
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
