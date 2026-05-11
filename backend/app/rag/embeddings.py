"""
Embedding generation using BAAI/bge-small-en-v1.5.
Provides both document and query embedding with the appropriate prefix.
"""

from typing import List, Optional

from sentence_transformers import SentenceTransformer

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    """Return a cached SentenceTransformer model."""
    global _model
    if _model is None:
        settings = get_settings()
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info(
            f"Embedding model loaded — dimension: {_model.get_sentence_embedding_dimension()}"
        )
    return _model


def generate_embeddings(texts: List[str], is_query: bool = False) -> List[List[float]]:
    """
    Generate embeddings for a list of texts.

    For BGE models, queries should be prefixed with
    "Represent this sentence for searching relevant passages: "
    to improve retrieval quality.

    Args:
        texts: List of text strings to embed.
        is_query: If True, apply the BGE query prefix.

    Returns:
        List of embedding vectors (each a list of floats).
    """
    model = _get_model()

    if is_query:
        # BGE query instruction prefix for optimal retrieval
        texts = [
            f"Represent this sentence for searching relevant passages: {t}"
            for t in texts
        ]

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
        batch_size=32,
    )

    logger.info(
        f"Generated {len(embeddings)} embeddings "
        f"(query={is_query}, dim={len(embeddings[0])})"
    )
    return [emb.tolist() for emb in embeddings]


def generate_single_embedding(text: str, is_query: bool = False) -> List[float]:
    """Generate an embedding for a single text string."""
    return generate_embeddings([text], is_query=is_query)[0]
