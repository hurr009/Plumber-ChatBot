"""LangChain RAG chain: history-aware retrieval over Pinecone + Groq generation."""
import os
from functools import lru_cache

from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore

from .config import get_settings
from .schemas import HistoryMessage, Source

CONTEXTUALIZE_PROMPT = (
    "Given a chat history and the latest user question which might reference "
    "context in the chat history, formulate a standalone question which can be "
    "understood without the chat history. Do NOT answer the question, just "
    "reformulate it if needed and otherwise return it as is."
)


def _answer_prompt(bot_name: str) -> str:
    return f"""
        You are {bot_name}, a professional and knowledgeable plumbing assistant.

        Use ONLY the information provided in the retrieved context to answer the user's question.

        Rules:
        1. Do not make up information or assumptions.
        2. If the answer is not available in the context, politely say:
        "I couldn't find that information in my knowledge base. Please contact support for further assistance."
        3. Always provide responses in a professional, friendly, and helpful tone.
        4. Format responses using Markdown:
        - Use headings when appropriate.
        - Use bullet points for lists.
        - Use numbered steps for procedures.
        - Highlight important information clearly.
        5. Keep answers concise but complete.
        6. For repair or troubleshooting questions, present the solution as step-by-step instructions when possible.

        Retrieved Context: {{context}} """


@lru_cache
def _build_chain():
    settings = get_settings()

    os.environ.setdefault("PINECONE_API_KEY", settings.pinecone_api_key)

    embeddings = FastEmbedEmbeddings(model_name=settings.embed_model)

    vector_store = PineconeVectorStore(
        index_name=settings.pinecone_index,
        embedding=embeddings,
        namespace=settings.pinecone_namespace,
        pinecone_api_key=settings.pinecone_api_key,
    )
    retriever = vector_store.as_retriever(search_kwargs={"k": 4})

    llm = ChatGroq(
        model=settings.groq_model,
        temperature=0.2,
        api_key=settings.groq_api_key,
    )

    contextualize_prompt = ChatPromptTemplate.from_messages([
        ("system", CONTEXTUALIZE_PROMPT),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_prompt
    )

    answer_prompt = ChatPromptTemplate.from_messages([
        ("system", _answer_prompt(settings.bot_name)),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    qa_chain = create_stuff_documents_chain(llm, answer_prompt)

    return create_retrieval_chain(history_aware_retriever, qa_chain)


def _to_lc_messages(history: list[HistoryMessage]):
    """Convert frontend history format to LangChain message objects."""
    result = []
    for m in history:
        if m.role == "user":
            result.append(HumanMessage(content=m.content))
        else:
            result.append(AIMessage(content=m.content))
    return result


async def stream_answer(history: list[HistoryMessage], message: str):
    """Stream answer tokens then yield sources as a final JSON line."""
    import json
    from langchain_core.messages import AIMessageChunk

    chain = _build_chain()
    lc_history = _to_lc_messages(history)

    full_answer = ""
    docs = []
    answer_run_id: str | None = None
    async for event in chain.astream_events(
        {"input": message, "chat_history": lc_history},
        version="v2",
    ):
        kind = event["event"]
        if kind == "on_chain_start" and event.get("name") == "stuff_documents_chain":
            answer_run_id = event["run_id"]
        elif kind == "on_chat_model_stream" and answer_run_id in event.get("parent_ids", []):
            chunk = event["data"]["chunk"]
            if isinstance(chunk, AIMessageChunk) and chunk.content:
                full_answer += chunk.content
                yield chunk.content
        elif kind == "on_retriever_end":
            docs = event["data"].get("output", [])

    sources: list[Source] = []
    for doc in docs:
        sources.append(Source(text=doc.page_content[:300], page=doc.metadata.get("page")))

    yield "\n__SOURCES__" + json.dumps([s.model_dump() for s in sources])


def answer_question(history: list[HistoryMessage], message: str) -> tuple[str, list[Source]]:
    """Run the RAG chain for one turn (non-streaming)."""
    chain = _build_chain()
    lc_history = _to_lc_messages(history)

    result = chain.invoke({"input": message, "chat_history": lc_history})
    answer = result["answer"]

    sources: list[Source] = []
    for doc in result.get("context", []):
        sources.append(Source(text=doc.page_content[:300], page=doc.metadata.get("page")))

    return answer, sources
