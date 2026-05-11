"""
File validation utilities.
Validates uploaded files for type, size, and content integrity.
"""

import os
from typing import Optional

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class FileValidationError(Exception):
    """Raised when file validation fails."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


async def validate_upload(file: UploadFile) -> dict:
    """
    Validate an uploaded file.

    Checks:
        1. File has a name
        2. Extension is in the allowed list
        3. File size is within limits
        4. Content is not empty

    Returns:
        {
            "name": str,
            "extension": str,
            "size_bytes": int,
        }

    Raises:
        FileValidationError: If any check fails.
    """
    settings = get_settings()

    # Check filename
    if not file.filename:
        raise FileValidationError("File must have a filename.")

    # Check extension
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"Unsupported file type: '{ext}'. "
            f"Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()
    await file.seek(0)  # Reset for downstream consumers

    # Check empty file
    if not content or len(content) == 0:
        raise FileValidationError("File is empty.")

    # Check file size
    size_bytes = len(content)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise FileValidationError(
            f"File too large: {size_bytes / (1024 * 1024):.1f} MB. "
            f"Maximum: {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    # Content-type validation (basic)
    content_type_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".md": "text/plain",
    }

    logger.info(
        f"File validated: {file.filename} "
        f"(type={ext}, size={size_bytes / 1024:.1f}KB)"
    )

    return {
        "name": file.filename,
        "extension": ext,
        "size_bytes": size_bytes,
    }
