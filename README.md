# Plumber Bot — Embeddable RAG Chatbot Widget

A modern RAG chatbot you can drop into **any website** with a single `<script>` tag.

- **Frontend:** Next.js (App Router, TypeScript, Tailwind) → Vercel
- **Backend:** FastAPI + LangChain → Render / Railway
- **Vector DB:** Pinecone
- **Embeddings:** FastEmbed `BAAI/bge-small-en-v1.5` (local ONNX, no API key, no torch)
- **LLM:** Groq `llama-3.3-70b-versatile`
- **Memory:** in-session per-visitor history (multi-turn follow-ups)

```
Host site ──<script>──► widget.js ──iframe──► Next.js /widget ──fetch──► FastAPI /chat
                                                                              │
                                         FastEmbed (local) ── Pinecone ── Groq LLM
```

---

## 1. Prerequisites (create accounts + keys)

1. **Groq** → https://console.groq.com → API Keys → create a key. Free tier is very generous.
2. **Pinecone** → https://app.pinecone.io → copy your **API key**. The index (`plumber-bot`, 384 dims, cosine) is created automatically by `ingest.py`, no manual setup needed.

---

## 2. Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then fill in your keys
```

Put your knowledge PDF at `backend/data/knowledge.pdf` (or set `KNOWLEDGE_PDF` in `.env`).

### Ingest the knowledge base (run once, and again whenever the PDF changes)

```bash
python ingest.py
```

You should see `Split into N chunks.` and `Done. Upserted N chunks ...`. Verify the vector count in the Pinecone console.

### Run the API

```bash
uvicorn app.main:app --reload   # http://localhost:8000  (docs at /docs)
```

Quick test:

```bash
curl -X POST localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"t1","message":"<a question answerable from your PDF>"}'
```

Send a follow-up with the same `session_id` to confirm memory works; ask something off-topic to confirm the bot declines instead of hallucinating.

---

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                        # http://localhost:3000
```

- Chat UI: http://localhost:3000/widget
- Embed test page: http://localhost:3000/test.html (floating bubble bottom-right)

---

## 4. Embedding on other websites

After deploying the frontend, any site adds **one tag**:

```html
<script src="https://your-frontend.vercel.app/widget.js" defer></script>
```

Optional config via attributes:

```html
<script
  src="https://your-frontend.vercel.app/widget.js"
  data-accent="#16a34a"
  data-position="left"
  defer
></script>
```

The widget renders inside an **iframe**, so it never clashes with the host site's CSS. The iframe URL is derived automatically from where `widget.js` is served.

> **Important:** each host domain must be added to the backend's `ALLOWED_ORIGINS` (CORS), otherwise the browser will block `/chat` calls.

---

## 5. Deployment

### Backend → Render (or Railway)

1. Push this repo to GitHub.
2. New **Web Service**, root directory `backend/`, build from the included `Dockerfile`.
3. Set environment variables: `GROQ_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_NAMESPACE`, `ALLOWED_ORIGINS` (include your Vercel URL + customer domains), `BOT_NAME`.
4. Run ingestion once so Pinecone is populated — locally (`python ingest.py`) or as a one-off job on the host.
5. Note the public URL, e.g. `https://plumber-bot-api.onrender.com`.

### Frontend → Vercel

1. Import the repo, set **Root Directory = `frontend/`**.
2. Env var: `NEXT_PUBLIC_API_URL=https://plumber-bot-api.onrender.com` (and `NEXT_PUBLIC_BOT_NAME`).
3. Deploy → `https://plumber-bot.vercel.app`. Widget page at `/widget`, loader at `/widget.js`.

### Wire-up checklist

- [ ] `ALLOWED_ORIGINS` (backend) includes the Vercel domain and every customer domain.
- [ ] `NEXT_PUBLIC_API_URL` (frontend) points at the live backend.
- [ ] Pinecone populated via `ingest.py`.
- [ ] Hand customers the `<script>` snippet.

---

## Project structure

```
backend/
  app/{config,schemas,session,rag,main}.py
  ingest.py            # PDF -> chunks -> embeddings -> Pinecone
  data/knowledge.pdf   # your PDF (gitignored)
  Dockerfile
frontend/
  app/{layout,page}.tsx, app/widget/page.tsx
  components/{ChatWindow,MessageBubble,ChatInput,TypingIndicator}.tsx
  lib/api.ts
  public/{widget.js,test.html}
```

---

## Future upgrades

- Swap the in-memory session store (`app/session.py`) for **Redis** when running multiple backend instances.
- **Streaming** token responses for snappier UX.
- **Persisted** chat history + analytics.
- **Rate limiting** / per-domain API keys on `/chat`.
- Show **source citations** in the UI (the API already returns `sources`).
```
