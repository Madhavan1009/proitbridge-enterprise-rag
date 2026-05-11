"""
Centralized error handler.
Catches all unhandled exceptions and returns structured error responses.
"""

import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.utils.file_validators import FileValidationError

logger = logging.getLogger("app.middleware.error_handler")


def register_error_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    @app.exception_handler(FileValidationError)
    async def file_validation_handler(
        request: Request, exc: FileValidationError
    ) -> JSONResponse:
        logger.warning(f"File validation error: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "File Validation Error",
                "detail": exc.message,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(
        request: Request, exc: ValueError
    ) -> JSONResponse:
        logger.warning(f"Value error: {exc}")
        return JSONResponse(
            status_code=400,
            content={
                "error": "Bad Request",
                "detail": str(exc),
                "status_code": 400,
            },
        )

    @app.exception_handler(RuntimeError)
    async def runtime_error_handler(
        request: Request, exc: RuntimeError
    ) -> JSONResponse:
        logger.error(f"Runtime error: {exc}")
        return JSONResponse(
            status_code=503,
            content={
                "error": "Service Unavailable",
                "detail": str(exc),
                "status_code": 503,
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(
            f"Unhandled exception: {exc}\n{traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": "An unexpected error occurred. Please try again.",
                "status_code": 500,
            },
        )
