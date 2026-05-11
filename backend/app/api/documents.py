"""
Documents API endpoint.
List and delete documents in the knowledge base.
"""

from fastapi import APIRouter, HTTPException

from app.models.response_models import DocumentListResponse, DocumentResponse, SuccessResponse
from app.services.document_service import list_documents, get_document, delete_document
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Documents"])


@router.get(
    "/documents",
    response_model=DocumentListResponse,
    summary="List all documents",
    description="Retrieve all documents in the knowledge base.",
)
async def get_documents():
    """List all uploaded documents with their status and metadata."""
    docs = await list_documents()

    documents = [
        DocumentResponse(
            id=doc["id"],
            name=doc["name"],
            file_type=doc["file_type"],
            size_bytes=doc["size_bytes"],
            chunk_count=doc.get("chunk_count", 0),
            status=doc.get("status", "unknown"),
            uploaded_at=doc.get("uploaded_at", ""),
        )
        for doc in docs
    ]

    return DocumentListResponse(documents=documents, total=len(documents))


@router.delete(
    "/documents/{document_id}",
    response_model=SuccessResponse,
    summary="Delete a document",
    description="Delete a document and its vectors from the knowledge base.",
)
async def remove_document(document_id: str):
    """
    Delete a document by ID.
    Removes the document record from Supabase and its vectors from Pinecone.
    """
    # Verify document exists
    doc = await get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    await delete_document(document_id)

    return SuccessResponse(
        message=f"Document '{doc['name']}' deleted successfully.",
        data={"document_id": document_id},
    )
