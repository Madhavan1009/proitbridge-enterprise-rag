"""
Prompt builder for the RAG pipeline.
Constructs the system prompt and contextualised user message.
"""

from typing import Any, Dict, List

from app.core.logging import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are an enterprise AI knowledge assistant designed to answer questions using retrieved organizational knowledge.

Use the retrieved context as the primary source of truth.

Guidelines:
- Provide accurate, grounded, and context-aware responses
- Adjust response length and depth based on the complexity of the question
- For simple questions, answer briefly and directly
- For complex or technical questions, provide structured explanations
- Synthesize information naturally instead of copying raw context
- Maintain a professional and conversational tone
- Use bullet points or sections when clarity improves readability
- Preserve technical accuracy and important terminology

If relevant information exists in the retrieved context:
- answer confidently using that information
- include citations or references when available

If information is partially available:
- answer using the available context
- clearly mention missing or uncertain details

If the answer cannot be found in the retrieved context:
- clearly state that the information is unavailable in the current knowledge base
- do not invent or hallucinate information"""


def build_prompt(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
) -> Dict[str, str]:
    """
    Build the system prompt and contextualised user message.

    Args:
        query: The user's question.
        retrieved_chunks: List of chunk dicts with 'text' and 'metadata'.

    Returns:
        {
            "system_prompt": str,
            "user_message": str,
        }
    """
    # Build context section from retrieved chunks
    context_parts = []
    for idx, chunk in enumerate(retrieved_chunks, 1):
        doc_name = chunk["metadata"].get("document_name", "Unknown")
        page = chunk["metadata"].get("page_number")
        score = chunk.get("score", 0)

        header = f"[Source {idx}: {doc_name}"
        if page is not None:
            header += f", Page {page}"
        header += f", Relevance: {score:.0%}]"

        context_parts.append(f"{header}\n{chunk['text']}")

    context_block = "\n\n---\n\n".join(context_parts)

    user_message = f"""## Retrieved Context

{context_block}

---

## User Question

{query}

Please answer the question using the retrieved context above. Reference specific sources when possible."""

    logger.info(
        f"Built prompt with {len(retrieved_chunks)} context chunks "
        f"({len(context_block)} chars)"
    )

    return {
        "system_prompt": SYSTEM_PROMPT,
        "user_message": user_message,
    }
