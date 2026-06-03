"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM provider: "groq" or "openai"
    llm_provider: str = "groq"

    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Pinecone
    pinecone_api_key: str
    pinecone_index: str = "plumber-bot"
    pinecone_namespace: str = "plumber"

    # FastEmbed model (local ONNX, no API key, no torch)
    embed_model: str = "BAAI/bge-small-en-v1.5"
    embed_dim: int = 384

    # CORS: comma-separated origins allowed to call the API
    allowed_origins: str = "http://localhost:3000"

    # Ingestion
    knowledge_pdf: str = "data/Knowledge.pdf"

    # Bot identity
    bot_name: str = "Plumber Bot"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
