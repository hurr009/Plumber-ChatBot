"""LangChain RAG chain: history-aware retrieval over Pinecone + Groq generation."""
import os
from functools import lru_cache

from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore

from .config import get_settings
from .schemas import Source
from .session import get_history, trim_history

CONTEXTUALIZE_PROMPT = (
    "Given a chat history and the latest user question which might reference "
    "context in the chat history, formulate a standalone question which can be "
    "understood without the chat history. Do NOT answer the question, just "
    "reformulate it if needed and otherwise return it as is."
)


def _answer_prompt(bot_name: str) -> str:
    return (
        f"You are {bot_name}, a helpful assistant. Answer the user's question "
        "using ONLY the following retrieved context. If the answer is not in the "
        "context, say you don't have that information and suggest contacting "
        "support — do not make anything up. Keep answers concise and friendly.\n\n"
        "Context:\n{context}"
    )


@lru_cache
def _build_chain():
    settings = get_settings()

    # langchain-pinecone reads from the environment.
    os.environ.setdefault("PINECONE_API_KEY", settings.pinecone_api_key)

    # FastEmbed runs locally via ONNX — no API key, no torch needed.
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


def answer_question(session_id: str, message: str) -> tuple[str, list[Source]]:
    """Run the RAG chain for one turn and update session memory."""
    chain = _build_chain()
    history = get_history(session_id)

    result = chain.invoke({
        "input": message,
        "chat_history": history.messages,
    })

    answer = result["answer"]

    history.add_user_message(message)
    history.add_ai_message(answer)
    trim_history(session_id)

    sources: list[Source] = []
    for doc in result.get("context", []):
        sources.append(
            Source(
                text=doc.page_content[:300],
                page=doc.metadata.get("page"),
            )
        )

    return answer, sources
