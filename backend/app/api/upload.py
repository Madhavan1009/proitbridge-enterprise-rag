"""
Document upload API endpoint.
Handles file upload and triggers the ingestion pipeline.
"""

from fastapi import APIRouter, UploadFile, File

from app.models.response_models import UploadResponse
from app.services.document_service import ingest_document
from app.utils.file_validators import validate_upload
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Upload"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload a document for indexing",
    description=(
        "Upload a document (PDF, DOCX, TXT, MD) to be processed, chunked, "
        "embedded, and indexed in the vector store."
    ),
)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document and trigger the full ingestion pipeline.

    Pipeline:
        1. Validate file (type, size, content)
        2. Extract text
        3. Clean and chunk text
        4. Generate embeddings
        5. Store vectors in Pinecone
        6. Save metadata in Supabase
    """
    # Validate the uploaded file
    validation = await validate_upload(file)

    # Read file content
    file_bytes = await file.read()

    # Execute ingestion pipeline
    result = await ingest_document(
        file_bytes=file_bytes,
        filename=validation["name"],
        file_type=validation["extension"],
        size_bytes=validation["size_bytes"],
    )

    return UploadResponse(
        document_id=result["document_id"],
        name=result["name"],
        chunk_count=result["chunk_count"],
        status=result["status"],
        message=f"Document '{result['name']}' successfully indexed with {result['chunk_count']} chunks.",
    )
