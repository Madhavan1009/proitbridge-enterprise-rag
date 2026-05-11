"""
Pydantic request models for API validation.
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for the /api/chat endpoint."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=4096,
        description="The user's question to ask the knowledge base.",
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Session identifier for chat history continuity.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of chunks to retrieve from the vector store.",
    )
    temperature: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="LLM temperature for response generation.",
    )
    stream: bool = Field(
        default=False,
        description="Whether to stream the response via SSE.",
    )


class ChatHistoryRequest(BaseModel):
    """Request body for retrieving chat history."""

    session_id: str = Field(
        ...,
        description="Session identifier to retrieve history for.",
    )
    limit: int = Field(
        default=50,
        ge=1,
        le=200,
        description="Maximum number of messages to retrieve.",
    )


class DocumentDeleteRequest(BaseModel):
    """Request body for bulk document deletion."""

    document_ids: List[str] = Field(
        ...,
        min_length=1,
        description="List of document IDs to delete.",
    )
