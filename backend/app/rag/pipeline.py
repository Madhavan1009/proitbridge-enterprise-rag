"""
Complete RAG pipeline.
Orchestrates retrieval → reranking → prompt building → generation → citations.
"""

import json
import time
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.core.config import get_settings
from app.core.gemini_client import generate_response, generate_stream
from app.core.logging import get_logger
from app.rag.retriever import retrieve_chunks
from app.rag.reranker import rerank_chunks
from app.rag.prompt_builder import build_prompt
from app.rag.citation_builder import build_citations

logger = get_logger(__name__)


async def execute_rag_pipeline(
    query: str,
    top_k: int = 5,
    temperature: float = 0.3,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Execute the full RAG pipeline and return a structured response.

    Pipeline steps:
        1. Retrieve relevant chunks from Pinecone
        2. Rerank retrieved chunks
        3. Build contextualised prompt
        4. Generate response via Gemini
        5. Build structured citations

    Returns:
        {
            "answer": str,
            "citations": [...],
            "latency_ms": float,
            "tokens_used": int,
            "retrieval_latency_ms": float,
            "generation_latency_ms": float,
        }
    """
    pipeline_start = time.perf_counter()

    # ── Step 1: Retrieve ─────────────────────────────────────────────────
    retrieval_result = await retrieve_chunks(query=query, top_k=top_k * 2)
    retrieval_latency = retrieval_result["latency_ms"]
    raw_chunks = retrieval_result["chunks"]

    # ── Step 2: Rerank ───────────────────────────────────────────────────
    reranked_chunks = rerank_chunks(raw_chunks, top_k=top_k)

    # ── Step 3: Build prompt ─────────────────────────────────────────────
    if reranked_chunks:
        prompt = build_prompt(query=query, retrieved_chunks=reranked_chunks)
    else:
        # No relevant context found
        prompt = build_prompt(query=query, retrieved_chunks=[])

    # ── Step 4: Generate response ────────────────────────────────────────
    gen_start = time.perf_counter()
    llm_result = await generate_response(
        system_prompt=prompt["system_prompt"],
        user_message=prompt["user_message"],
        chat_history=chat_history,
    )
    generation_latency = round((time.perf_counter() - gen_start) * 1000, 2)

    # ── Step 5: Build citations ──────────────────────────────────────────
    citations = build_citations(reranked_chunks) if reranked_chunks else []

    total_latency = round((time.perf_counter() - pipeline_start) * 1000, 2)

    logger.info(
        f"RAG pipeline complete — "
        f"retrieval={retrieval_latency}ms, "
        f"generation={generation_latency}ms, "
        f"total={total_latency}ms, "
        f"chunks={len(reranked_chunks)}, "
        f"tokens={llm_result['tokens_used']}"
    )

    return {
        "answer": llm_result["content"],
        "citations": citations,
        "latency_ms": total_latency,
        "tokens_used": llm_result["tokens_used"],
        "retrieval_latency_ms": retrieval_latency,
        "generation_latency_ms": generation_latency,
    }


async def execute_rag_stream(
    query: str,
    top_k: int = 5,
    temperature: float = 0.3,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> AsyncGenerator[str, None]:
    """
    Execute the RAG pipeline with streaming response.

    Streams tokens as SSE events, then sends a final event with citations.
    """
    pipeline_start = time.perf_counter()

    # ── Retrieve & Rerank ────────────────────────────────────────────────
    retrieval_result = await retrieve_chunks(query=query, top_k=top_k * 2)
    retrieval_latency = retrieval_result["latency_ms"]
    raw_chunks = retrieval_result["chunks"]
    reranked_chunks = rerank_chunks(raw_chunks, top_k=top_k)

    # ── Build prompt ─────────────────────────────────────────────────────
    prompt = build_prompt(query=query, retrieved_chunks=reranked_chunks)

    # ── Send retrieval metadata as first event ───────────────────────────
    citations = build_citations(reranked_chunks) if reranked_chunks else []
    meta_event = json.dumps({
        "type": "metadata",
        "citations": citations,
        "retrieval_latency_ms": retrieval_latency,
    })
    yield f"data: {meta_event}\n\n"

    # ── Stream LLM tokens ────────────────────────────────────────────────
    gen_start = time.perf_counter()
    async for sse_chunk in generate_stream(
        system_prompt=prompt["system_prompt"],
        user_message=prompt["user_message"],
        chat_history=chat_history,
    ):
        yield sse_chunk

    generation_latency = round((time.perf_counter() - gen_start) * 1000, 2)
    total_latency = round((time.perf_counter() - pipeline_start) * 1000, 2)

    # ── Final summary event ──────────────────────────────────────────────
    summary_event = json.dumps({
        "type": "summary",
        "latency_ms": total_latency,
        "retrieval_latency_ms": retrieval_latency,
        "generation_latency_ms": generation_latency,
    })
    yield f"data: {summary_event}\n\n"

    logger.info(
        f"RAG stream complete — total={total_latency}ms, chunks={len(reranked_chunks)}"
    )
