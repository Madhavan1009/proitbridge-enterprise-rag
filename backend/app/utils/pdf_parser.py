"""
PDF text extraction using PyPDF2.
Extracts text with page-level granularity for citation mapping.
"""

from typing import Any, Dict, Tuple

from app.core.logging import get_logger

logger = get_logger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, Dict[int, int]]:
    """
    Extract text from a PDF file.

    Args:
        file_bytes: Raw PDF file bytes.

    Returns:
        Tuple of:
            - full_text: Complete extracted text
            - page_offsets: Mapping of character offset → page number
    """
    import io
    from PyPDF2 import PdfReader

    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = ""
    page_offsets: Dict[int, int] = {}

    for page_num, page in enumerate(reader.pages, 1):
        page_text = page.extract_text() or ""
        if page_text.strip():
            page_offsets[len(full_text)] = page_num
            full_text += page_text + "\n\n"

    logger.info(
        f"Extracted {len(full_text)} chars from PDF ({len(reader.pages)} pages)"
    )
    return full_text, page_offsets


def extract_text_from_docx(file_bytes: bytes) -> Tuple[str, Dict[int, int]]:
    """
    Extract text from a DOCX file.

    Returns:
        Tuple of full_text and empty page_offsets (DOCX lacks page info).
    """
    import io
    import docx

    doc = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full_text = "\n\n".join(paragraphs)

    logger.info(
        f"Extracted {len(full_text)} chars from DOCX ({len(paragraphs)} paragraphs)"
    )
    return full_text, {}


def extract_text_from_txt(file_bytes: bytes) -> Tuple[str, Dict[int, int]]:
    """Extract text from a plain text or markdown file."""
    full_text = file_bytes.decode("utf-8", errors="replace")
    logger.info(f"Extracted {len(full_text)} chars from text file")
    return full_text, {}


def extract_text(file_bytes: bytes, file_type: str) -> Tuple[str, Dict[int, int]]:
    """
    Route text extraction to the appropriate parser based on file type.

    Args:
        file_bytes: Raw file bytes.
        file_type: File extension (e.g., '.pdf', '.docx', '.txt', '.md').

    Returns:
        Tuple of full_text and page_offsets.
    """
    extractors = {
        ".pdf": extract_text_from_pdf,
        ".docx": extract_text_from_docx,
        ".txt": extract_text_from_txt,
        ".md": extract_text_from_txt,
    }

    extractor = extractors.get(file_type.lower())
    if not extractor:
        raise ValueError(f"Unsupported file type: {file_type}")

    return extractor(file_bytes)
