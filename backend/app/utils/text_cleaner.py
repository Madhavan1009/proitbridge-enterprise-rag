"""
Text cleaning utilities.
Normalizes extracted text before chunking.
"""

import re
from typing import Optional

from app.core.logging import get_logger

logger = get_logger(__name__)


def clean_text(text: str) -> str:
    """
    Clean and normalize extracted text.

    Operations:
        1. Normalize Unicode characters
        2. Fix common OCR/extraction artefacts
        3. Collapse excessive whitespace
        4. Remove control characters
        5. Normalize line endings
    """
    if not text:
        return ""

    # Normalize Unicode
    import unicodedata
    text = unicodedata.normalize("NFKC", text)

    # Replace common ligatures and special chars
    replacements = {
        "\u2018": "'",  # Left single quote
        "\u2019": "'",  # Right single quote
        "\u201c": '"',  # Left double quote
        "\u201d": '"',  # Right double quote
        "\u2013": "-",  # En dash
        "\u2014": "-",  # Em dash
        "\u2026": "...",  # Ellipsis
        "\u00a0": " ",  # Non-breaking space
        "\ufeff": "",   # BOM
        "\u200b": "",   # Zero-width space
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Remove control characters (except newlines and tabs)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Collapse multiple blank lines to double newline
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces (preserve single newlines)
    text = re.sub(r"[ \t]+", " ", text)

    # Strip leading/trailing whitespace from each line
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)

    # Remove leading/trailing whitespace
    text = text.strip()

    return text


def remove_headers_footers(text: str, patterns: Optional[list] = None) -> str:
    """
    Remove common header/footer patterns from extracted text.

    Args:
        text: Cleaned text.
        patterns: Optional list of regex patterns to remove.
    """
    default_patterns = [
        r"Page \d+ of \d+",
        r"^\d+$",  # Standalone page numbers
        r"^[-–—]+$",  # Horizontal rules
        r"(?i)^confidential\s*$",
        r"(?i)^draft\s*$",
    ]

    all_patterns = default_patterns + (patterns or [])

    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        if any(re.match(p, line.strip()) for p in all_patterns):
            continue
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)
