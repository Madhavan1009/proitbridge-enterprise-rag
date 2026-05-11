"""
Vector retriever.
Generates query embeddings and performs similarity search against Pinecone.
"""

import time
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.core.pinecone_client import query_vectors
from app.core.logging import get_logger
from app.rag.embeddings import generate_single_embedding

logger = get_logger(__name__)


async def retrieve_chunks(
    query: str,
    top_k: Optional[int] = None,
    filter_dict: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Retrieve the most relevant document chunks for a given query.

    Pipeline:
        1. Generate query embedding (with BGE query prefix)
        2. Search Pinecone for top-k similar vectors
        3. Return ranked results with metadata and latency

    Returns:
        {
            "chunks": [
                {
                    "text": "...",
                    "metadata": {...},
                    "score": 0.95,
                }
            ],
            "latency_ms": 142.3,
        }
    """
    settings = get_settings()
    k = top_k or settings.TOP_K

    start = time.perf_counter()

    # Step 1: Generate query embedding
    query_embedding = generate_single_embedding(query, is_query=True)

    # Step 2: Pinecone similarity search
    matches = await query_vectors(
        query_embedding=query_embedding,
        top_k=k,
        filter_dict=filter_dict,
        include_metadata=True,
    )

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    # Step 3: Filter by similarity threshold and structure results
    threshold = settings.SIMILARITY_THRESHOLD
    chunks = []
    for match in matches:
        if match["score"] >= threshold:
            chunks.append(
                {
                    "text": match["metadata"].get("text", ""),
                    "metadata": {
                        k: v
                        for k, v in match["metadata"].items()
                        if k != "text"  # Don't duplicate the text field
                    },
                    "score": match["score"],
                }
            )

    logger.info(
        f"Retrieved {len(chunks)} chunks for query (latency={elapsed_ms}ms, "
        f"threshold={threshold})",
        extra={"duration_ms": elapsed_ms},
    )

    return {
        "chunks": chunks,
        "latency_ms": elapsed_ms,
    }
