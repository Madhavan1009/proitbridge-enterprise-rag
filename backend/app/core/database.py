"""
Supabase PostgreSQL client.
Provides an async-compatible wrapper around the Supabase Python client
and initializes all required tables on first connection.
"""

from typing import Optional

from supabase import create_client, Client

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_client: Optional[Client] = None


def get_supabase() -> Client:
    """Return a cached Supabase client singleton."""
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set in the environment."
            )
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info("Supabase client initialized", extra={"url": settings.SUPABASE_URL})
    return _client


async def init_database() -> None:
    """
    Verify connectivity to Supabase.
    Tables should be created via Supabase SQL Editor or migrations.
    This function validates that the required tables exist.
    """
    try:
        db = get_supabase()
        # Lightweight connectivity check
        db.table("documents").select("id").limit(1).execute()
        logger.info("Database connectivity verified — tables accessible")
    except Exception as e:
        logger.warning(
            f"Database tables may not exist yet — run the SQL migration: {e}"
        )


# ─── SQL Migration (run in Supabase SQL Editor) ─────────────────────────────
#
# CREATE TABLE IF NOT EXISTS documents (
#     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
#     name TEXT NOT NULL,
#     file_type TEXT NOT NULL,
#     size_bytes BIGINT NOT NULL,
#     chunk_count INTEGER DEFAULT 0,
#     status TEXT DEFAULT 'queued',
#     uploaded_at TIMESTAMPTZ DEFAULT now(),
#     updated_at TIMESTAMPTZ DEFAULT now()
# );
#
# CREATE TABLE IF NOT EXISTS chat_history (
#     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
#     session_id TEXT NOT NULL,
#     role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
#     content TEXT NOT NULL,
#     citations JSONB DEFAULT '[]',
#     tokens_used INTEGER DEFAULT 0,
#     retrieval_latency_ms REAL,
#     generation_latency_ms REAL,
#     created_at TIMESTAMPTZ DEFAULT now()
# );
#
# CREATE TABLE IF NOT EXISTS analytics_events (
#     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
#     event_type TEXT NOT NULL,
#     metadata JSONB DEFAULT '{}',
#     created_at TIMESTAMPTZ DEFAULT now()
# );
#
# CREATE INDEX idx_documents_status ON documents(status);
# CREATE INDEX idx_chat_history_session ON chat_history(session_id);
# CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
