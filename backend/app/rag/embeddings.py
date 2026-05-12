"""
Embedding generation using Google Gemini's Cloud Embedding API.
This replaces the local SentenceTransformer to save RAM and allow 
deployment on Render's 512MB free tier.
"""

from typing import List
import google.generativeai as genai

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

def generate_embeddings(texts: List[str], is_query: bool = False) -> List[List[float]]:
    """
    Generate embeddings using Gemini's text-embedding-004 model.
    """
    settings = get_settings()
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    # "retrieval_query" or "retrieval_document" task type
    task_type = "retrieval_query" if is_query else "retrieval_document"
    
    embeddings = []
    
    # Process in chunks to avoid API limits if texts is large
    # For small arrays, just process them directly.
    try:
        for text in texts:
            # For Gemini embedding, text must be string
            response = genai.embed_content(
                model=settings.EMBEDDING_MODEL,
                content=text,
                task_type=task_type,
                output_dimensionality=settings.EMBEDDING_DIMENSION
            )
            embeddings.append(response['embedding'])
            
        logger.info(
            f"Generated {len(embeddings)} embeddings "
            f"(query={is_query}, dim={len(embeddings[0]) if embeddings else 0})"
        )
        return embeddings
    except Exception as e:
        logger.error(f"Failed to generate Gemini embeddings: {e}")
        raise

def generate_single_embedding(text: str, is_query: bool = False) -> List[float]:
    """Generate an embedding for a single text string."""
    return generate_embeddings([text], is_query=is_query)[0]
