"""
Citation builder.
Extracts structured citations from retrieved chunks for the API response.
"""

from typing import Any, Dict, List

from app.core.logging import get_logger

logger = get_logger(__name__)


def build_citations(
    retrieved_chunks: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Build structured citation objects from retrieved chunks.

    Each citation contains:
        - doc: document filename
        - page: page number (nullable)
        - chunk: chunk section title or index
        - score: similarity score

    Args:
        retrieved_chunks: Reranked list of chunk dicts.

    Returns:
        List of citation dicts matching the frontend CitationResponse format.
    """
    citations = []

    for chunk in retrieved_chunks:
        metadata = chunk.get("metadata", {})
        doc_name = metadata.get("document_name", "Unknown Document")
        page_number = metadata.get("page_number")
        chunk_index = metadata.get("chunk_index", 0)
        score = chunk.get("score", 0.0)

        # Derive a human-readable chunk title from the text
        chunk_title = _derive_chunk_title(
            chunk.get("text", ""),
            chunk_index,
            doc_name,
        )

        citations.append(
            {
                "doc": doc_name,
                "page": page_number,
                "chunk": chunk_title,
                "score": round(score, 2),
            }
        )

    logger.info(f"Built {len(citations)} citations")
    return citations


def _derive_chunk_title(text: str, chunk_index: int, doc_name: str) -> str:
    """
    Extract a meaningful title from the chunk text.
    Uses the first line if it looks like a heading, otherwise falls back
    to a generic label.
    """
    if not text:
        return f"Section {chunk_index + 1}"

    first_line = text.strip().split("\n")[0].strip()

    # If the first line is short and looks like a heading, use it
    if (
        len(first_line) <= 80
        and not first_line.endswith(".")
        and len(first_line.split()) <= 12
    ):
        # Clean markdown heading markers
        clean = first_line.lstrip("#").strip()
        if clean:
            return clean

    # Fall back to first N words of the chunk
    words = text.strip().split()[:6]
    preview = " ".join(words)
    if len(words) >= 6:
        preview += "..."

    return preview or f"Section {chunk_index + 1}"
