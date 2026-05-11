"""
Chunk reranker.
Applies score-based reranking and deduplication to retrieved chunks.
"""

from typing import Any, Dict, List

from app.core.logging import get_logger

logger = get_logger(__name__)


def rerank_chunks(
    chunks: List[Dict[str, Any]],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Rerank retrieved chunks using a composite scoring strategy.

    Strategy:
        1. Sort by similarity score (primary)
        2. Apply diversity penalty for same-document clusters
        3. Deduplicate near-identical chunks
        4. Return top-k results

    Args:
        chunks: List of chunk dicts with 'text', 'metadata', and 'score'.
        top_k: Maximum number of chunks to return.

    Returns:
        Reranked and deduplicated list of chunks.
    """
    if not chunks:
        return []

    # Step 1: Deduplicate near-identical chunks
    seen_texts = set()
    unique_chunks = []
    for chunk in chunks:
        text_fingerprint = chunk["text"][:200].strip().lower()
        if text_fingerprint not in seen_texts:
            seen_texts.add(text_fingerprint)
            unique_chunks.append(chunk)

    # Step 2: Apply diversity penalty
    # Penalize consecutive chunks from the same document to promote diversity
    doc_counts: Dict[str, int] = {}
    for chunk in unique_chunks:
        doc_name = chunk["metadata"].get("document_name", "unknown")
        doc_counts[doc_name] = doc_counts.get(doc_name, 0) + 1

        # Apply a small penalty for repeated document sources
        occurrence = doc_counts[doc_name]
        if occurrence > 2:
            diversity_penalty = 0.02 * (occurrence - 2)
            chunk["score"] = max(0, chunk["score"] - diversity_penalty)

    # Step 3: Sort by adjusted score
    unique_chunks.sort(key=lambda c: c["score"], reverse=True)

    result = unique_chunks[:top_k]

    logger.info(
        f"Reranked {len(chunks)} → {len(result)} chunks "
        f"(deduplicated {len(chunks) - len(unique_chunks)})"
    )

    return result
