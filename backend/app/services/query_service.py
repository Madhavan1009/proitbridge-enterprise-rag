"""
Query service.
Handles RAG query execution and response persistence.
"""

import uuid
import time
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.core.database import get_supabase
from app.core.logging import get_logger
from app.models.database_models import create_chat_record, create_analytics_event
from app.rag.pipeline import execute_rag_pipeline, execute_rag_stream

logger = get_logger(__name__)


async def process_query(
    query: str,
    session_id: Optional[str] = None,
    top_k: int = 5,
    temperature: float = 0.3,
) -> Dict[str, Any]:
    """
    Process a user query through the RAG pipeline and persist the exchange.

    Steps:
        1. Resolve or create session ID
        2. Load recent chat history for context
        3. Execute the RAG pipeline
        4. Persist user message and AI response
        5. Log analytics event

    Returns:
        Full chat response dict.
    """
    session_id = session_id or str(uuid.uuid4())

    # Load recent history for conversational context
    chat_history = await _load_recent_history(session_id)

    # Execute RAG pipeline
    result = await execute_rag_pipeline(
        query=query,
        top_k=top_k,
        temperature=temperature,
        chat_history=chat_history,
    )

    # Persist the exchange
    await _persist_exchange(
        session_id=session_id,
        query=query,
        answer=result["answer"],
        citations=result["citations"],
        tokens_used=result["tokens_used"],
        retrieval_latency_ms=result["retrieval_latency_ms"],
        generation_latency_ms=result["generation_latency_ms"],
    )

    # Log analytics
    _log_query_event(session_id, result)

    return {
        "answer": result["answer"],
        "citations": result["citations"],
        "latency_ms": result["latency_ms"],
        "tokens_used": result["tokens_used"],
        "session_id": session_id,
    }


async def process_query_stream(
    query: str,
    session_id: Optional[str] = None,
    top_k: int = 5,
    temperature: float = 0.3,
) -> AsyncGenerator[str, None]:
    """
    Process a user query with streaming response.
    Yields SSE events as the LLM generates tokens.
    """
    session_id = session_id or str(uuid.uuid4())
    chat_history = await _load_recent_history(session_id)

    # Persist user message immediately
    await _persist_message(session_id, "user", query)

    full_response = ""
    citations = []

    async for sse_event in execute_rag_stream(
        query=query,
        top_k=top_k,
        temperature=temperature,
        chat_history=chat_history,
    ):
        yield sse_event

        # Parse event to capture the full response and citations
        import json
        try:
            if sse_event.startswith("data: "):
                data = json.loads(sse_event[6:].strip())
                if data.get("type") == "metadata":
                    citations = data.get("citations", [])
                elif data.get("done") and data.get("full_text"):
                    full_response = data["full_text"]
        except (json.JSONDecodeError, KeyError):
            pass

    # Persist AI response after streaming completes
    if full_response:
        await _persist_message(
            session_id, "assistant", full_response,
            citations=citations,
        )


async def _load_recent_history(
    session_id: str, limit: int = 10
) -> List[Dict[str, str]]:
    """Load recent chat messages for a session."""
    try:
        db = get_supabase()
        result = (
            db.table("chat_history")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        if result.data:
            # Reverse to get chronological order
            return list(reversed(result.data))
        return []
    except Exception as e:
        logger.warning(f"Failed to load chat history: {e}")
        return []


async def _persist_exchange(
    session_id: str,
    query: str,
    answer: str,
    citations: List[Dict],
    tokens_used: int,
    retrieval_latency_ms: float,
    generation_latency_ms: float,
) -> None:
    """Persist both the user query and AI response to Supabase."""
    try:
        db = get_supabase()

        # Persist user message
        user_record = create_chat_record(
            session_id=session_id,
            role="user",
            content=query,
        )
        db.table("chat_history").insert(user_record).execute()

        # Persist AI response
        ai_record = create_chat_record(
            session_id=session_id,
            role="assistant",
            content=answer,
            citations=citations,
            tokens_used=tokens_used,
            retrieval_latency_ms=retrieval_latency_ms,
            generation_latency_ms=generation_latency_ms,
        )
        db.table("chat_history").insert(ai_record).execute()

    except Exception as e:
        logger.warning(f"Failed to persist chat exchange: {e}")


async def _persist_message(
    session_id: str,
    role: str,
    content: str,
    citations: Optional[List[Dict]] = None,
) -> None:
    """Persist a single chat message."""
    try:
        db = get_supabase()
        record = create_chat_record(
            session_id=session_id,
            role=role,
            content=content,
            citations=citations,
        )
        db.table("chat_history").insert(record).execute()
    except Exception as e:
        logger.warning(f"Failed to persist message: {e}")


def _log_query_event(session_id: str, result: Dict[str, Any]) -> None:
    """Log a query analytics event."""
    try:
        db = get_supabase()
        event = create_analytics_event(
            event_type="query_executed",
            metadata={
                "session_id": session_id,
                "latency_ms": result["latency_ms"],
                "retrieval_latency_ms": result["retrieval_latency_ms"],
                "generation_latency_ms": result["generation_latency_ms"],
                "tokens_used": result["tokens_used"],
                "citation_count": len(result["citations"]),
                "cited_documents": list(
                    {c["doc"] for c in result["citations"]}
                ),
            },
        )
        db.table("analytics_events").insert(event).execute()
    except Exception as e:
        logger.warning(f"Failed to log query event: {e}")
