"""In-process per-session chat history.

Simple dict keyed by session_id. This is in-session memory only (not persisted
to a database). It works fine on a single backend instance. If you scale to
multiple instances, swap this for a Redis-backed store (see README "Future
Upgrades").
"""
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory

_store: dict[str, ChatMessageHistory] = {}

# Keep the last N messages per session to bound memory growth.
MAX_MESSAGES = 20


def get_history(session_id: str) -> BaseChatMessageHistory:
    history = _store.get(session_id)
    if history is None:
        history = ChatMessageHistory()
        _store[session_id] = history
    return history


def trim_history(session_id: str) -> None:
    history = _store.get(session_id)
    if history and len(history.messages) > MAX_MESSAGES:
        history.messages = history.messages[-MAX_MESSAGES:]
