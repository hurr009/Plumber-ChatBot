export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-slate-400 [animation-delay:-0.32s]" />
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-slate-400 [animation-delay:-0.16s]" />
        <span className="h-2 w-2 animate-bounce2 rounded-full bg-slate-400" />
      </div>
    </div>
  );
}
