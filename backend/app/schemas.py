"""Pydantic request/response models for the chat API."""
from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, description="Per-visitor session id")
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[HistoryMessage] = Field(default=[], max_length=20)


class Source(BaseModel):
    text: str
    page: int | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = []


class HealthResponse(BaseModel):
    status: str = "ok"
