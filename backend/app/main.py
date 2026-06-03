"""FastAPI application exposing the chat endpoint for the widget."""
import logging

import os
import tempfile

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import get_settings
from .schemas import ChatRequest, HealthResponse

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



@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Accept a PDF upload, chunk it, embed it, and upsert into Pinecone.
    Replaces whatever was previously in the configured namespace.
    Returns the number of chunks ingested.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    from langchain_community.document_loaders import PyPDFLoader
    from langchain_community.embeddings import FastEmbedEmbeddings
    from langchain_pinecone import PineconeVectorStore
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from pinecone import Pinecone

    settings = get_settings()
    os.environ.setdefault("PINECONE_API_KEY", settings.pinecone_api_key)

    # Write the uploaded file to a temp path so PyPDFLoader can read it
    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        docs = PyPDFLoader(tmp_path).load()
    except Exception as exc:
        os.unlink(tmp_path)
        raise HTTPException(status_code=422, detail=f"Could not parse PDF: {exc}")
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_documents(docs)
    if not chunks:
        raise HTTPException(status_code=422, detail="PDF appears to be empty or unreadable.")

    # Clear old namespace and upsert new chunks
    pc = Pinecone(api_key=settings.pinecone_api_key)
    index = pc.Index(settings.pinecone_index)
    try:
        index.delete(delete_all=True, namespace=settings.pinecone_namespace)
    except Exception:
        pass  # namespace may not exist yet — that's fine

    embeddings = FastEmbedEmbeddings(model_name=settings.embed_model)
    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=settings.pinecone_index,
        namespace=settings.pinecone_namespace,
        pinecone_api_key=settings.pinecone_api_key,
    )

    # Invalidate the cached retriever so next query picks up new vectors
    from .rag import _build_retriever
    _build_retriever.cache_clear()

    logger.info("Uploaded '%s' → %d chunks upserted", file.filename, len(chunks))
    return {"chunks": len(chunks), "filename": file.filename}


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
