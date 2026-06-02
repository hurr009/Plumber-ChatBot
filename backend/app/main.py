"""FastAPI application exposing the chat endpoint for the widget."""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .schemas import ChatRequest, ChatResponse, HealthResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("plumber-bot")

settings = get_settings()

app = FastAPI(title=f"{settings.bot_name} API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    # Imported lazily so the app can start (and /health respond) even if the
    # RAG dependencies / Pinecone index aren't reachable yet.
    from .rag import answer_question

    try:
        answer, sources = answer_question(req.session_id, req.message)
    except Exception as exc:  # noqa: BLE001
        logger.exception("chat failed")
        raise HTTPException(status_code=500, detail="Failed to generate a response") from exc

    return ChatResponse(answer=answer, sources=sources)
