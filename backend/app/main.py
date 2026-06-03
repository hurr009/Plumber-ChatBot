"""FastAPI application exposing the chat endpoint for the widget."""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

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


@app.get("/providers")
def get_providers():
    """Return available LLM providers and which one is currently active."""
    return {
        "active": settings.llm_provider,
        "available": ["groq", "openai"],
        "models": {
            "groq": settings.groq_model,
            "openai": settings.openai_model,
        },
    }


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    from .rag import answer_question

    try:
        answer, sources = answer_question(req.history, req.message, req.llm_provider)
    except Exception as exc:
        logger.exception("chat failed")
        raise HTTPException(status_code=500, detail="Failed to generate a response") from exc

    return ChatResponse(answer=answer, sources=sources)


@app.post("/chat/stream")
async def stream_chat(req: ChatRequest) -> StreamingResponse:
    from .rag import stream_answer
    import json

    async def generate():
        try:
            async for chunk in stream_answer(req.history, req.message, req.llm_provider):
                if chunk.startswith("\n__SOURCES__"):
                    payload = chunk[len("\n__SOURCES__"):]
                    yield f"event: sources\ndata: {payload}\n\n"
                else:
                    yield f"data: {json.dumps(chunk)}\n\n"
        except Exception:
            logger.exception("stream failed")
            yield "event: error\ndata: Failed to generate a response\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )
