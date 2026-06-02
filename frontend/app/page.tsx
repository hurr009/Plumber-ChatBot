export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center">
      <h1 className="text-3xl font-bold text-slate-800">Plumber Bot</h1>
      <p className="max-w-md text-slate-600">
        This is the host app. The chat widget lives at{" "}
        <code className="rounded bg-slate-200 px-1">/widget</code> and is embedded
        on other sites via{" "}
        <code className="rounded bg-slate-200 px-1">/widget.js</code>.
      </p>
      <a
        href="/widget"
        className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
      >
        Open the widget
      </a>
    </main>
  );
}
