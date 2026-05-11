"""
Chat API endpoint.
Handles user queries with both standard and streaming responses.
"""

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.models.request_models import ChatRequest
from app.models.response_models import ChatResponse
from app.services.query_service import process_query, process_query_stream
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask the AI Knowledge Assistant",
    description="Submit a query to the RAG pipeline. Returns a grounded answer with source citations.",
)
async def chat(request: ChatRequest):
    """
    Process a user query through the RAG pipeline.

    The endpoint supports two modes:
    - **Standard**: Returns a complete JSON response with answer and citations.
    - **Streaming**: Returns an SSE stream of tokens (set `stream: true`).
    """
    if request.stream:
        return StreamingResponse(
            process_query_stream(
                query=request.query,
                session_id=request.session_id,
                top_k=request.top_k,
                temperature=request.temperature,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    result = await process_query(
        query=request.query,
        session_id=request.session_id,
        top_k=request.top_k,
        temperature=request.temperature,
    )

    return ChatResponse(**result)
