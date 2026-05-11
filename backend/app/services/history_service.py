"""
Chat history service.
Manages retrieval and persistence of conversation history.
"""

from typing import Any, Dict, List, Optional

from app.core.database import get_supabase
from app.core.logging import get_logger

logger = get_logger(__name__)


async def get_session_history(
    session_id: str,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Retrieve chat history for a given session.

    Returns messages in chronological order with:
        - role
        - content
        - citations
        - tokens_used
        - created_at
    """
    try:
        db = get_supabase()
        result = (
            db.table("chat_history")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to retrieve session history: {e}")
        return []


async def get_all_sessions(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Retrieve a list of unique sessions with their latest message.
    """
    try:
        db = get_supabase()
        result = (
            db.table("chat_history")
            .select("session_id, content, created_at")
            .eq("role", "user")
            .order("created_at", desc=True)
            .limit(limit * 2)  # Fetch extra to deduplicate
            .execute()
        )

        # Deduplicate by session_id, keeping the latest message
        seen = set()
        sessions = []
        for row in result.data or []:
            sid = row["session_id"]
            if sid not in seen:
                seen.add(sid)
                sessions.append(
                    {
                        "session_id": sid,
                        "last_message": row["content"][:100],
                        "last_active": row["created_at"],
                    }
                )
            if len(sessions) >= limit:
                break

        return sessions
    except Exception as e:
        logger.error(f"Failed to retrieve sessions: {e}")
        return []


async def delete_session(session_id: str) -> bool:
    """Delete all messages for a given session."""
    try:
        db = get_supabase()
        db.table("chat_history").delete().eq("session_id", session_id).execute()
        logger.info(f"Session deleted: {session_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {e}")
        return False
