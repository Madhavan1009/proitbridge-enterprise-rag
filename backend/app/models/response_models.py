"""
Pydantic response models for API serialization.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime

from pydantic import BaseModel, Field


# ─── Citations ───────────────────────────────────────────────────────────────

class CitationResponse(BaseModel):
    """A single source citation returned with an AI response."""

    doc: str = Field(..., description="Source document name.")
    page: Optional[int] = Field(None, description="Page number in the source document.")
    chunk: str = Field(..., description="Chunk title or section reference.")
    score: float = Field(..., description="Similarity score (0-1).")


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatResponse(BaseModel):
    """Response body for the /api/chat endpoint."""

    answer: str = Field(..., description="The AI-generated answer.")
    citations: List[CitationResponse] = Field(
        default_factory=list,
        description="Source citations supporting the answer.",
    )
    latency_ms: float = Field(..., description="Total response latency in milliseconds.")
    tokens_used: int = Field(default=0, description="Total tokens consumed.")
    session_id: str = Field(..., description="Session identifier for chat continuity.")


# ─── Documents ───────────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    """A single document in the knowledge base."""

    id: str
    name: str
    file_type: str
    size_bytes: int
    chunk_count: int
    status: str
    uploaded_at: str


class DocumentListResponse(BaseModel):
    """Response body for the /api/documents endpoint."""

    documents: List[DocumentResponse]
    total: int


class UploadResponse(BaseModel):
    """Response body for the /api/upload endpoint."""

    document_id: str
    name: str
    chunk_count: int
    status: str
    message: str


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsResponse(BaseModel):
    """Response body for the /api/analytics endpoint."""

    total_documents: int
    total_chunks: int
    total_queries: int
    avg_retrieval_latency_ms: float
    avg_generation_latency_ms: float
    total_tokens_used: int
    top_queried_documents: List[Dict[str, Any]]
    queries_today: int
    queries_delta_pct: float


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Response body for the /api/health endpoint."""

    status: str
    version: str
    environment: str
    services: Dict[str, str]
    timestamp: str


# ─── Generic ─────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    detail: Optional[str] = None
    status_code: int


class SuccessResponse(BaseModel):
    """Generic success response."""

    message: str
    data: Optional[Dict[str, Any]] = None
