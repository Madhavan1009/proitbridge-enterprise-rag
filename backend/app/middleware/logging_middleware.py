"""
Request/response logging middleware.
Logs method, path, status code, and latency for every request.
"""

import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("app.middleware.logging")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request with timing information."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        method = request.method
        path = request.url.path

        # Skip health check noise
        if path == "/api/health":
            return await call_next(request)

        try:
            response = await call_next(request)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

            logger.info(
                f"{method} {path} → {response.status_code} ({elapsed_ms}ms)",
                extra={
                    "method": method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": elapsed_ms,
                },
            )
            return response

        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error(
                f"{method} {path} → 500 ({elapsed_ms}ms) — {exc}",
                extra={
                    "method": method,
                    "path": path,
                    "status_code": 500,
                    "duration_ms": elapsed_ms,
                },
            )
            raise
