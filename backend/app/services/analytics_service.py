"""
Analytics service.
Aggregates metrics from Supabase for the analytics dashboard.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from app.core.database import get_supabase
from app.core.pinecone_client import get_index_stats
from app.core.logging import get_logger

logger = get_logger(__name__)


async def get_analytics() -> Dict[str, Any]:
    """
    Aggregate analytics metrics for the dashboard.

    Metrics:
        - total_documents: Count of all documents
        - total_chunks: Total vectors in Pinecone
        - total_queries: Count of all query events
        - avg_retrieval_latency_ms: Average retrieval latency
        - avg_generation_latency_ms: Average generation latency
        - total_tokens_used: Sum of all tokens consumed
        - top_queried_documents: Most frequently cited documents
        - queries_today: Queries in the last 24 hours
        - queries_delta_pct: Change vs previous day
    """
    db = get_supabase()

    # ── Document count ───────────────────────────────────────────────────
    try:
        doc_result = db.table("documents").select("id", count="exact").execute()
        total_documents = doc_result.count or 0
    except Exception:
        total_documents = 0

    # ── Total chunks from Pinecone ───────────────────────────────────────
    try:
        pinecone_stats = await get_index_stats()
        total_chunks = pinecone_stats.get("total_vectors", 0)
    except Exception:
        total_chunks = 0

    # ── Query analytics ──────────────────────────────────────────────────
    try:
        query_events = (
            db.table("analytics_events")
            .select("metadata")
            .eq("event_type", "query_executed")
            .execute()
        )
        events = query_events.data or []
        total_queries = len(events)

        # Aggregate latencies and tokens
        retrieval_latencies = []
        generation_latencies = []
        total_tokens = 0
        doc_cite_counts: Dict[str, int] = {}

        for event in events:
            meta = event.get("metadata", {})
            if meta.get("retrieval_latency_ms"):
                retrieval_latencies.append(meta["retrieval_latency_ms"])
            if meta.get("generation_latency_ms"):
                generation_latencies.append(meta["generation_latency_ms"])
            total_tokens += meta.get("tokens_used", 0)

            for doc_name in meta.get("cited_documents", []):
                doc_cite_counts[doc_name] = doc_cite_counts.get(doc_name, 0) + 1

        avg_retrieval = (
            round(sum(retrieval_latencies) / len(retrieval_latencies), 2)
            if retrieval_latencies
            else 0
        )
        avg_generation = (
            round(sum(generation_latencies) / len(generation_latencies), 2)
            if generation_latencies
            else 0
        )

        # Top queried documents
        top_docs = sorted(
            doc_cite_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]
        top_queried_documents = [
            {"name": name, "query_count": count} for name, count in top_docs
        ]

    except Exception as e:
        logger.warning(f"Failed to aggregate query analytics: {e}")
        total_queries = 0
        avg_retrieval = 0
        avg_generation = 0
        total_tokens = 0
        top_queried_documents = []

    # ── Today's queries ──────────────────────────────────────────────────
    queries_today, queries_delta_pct = await _get_daily_query_stats()

    return {
        "total_documents": total_documents,
        "total_chunks": total_chunks,
        "total_queries": total_queries,
        "avg_retrieval_latency_ms": avg_retrieval,
        "avg_generation_latency_ms": avg_generation,
        "total_tokens_used": total_tokens,
        "top_queried_documents": top_queried_documents,
        "queries_today": queries_today,
        "queries_delta_pct": queries_delta_pct,
    }


async def _get_daily_query_stats() -> tuple:
    """Calculate today's query count and percentage change vs yesterday."""
    try:
        db = get_supabase()
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)

        # Today's queries
        today_result = (
            db.table("analytics_events")
            .select("id", count="exact")
            .eq("event_type", "query_executed")
            .gte("created_at", today_start.isoformat())
            .execute()
        )
        queries_today = today_result.count or 0

        # Yesterday's queries
        yesterday_result = (
            db.table("analytics_events")
            .select("id", count="exact")
            .eq("event_type", "query_executed")
            .gte("created_at", yesterday_start.isoformat())
            .lt("created_at", today_start.isoformat())
            .execute()
        )
        queries_yesterday = yesterday_result.count or 0

        # Delta percentage
        if queries_yesterday > 0:
            delta_pct = round(
                ((queries_today - queries_yesterday) / queries_yesterday) * 100, 1
            )
        else:
            delta_pct = 100.0 if queries_today > 0 else 0.0

        return queries_today, delta_pct

    except Exception as e:
        logger.warning(f"Failed to compute daily query stats: {e}")
        return 0, 0.0
