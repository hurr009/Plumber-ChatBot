import { Wrench } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-darker text-white shadow-md mt-0.5 dark:bg-brand-dark">
        <Wrench className="h-[14px] w-[14px]" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-card px-5 py-3.5 shadow-bubble ring-1 ring-border">
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-muted-foreground/50 [animation-delay:-0.32s]" />
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-muted-foreground/50 [animation-delay:-0.16s]" />
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-muted-foreground/50" />
      </div>
    </div>
  );
}
