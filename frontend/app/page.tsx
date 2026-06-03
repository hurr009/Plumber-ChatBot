"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DocumentUpload from "@/components/DocumentUpload";
import {
  Wrench, Zap, Shield, Clock, MessageSquare,
  ChevronRight, CheckCircle2, Star, ArrowRight,
  BookOpen, Settings, Sparkles,
} from "lucide-react";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Answers",
    desc: "Get expert plumbing guidance in seconds — no hold music, no waiting for a callback.",
  },
  {
    icon: BookOpen,
    title: "Knowledge-Based",
    desc: "Answers grounded in your real documentation — not hallucinated, always accurate.",
  },
  {
    icon: Clock,
    title: "24 / 7 Availability",
    desc: "Your customers get help at 2am on a Sunday just as easily as Monday at 9.",
  },
  {
    icon: Shield,
    title: "Scoped to Plumbing",
    desc: "Only answers questions about plumbing. Off-topic queries are politely redirected.",
  },
  {
    icon: MessageSquare,
    title: "Multi-turn Memory",
    desc: "Remembers context within a conversation so follow-up questions just work.",
  },
  {
    icon: Settings,
    title: "Switchable LLMs",
    desc: "Runs on Groq LLaMA 3.3 or OpenAI GPT-4o mini — switch per request, no redeploy.",
  },
];

const STEPS = [
  { num: "01", title: "Upload your knowledge", desc: "Drop in your PDF manuals, guides, or FAQ docs. We index them into a vector database." },
  { num: "02", title: "Embed one script tag", desc: "Paste a single <script> tag on any website. The widget appears instantly." },
  { num: "03", title: "Customers get answers", desc: "Visitors ask questions in natural language. The bot answers from your docs, 24/7." },
];

const SAMPLE_MESSAGES = [
  { role: "user", text: "My kitchen faucet is dripping constantly. What should I check first?" },
  { role: "bot",  text: "A dripping faucet is usually a worn washer or O-ring. Start by turning off the shut-off valve under the sink, then remove the handle and inspect the cartridge." },
  { role: "user", text: "How do I know if it's a ceramic disc vs a ball faucet?" },
  { role: "bot",  text: "Ball faucets have a single rounded lever that moves in all directions. Ceramic disc faucets have a wide cylindrical body — a wide cylinder below the spout is the telltale sign." },
];

function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 bg-brand-darker px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-copper text-white">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Plumber Bot</p>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p className="text-[10px] text-blue-300">Online now</p>
            </div>
          </div>
          <div className="ml-auto flex gap-1.5">
            {["bg-red-400/60", "bg-yellow-400/60", "bg-emerald-400/60"].map((c) => (
              <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
            ))}
          </div>
        </div>
        {/* Messages */}
        <div className="space-y-3 p-4">
          {SAMPLE_MESSAGES.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-muted text-foreground"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="border-t border-border px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
            <span className="flex-1 text-xs text-muted-foreground">Ask about plumbing…</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
              <ArrowRight className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
      {/* Floating badge */}
      <div className="absolute -right-3 -top-3 rounded-full border border-border bg-background px-2.5 py-1 shadow-lg">
        <div className="flex items-center gap-1 text-[11px] font-medium">
          <Sparkles className="h-3 w-3 text-primary" />
          RAG-powered
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-darker text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">Plumber Bot</span>
          </div>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <button onClick={() => scrollTo("features")} className="transition-colors hover:text-foreground">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="transition-colors hover:text-foreground">How it works</button>
            <button onClick={() => scrollTo("demo")} className="transition-colors hover:text-foreground">Demo</button>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/chat">
              <Button variant="ghost" size="sm">Open app</Button>
            </Link>
            <Link href="/chat">
              <Button size="sm" className="gap-1.5">
                Try for free <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div className="space-y-8">
              <div>
                <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full px-3 py-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  RAG · Groq · OpenAI
                </Badge>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                  AI support for{" "}
                  <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    every plumbing question
                  </span>
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  Embed a knowledge-grounded chatbot on any website in minutes.
                  Powered by your own documentation — not generic AI guesses.
                </p>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Answers grounded in your PDF knowledge base",
                  "Streams responses token-by-token like ChatGPT",
                  "Drop-in widget with a single <script> tag",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/chat">
                  <Button size="lg" className="gap-2 px-6">
                    Start chatting <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="gap-2 px-6" onClick={() => scrollTo("demo")}>
                  See live demo
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {["bg-orange-400", "bg-blue-400", "bg-emerald-400", "bg-purple-400"].map((c, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full border-2 border-background ${c}`} />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span>Trusted by plumbing professionals</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center md:justify-end" id="demo">
              <ChatPreview />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
            <p className="mt-3 text-muted-foreground">
              Built for plumbing businesses that want AI support without the complexity.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">How it works</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-border md:block" />
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/20 bg-background shadow-sm">
                  <span className="text-2xl font-black text-primary">{num}</span>
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-darker text-white shadow-card">
              <Wrench className="h-7 w-7" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to give your customers instant answers?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Upload your knowledge base PDF, then open the chat — no sign-up required.
          </p>

          <div className="mt-8 w-full max-w-md mx-auto text-left">
            <DocumentUpload variant="full" onSuccess={() => {}} />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/chat">
              <Button size="lg" className="gap-2 px-8">
                Open Plumber Bot <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/widget">
              <Button size="lg" variant="outline" className="px-8">
                Preview widget
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-darker text-white">
              <Wrench className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">Plumber Bot</span>
            <span className="text-sm text-muted-foreground">— AI Support Assistant</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by Groq · OpenAI · Pinecone · LangChain
          </p>
        </div>
      </footer>
    </div>
  );
}
