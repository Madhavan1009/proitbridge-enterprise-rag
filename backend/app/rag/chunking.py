"""
Document chunking using LangChain's RecursiveCharacterTextSplitter.
Produces metadata-rich chunks ready for embedding and vector storage.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def create_chunks(
    text: str,
    document_id: str,
    document_name: str,
    page_numbers: Dict[int, int] | None = None,
) -> List[Dict[str, Any]]:
    """
    Split text into overlapping chunks with rich metadata.

    Args:
        text: The full extracted text from the document.
        document_id: UUID of the document record.
        document_name: Original filename.
        page_numbers: Optional mapping of character offset → page number.

    Returns:
        A list of chunk dicts, each containing:
            - chunk_id: unique identifier
            - text: the chunk content
            - metadata: document_id, document_name, page_number, chunk_index, uploaded_at
    """
    settings = get_settings()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
        is_separator_regex=False,
    )

    raw_chunks = splitter.split_text(text)
    now = datetime.now(timezone.utc).isoformat()

    chunks = []
    current_offset = 0

    for idx, chunk_text in enumerate(raw_chunks):
        # Determine page number from character offset map
        page_number = _resolve_page_number(current_offset, page_numbers)

        chunk_id = f"{document_id}::chunk::{idx}"

        chunks.append(
            {
                "chunk_id": chunk_id,
                "text": chunk_text,
                "metadata": {
                    "document_id": document_id,
                    "document_name": document_name,
                    "page_number": page_number,
                    "chunk_index": idx,
                    "uploaded_at": now,
                    "text": chunk_text,  # Store text in metadata for retrieval
                },
            }
        )

        # Advance offset (account for overlap)
        current_offset += len(chunk_text) - settings.CHUNK_OVERLAP

    logger.info(
        f"Chunked '{document_name}' into {len(chunks)} chunks "
        f"(size={settings.CHUNK_SIZE}, overlap={settings.CHUNK_OVERLAP})"
    )
    return chunks


def _resolve_page_number(
    offset: int, page_numbers: Dict[int, int] | None
) -> int | None:
    """Map a character offset to its source page number."""
    if not page_numbers:
        return None

    resolved = None
    for char_offset, page in sorted(page_numbers.items()):
        if char_offset <= offset:
            resolved = page
        else:
            break
    return resolved
