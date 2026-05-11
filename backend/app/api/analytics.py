"""
Analytics API endpoint.
Returns aggregated platform metrics.
"""

from fastapi import APIRouter

from app.models.response_models import AnalyticsResponse
from app.services.analytics_service import get_analytics
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Get platform analytics",
    description="Retrieve aggregated analytics metrics for the dashboard.",
)
async def analytics():
    """
    Return aggregated analytics metrics including:
    - Document and chunk counts
    - Query volume and trends
    - Average latencies
    - Token usage
    - Top queried documents
    """
    data = await get_analytics()
    return AnalyticsResponse(**data)
