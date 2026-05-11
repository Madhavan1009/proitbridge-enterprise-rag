"""
Document service.
Handles the full document ingestion pipeline:
    Upload → Validate → Extract → Clean → Chunk → Embed → Store.
"""

import time
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.core.database import get_supabase
from app.core.pinecone_client import upsert_vectors, delete_vectors
from app.core.logging import get_logger
from app.models.database_models import create_document_record, create_analytics_event
from app.rag.chunking import create_chunks
from app.rag.embeddings import generate_embeddings
from app.utils.pdf_parser import extract_text
from app.utils.text_cleaner import clean_text, remove_headers_footers

logger = get_logger(__name__)


async def ingest_document(
    file_bytes: bytes,
    filename: str,
    file_type: str,
    size_bytes: int,
) -> Dict[str, Any]:
    """
    Execute the full document ingestion pipeline.

    Steps:
        1. Create document record in Supabase (status: processing)
        2. Extract text from file
        3. Clean extracted text
        4. Chunk text with metadata
        5. Generate embeddings for all chunks
        6. Upsert vectors to Pinecone
        7. Update document record (status: indexed)
        8. Log analytics event

    Returns:
        {
            "document_id": str,
            "name": str,
            "chunk_count": int,
            "status": str,
        }
    """
    pipeline_start = time.perf_counter()

    # Step 1: Create document record
    doc_record = create_document_record(
        name=filename,
        file_type=file_type,
        size_bytes=size_bytes,
        status="processing",
    )
    document_id = doc_record["id"]

    db = get_supabase()
    try:
        db.table("documents").insert(doc_record).execute()
    except Exception as e:
        logger.error(f"Failed to create document record: {e}")
        raise

    logger.info(
        f"Ingestion started: {filename} (id={document_id})",
        extra={"document_id": document_id},
    )

    try:
        # Step 2: Extract text
        full_text, page_offsets = extract_text(file_bytes, file_type)

        if not full_text.strip():
            await _update_document_status(document_id, "error", 0)
            raise ValueError(f"No text could be extracted from {filename}")

        # Step 3: Clean text
        cleaned_text = clean_text(full_text)
        cleaned_text = remove_headers_footers(cleaned_text)

        # Step 4: Chunk text
        chunks = create_chunks(
            text=cleaned_text,
            document_id=document_id,
            document_name=filename,
            page_numbers=page_offsets,
        )

        if not chunks:
            await _update_document_status(document_id, "error", 0)
            raise ValueError(f"No chunks generated from {filename}")

        # Step 5: Generate embeddings
        chunk_texts = [c["text"] for c in chunks]
        embeddings = generate_embeddings(chunk_texts, is_query=False)

        # Step 6: Upsert vectors to Pinecone
        vectors = []
        for chunk, embedding in zip(chunks, embeddings):
            vectors.append(
                {
                    "id": chunk["chunk_id"],
                    "values": embedding,
                    "metadata": chunk["metadata"],
                }
            )

        await upsert_vectors(vectors)

        # Step 7: Update document status
        chunk_count = len(chunks)
        await _update_document_status(document_id, "indexed", chunk_count)

        # Step 8: Log analytics event
        elapsed_ms = round((time.perf_counter() - pipeline_start) * 1000, 2)
        _log_ingestion_event(document_id, filename, chunk_count, elapsed_ms)

        logger.info(
            f"Ingestion complete: {filename} — "
            f"{chunk_count} chunks in {elapsed_ms}ms",
            extra={"document_id": document_id, "duration_ms": elapsed_ms},
        )

        return {
            "document_id": document_id,
            "name": filename,
            "chunk_count": chunk_count,
            "status": "indexed",
        }

    except Exception as e:
        logger.error(
            f"Ingestion failed for {filename}: {e}",
            extra={"document_id": document_id},
        )
        await _update_document_status(document_id, "error", 0)
        raise


async def list_documents() -> List[Dict[str, Any]]:
    """Retrieve all documents from Supabase, ordered by upload date."""
    db = get_supabase()
    result = (
        db.table("documents")
        .select("*")
        .order("uploaded_at", desc=True)
        .execute()
    )
    return result.data or []


async def get_document(document_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single document by ID."""
    db = get_supabase()
    result = (
        db.table("documents")
        .select("*")
        .eq("id", document_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


async def delete_document(document_id: str) -> bool:
    """
    Delete a document and its vectors.

    Steps:
        1. Delete vectors from Pinecone (by document_id filter)
        2. Delete document record from Supabase
    """
    db = get_supabase()

    # Delete vectors from Pinecone
    try:
        await delete_vectors(
            filter_dict={"document_id": {"$eq": document_id}}
        )
    except Exception as e:
        logger.warning(f"Failed to delete Pinecone vectors for {document_id}: {e}")

    # Delete from Supabase
    try:
        db.table("documents").delete().eq("id", document_id).execute()
        logger.info(f"Document deleted: {document_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {e}")
        raise


async def _update_document_status(
    document_id: str, status: str, chunk_count: int
) -> None:
    """Update a document's status and chunk count in Supabase."""
    db = get_supabase()
    from datetime import datetime, timezone

    db.table("documents").update(
        {
            "status": status,
            "chunk_count": chunk_count,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", document_id).execute()


def _log_ingestion_event(
    document_id: str, filename: str, chunk_count: int, elapsed_ms: float
) -> None:
    """Log a document ingestion analytics event."""
    try:
        db = get_supabase()
        event = create_analytics_event(
            event_type="document_ingested",
            metadata={
                "document_id": document_id,
                "document_name": filename,
                "chunk_count": chunk_count,
                "processing_time_ms": elapsed_ms,
            },
        )
        db.table("analytics_events").insert(event).execute()
    except Exception as e:
        logger.warning(f"Failed to log ingestion event: {e}")
