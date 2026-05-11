"""
ProITBridge Enterprise AI Knowledge Assistant — FastAPI Application Entry Point.

Initialises the application with:
    - CORS middleware
    - Structured logging
    - Error handlers
    - API routers
    - Startup lifecycle events
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.core.database import init_database
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.error_handler import register_error_handlers
from app.api import chat, upload, documents, analytics, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Runs on startup (before first request) and shutdown.
    """
    # ── Startup ──────────────────────────────────────────────────────────
    setup_logging()
    logger = get_logger("app.main")

    settings = get_settings()
    logger.info(
        f"Starting {settings.APP_NAME} v{settings.APP_VERSION} "
        f"({settings.ENVIRONMENT})"
    )

    # Verify database connectivity
    await init_database()

    # Pre-loading of the embedding model is disabled here because it causes 
    # Render's free tier to time out during boot (takes > 4 mins). 
    # It will now lazy-load on the first request instead.
    logger.info("Application startup complete ✓")

    yield  # ── Application runs here ─────────────────────────────────────

    # ── Shutdown ─────────────────────────────────────────────────────────
    logger.info("Application shutting down")


def create_app() -> FastAPI:
    """Factory function that assembles the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Production-grade Enterprise AI Knowledge Assistant with RAG, "
            "semantic search, document ingestion, and streaming responses."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Logging Middleware ────────────────────────────────────────────────
    app.add_middleware(LoggingMiddleware)

    # ── Error Handlers ───────────────────────────────────────────────────
    register_error_handlers(app)

    # ── API Routers ──────────────────────────────────────────────────────
    app.include_router(chat.router)
    app.include_router(upload.router)
    app.include_router(documents.router)
    app.include_router(analytics.router)
    app.include_router(health.router)

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
