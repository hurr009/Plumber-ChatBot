"""One-time ingestion: PDF -> chunks -> Sentence Transformer embeddings -> Pinecone.

Run this whenever the knowledge PDF changes:

    python ingest.py

It creates/recreates the Pinecone index to match the embedding dimension, clears
the configured namespace, then upserts freshly chunked + embedded documents.
"""
import os
import sys
import time

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec

from app.config import get_settings


def _create(pc: Pinecone, name: str, dim: int) -> None:
    print(f"Creating index '{name}' (dim={dim}, cosine)...")
    pc.create_index(
        name=name,
        dimension=dim,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    while not pc.describe_index(name).status["ready"]:
        time.sleep(1)
    print("Index ready.")


def ensure_index(pc: Pinecone, name: str, dim: int) -> None:
    existing = {idx["name"] for idx in pc.list_indexes()}
    if name in existing:
        current_dim = pc.describe_index(name).dimension
        if current_dim == dim:
            print(f"Index '{name}' already exists (dim={dim}).")
            return
        print(f"Index '{name}' has dim={current_dim}, expected {dim}. Recreating...")
        pc.delete_index(name)
        while name in {idx["name"] for idx in pc.list_indexes()}:
            time.sleep(1)
    _create(pc, name, dim)


def main() -> None:
    settings = get_settings()

    # langchain-pinecone reads the key from env in some code paths.
    os.environ.setdefault("PINECONE_API_KEY", settings.pinecone_api_key)

    pc = Pinecone(api_key=settings.pinecone_api_key)
    ensure_index(pc, settings.pinecone_index, settings.embed_dim)

    # Clear namespace so re-ingestion is idempotent.
    index = pc.Index(settings.pinecone_index)
    try:
        index.delete(delete_all=True, namespace=settings.pinecone_namespace)
        print(f"Cleared namespace '{settings.pinecone_namespace}'.")
    except Exception:  # namespace may not exist yet
        pass

    print(f"Loading PDF: {settings.knowledge_pdf}")
    try:
        docs = PyPDFLoader(settings.knowledge_pdf).load()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: could not load PDF at '{settings.knowledge_pdf}': {exc}")
        sys.exit(1)

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_documents(docs)
    print(f"Split into {len(chunks)} chunks.")

    # FastEmbed runs locally via ONNX — no API key, no torch.
    embeddings = FastEmbedEmbeddings(model_name=settings.embed_model)

    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=settings.pinecone_index,
        namespace=settings.pinecone_namespace,
        pinecone_api_key=settings.pinecone_api_key,
    )
    print(f"Done. Upserted {len(chunks)} chunks into "
          f"'{settings.pinecone_index}' (namespace '{settings.pinecone_namespace}').")


if __name__ == "__main__":
    main()
