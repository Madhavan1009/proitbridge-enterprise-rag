"""
Health check API endpoint.
Reports the status of all connected services.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.models.response_models import HealthResponse
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check the health of all backend services.",
)
async def health_check():
    """
    Returns the health status of:
    - API server
    - Pinecone vector store
    - Supabase database
    - Gemini LLM
    """
    settings = get_settings()
    services = {}

    # Check Pinecone
    try:
        from app.core.pinecone_client import get_pinecone_index
        index = get_pinecone_index()
        stats = index.describe_index_stats()
        services["pinecone"] = f"connected ({stats.total_vector_count} vectors)"
    except Exception as e:
        services["pinecone"] = f"error: {str(e)[:80]}"

    # Check Supabase
    try:
        from app.core.database import get_supabase
        db = get_supabase()
        db.table("documents").select("id").limit(1).execute()
        services["supabase"] = "connected"
    except Exception as e:
        services["supabase"] = f"error: {str(e)[:80]}"

    # Check Gemini
    try:
        import google.generativeai as genai
        if settings.GEMINI_API_KEY:
            services["gemini"] = f"configured ({settings.GEMINI_MODEL})"
        else:
            services["gemini"] = "not configured"
    except Exception as e:
        services["gemini"] = f"error: {str(e)[:80]}"

    # Check embedding model
    try:
        from app.rag.embeddings import _get_model
        model = _get_model()
        services["embeddings"] = f"loaded ({settings.EMBEDDING_MODEL})"
    except Exception as e:
        services["embeddings"] = f"not loaded: {str(e)[:80]}"

    # Overall status
    all_ok = all("error" not in v and "not " not in v for v in services.values())

    return HealthResponse(
        status="healthy" if all_ok else "degraded",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        services=services,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
