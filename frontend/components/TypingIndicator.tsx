export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 animate-fade-in">
      {/* Bot avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-darker text-white shadow-md mt-0.5">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-5 py-3.5 shadow-bubble ring-1 ring-slate-100">
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-slate-400 [animation-delay:-0.32s]" />
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-slate-400 [animation-delay:-0.16s]" />
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-slate-400" />
      </div>
    </div>
  );
}
