"""
Database model helpers for Supabase operations.
These are plain dictionaries conforming to the Supabase table schemas.
Since Supabase is used via its REST client (not SQLAlchemy), we define
helper functions to construct valid row dicts.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def create_document_record(
    name: str,
    file_type: str,
    size_bytes: int,
    chunk_count: int = 0,
    status: str = "queued",
) -> Dict[str, Any]:
    """Build a dict suitable for inserting into the 'documents' table."""
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "file_type": file_type,
        "size_bytes": size_bytes,
        "chunk_count": chunk_count,
        "status": status,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def create_chat_record(
    session_id: str,
    role: str,
    content: str,
    citations: Optional[List[Dict]] = None,
    tokens_used: int = 0,
    retrieval_latency_ms: Optional[float] = None,
    generation_latency_ms: Optional[float] = None,
) -> Dict[str, Any]:
    """Build a dict suitable for inserting into the 'chat_history' table."""
    return {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": role,
        "content": content,
        "citations": citations or [],
        "tokens_used": tokens_used,
        "retrieval_latency_ms": retrieval_latency_ms,
        "generation_latency_ms": generation_latency_ms,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def create_analytics_event(
    event_type: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Build a dict suitable for inserting into the 'analytics_events' table."""
    return {
        "id": str(uuid.uuid4()),
        "event_type": event_type,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
