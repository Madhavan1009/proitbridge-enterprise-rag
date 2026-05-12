"""
Pinecone vector database client.
Manages connection lifecycle, upsert, query, and delete operations.
"""

from typing import Dict, List, Optional, Any

from pinecone import Pinecone, ServerlessSpec

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_index = None


def get_pinecone_index():
    """Return a cached Pinecone index handle."""
    global _index
    if _index is None:
        settings = get_settings()
        if not settings.PINECONE_API_KEY:
            raise RuntimeError("PINECONE_API_KEY must be set in the environment.")

        pc = Pinecone(api_key=settings.PINECONE_API_KEY)



        _index = pc.Index(settings.PINECONE_INDEX_NAME)
        stats = _index.describe_index_stats()
        logger.info(
            f"Pinecone index connected — {stats.total_vector_count} vectors stored"
        )

    return _index


async def upsert_vectors(
    vectors: List[Dict[str, Any]],
    namespace: str = "",
    batch_size: int = 100,
) -> int:
    """
    Upsert vectors into Pinecone in batches.

    Each vector dict must contain:
        - id: str
        - values: List[float]
        - metadata: Dict[str, Any]
    """
    index = get_pinecone_index()
    total_upserted = 0

    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)
        total_upserted += len(batch)
        logger.debug(f"Upserted batch {i // batch_size + 1}: {len(batch)} vectors")

    logger.info(f"Upserted {total_upserted} vectors to Pinecone")
    return total_upserted


async def query_vectors(
    query_embedding: List[float],
    top_k: int = 5,
    namespace: str = "",
    filter_dict: Optional[Dict[str, Any]] = None,
    include_metadata: bool = True,
) -> List[Dict[str, Any]]:
    """
    Query Pinecone for the top-k most similar vectors.
    Returns a list of match dicts with id, score, and metadata.
    """
    index = get_pinecone_index()

    query_params = {
        "vector": query_embedding,
        "top_k": top_k,
        "namespace": namespace,
        "include_metadata": include_metadata,
    }
    if filter_dict:
        query_params["filter"] = filter_dict

    results = index.query(**query_params)

    matches = []
    for match in results.get("matches", []):
        matches.append(
            {
                "id": match["id"],
                "score": round(match["score"], 4),
                "metadata": match.get("metadata", {}),
            }
        )

    logger.info(
        f"Pinecone query returned {len(matches)} matches (top_k={top_k})"
    )
    return matches


async def delete_vectors(
    ids: Optional[List[str]] = None,
    namespace: str = "",
    filter_dict: Optional[Dict[str, Any]] = None,
    delete_all: bool = False,
) -> None:
    """Delete vectors from Pinecone by IDs, filter, or all."""
    index = get_pinecone_index()

    if delete_all:
        index.delete(delete_all=True, namespace=namespace)
        logger.info("Deleted all vectors from Pinecone")
    elif ids:
        index.delete(ids=ids, namespace=namespace)
        logger.info(f"Deleted {len(ids)} vectors from Pinecone")
    elif filter_dict:
        index.delete(filter=filter_dict, namespace=namespace)
        logger.info(f"Deleted vectors matching filter from Pinecone")


async def get_index_stats() -> Dict[str, Any]:
    """Return Pinecone index statistics."""
    index = get_pinecone_index()
    stats = index.describe_index_stats()
    return {
        "total_vectors": stats.total_vector_count,
        "dimension": stats.dimension,
        "namespaces": dict(stats.namespaces) if stats.namespaces else {},
    }
