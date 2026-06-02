"use client";

import { type Conversation } from "@/lib/conversations";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-slate-900">
      {/* New chat button */}
      <button
        onClick={onNew}
        className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        New conversation
      </button>

      {/* List */}
      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {sorted.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-slate-500">No conversations yet</p>
        )}
        {sorted.map((c) => (
          <div
            key={c.id}
            className={[
              "group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition-colors",
              c.id === activeId
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-800",
            ].join(" ")}
            onClick={() => onSelect(c.id)}
          >
            <span className="flex-1 truncate text-xs leading-snug">{c.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="invisible group-hover:visible shrink-0 rounded p-0.5 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
