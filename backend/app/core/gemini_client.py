"""
Google Gemini LLM client.
Handles both standard generation and streaming responses.
"""

import json
from typing import AsyncGenerator, Dict, List, Optional

import google.generativeai as genai

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_model = None


def _get_model():
    """Return a cached GenerativeModel instance."""
    global _model
    if _model is None:
        settings = get_settings()
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY must be set in the environment.")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config=genai.GenerationConfig(
                max_output_tokens=settings.GEMINI_MAX_OUTPUT_TOKENS,
                temperature=settings.GEMINI_TEMPERATURE,
            ),
        )
        logger.info(f"Gemini model initialized: {settings.GEMINI_MODEL}")
    return _model


async def generate_response(
    system_prompt: str,
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, any]:
    """
    Generate a complete response from Gemini.

    Returns:
        {
            "content": str,
            "tokens_used": int,
        }
    """
    model = _get_model()

    # Build the full prompt with system instructions and context
    contents = []

    if chat_history:
        for msg in chat_history[-6:]:  # Keep last 6 messages for context window
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [msg["content"]]})

    contents.append({"role": "user", "parts": [f"{system_prompt}\n\n{user_message}"]})

    try:
        response = model.generate_content(contents)

        tokens_used = 0
        if response.usage_metadata:
            tokens_used = (
                getattr(response.usage_metadata, "total_token_count", 0)
                or getattr(response.usage_metadata, "candidates_token_count", 0)
            )

        return {
            "content": response.text,
            "tokens_used": tokens_used,
        }
    except Exception as e:
        logger.error(f"Gemini generation failed: {e}")
        raise


async def generate_stream(
    system_prompt: str,
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> AsyncGenerator[str, None]:
    """
    Stream tokens from Gemini as Server-Sent Events.

    Yields SSE-formatted strings:
        data: {"token": "...", "done": false}
    """
    model = _get_model()

    contents = []

    if chat_history:
        for msg in chat_history[-6:]:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [msg["content"]]})

    contents.append({"role": "user", "parts": [f"{system_prompt}\n\n{user_message}"]})

    try:
        response = model.generate_content(contents, stream=True)

        full_text = ""
        for chunk in response:
            if chunk.text:
                full_text += chunk.text
                event = json.dumps({"token": chunk.text, "done": False})
                yield f"data: {event}\n\n"

        # Final event with completion signal
        final_event = json.dumps({"token": "", "done": True, "full_text": full_text})
        yield f"data: {final_event}\n\n"

    except Exception as e:
        logger.error(f"Gemini streaming failed: {e}")
        error_event = json.dumps({"error": str(e), "done": True})
        yield f"data: {error_event}\n\n"
