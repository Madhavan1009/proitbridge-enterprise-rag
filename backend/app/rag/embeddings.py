"""
Embedding generation using Google Gemini's Cloud Embedding API.
This replaces the local SentenceTransformer to save RAM and allow 
deployment on Render's 512MB free tier.
"""

import time
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
    
    try:
        # Process in batches to avoid rate limit (429 ResourceExhausted) on free tier
        batch_size = 90  # Keep it slightly below 100 just to be safe
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            
            response = genai.embed_content(
                model=settings.EMBEDDING_MODEL,
                content=batch_texts,
                task_type=task_type,
                output_dimensionality=settings.EMBEDDING_DIMENSION
            )
            
            # response['embedding'] returns a list of embeddings when content is a list of strings
            embeddings.extend(response['embedding'])
            
            if i + batch_size < len(texts):
                # Small sleep between batches to avoid rapid burst rate limits
                time.sleep(1)
            
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
