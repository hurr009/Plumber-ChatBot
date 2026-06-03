"use client";

import { useRef, useState } from "react";
import { uploadDocument } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** compact = small version for sidebar; default = full card */
  variant?: "compact" | "full";
  onSuccess?: (filename: string, chunks: number) => void;
}

export default function DocumentUpload({ variant = "full", onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("error");
      setMessage("Only PDF files are accepted.");
      return;
    }
    setFileName(file.name);
    setStatus("uploading");
    setMessage("");
    try {
      const result = await uploadDocument(file);
      setStatus("success");
      setMessage(`${result.chunks} chunks indexed successfully.`);
      onSuccess?.(result.filename, result.chunks);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  function handleFiles(files: FileList | null) {
    if (files && files[0]) processFile(files[0]);
  }

  function reset() {
    setStatus("idle");
    setMessage("");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (variant === "compact") {
    return (
      <div className="px-3 py-2">
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        {status === "idle" && (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2.5 text-left text-xs text-blue-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <UploadCloud className="h-3.5 w-3.5 shrink-0" />
            Upload knowledge PDF
          </button>
        )}

        {status === "uploading" && (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-blue-300">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            <span className="truncate">Indexing {fileName}…</span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">{fileName}</span>
            <button onClick={reset} className="shrink-0 hover:text-white transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="flex-1">{message}</span>
            </div>
            <button onClick={reset} className="w-full text-center text-[10px] text-blue-400 hover:text-white transition-colors">
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full card variant
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Upload your knowledge base</p>
          <p className="text-xs text-muted-foreground">PDF up to 50 MB · replaces the current knowledge base</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {(status === "idle" || status === "error") && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-150",
            dragging
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50",
          )}
        >
          <UploadCloud className={cn("h-8 w-8", dragging ? "text-primary" : "text-muted-foreground/50")} />
          <div>
            <p className="text-sm font-medium text-foreground">Drop your PDF here</p>
            <p className="mt-0.5 text-xs text-muted-foreground">or click to browse</p>
          </div>
          {status === "error" && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {message}
            </p>
          )}
        </div>
      )}

      {status === "uploading" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 px-6 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Indexing your document…</p>
            <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</p>
          </div>
          <p className="text-xs text-muted-foreground">Chunking, embedding, and uploading to Pinecone</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">Knowledge base updated!</p>
            <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={reset} className="mt-1 gap-1.5">
            <UploadCloud className="h-3.5 w-3.5" /> Upload another
          </Button>
        </div>
      )}
    </div>
  );
}
