"""
Token counting utilities.
Estimates token counts for cost tracking and context window management.
"""

import re
from typing import List

from app.core.logging import get_logger

logger = get_logger(__name__)


def estimate_tokens(text: str) -> int:
    """
    Estimate the number of tokens in a text string.

    Uses a simple heuristic: ~4 characters per token (GPT/Gemini average).
    For precise counts, use tiktoken or the model's tokenizer.
    """
    if not text:
        return 0

    # Simple word-based estimation
    words = len(re.findall(r"\S+", text))
    chars = len(text)

    # Weighted average of word-based and char-based estimates
    word_estimate = int(words * 1.3)
    char_estimate = int(chars / 4)

    return (word_estimate + char_estimate) // 2


def estimate_chunk_tokens(chunks: List[str]) -> int:
    """Estimate total tokens across a list of text chunks."""
    return sum(estimate_tokens(chunk) for chunk in chunks)


def check_context_window(
    system_prompt: str,
    context: str,
    query: str,
    max_tokens: int = 128000,
) -> dict:
    """
    Check whether the assembled prompt fits within the model context window.

    Returns:
        {
            "fits": bool,
            "estimated_tokens": int,
            "max_tokens": int,
            "utilization_pct": float,
        }
    """
    total = (
        estimate_tokens(system_prompt)
        + estimate_tokens(context)
        + estimate_tokens(query)
    )

    utilization = round((total / max_tokens) * 100, 1) if max_tokens > 0 else 0

    return {
        "fits": total < max_tokens,
        "estimated_tokens": total,
        "max_tokens": max_tokens,
        "utilization_pct": utilization,
    }
