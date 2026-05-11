# ProITBridge Enterprise AI Knowledge Assistant
## End-to-End System Architecture

This document outlines the complete architectural workflow, data pipelines, and infrastructure for the ProITBridge Enterprise RAG (Retrieval-Augmented Generation) application.

---

## 1. Core Technologies
*   **Frontend (UI/UX):** React.js + Vite + TailwindCSS (`dashboard-app/`)
*   **Backend (API & Logic):** FastAPI (Python) (`backend/`)
*   **Vector Database:** Pinecone (Stores mathematical representations of text)
*   **Relational Database:** Supabase / PostgreSQL (Stores application metadata)
*   **AI Models:** Google Gemini 2.5 Flash (for Generation) & BAAI/bge-small-en-v1.5 (for Embedding)

---

## 2. End-to-End Data Workflows

### Workflow A: Document Ingestion (Uploading Files)
When an administrator uploads a document (PDF, TXT, DOCX, MD) via the frontend Dashboard:
1.  **File Upload:** The React frontend securely sends the raw file to the FastAPI backend `/api/upload` endpoint.
2.  **Metadata Registration:** The backend generates a unique `document_id` and records the file metadata (Name, Size, Type, Upload Date, Status: 'processing') into the **Supabase `documents` table**.
3.  **Text Extraction:** Python libraries (`PyMuPDF`, `python-docx`) read and extract raw text from the file.
4.  **Chunking:** The LangChain `RecursiveCharacterTextSplitter` breaks the massive text into smaller, overlapping chunks (e.g., 500 characters each). This ensures the AI doesn't lose context.
5.  **Vector Embedding:** Each text chunk is passed through an Embedding Model (`BAAI/bge-small-en-v1.5`) which converts the text into a dense array of 384 numbers (a vector).
6.  **Vector Storage:** The vectors are pushed to **Pinecone**. Crucially, the Supabase `document_id` is attached as metadata to these vectors in Pinecone so they can be linked back later.
7.  **Finalization:** The document's status in Supabase is updated to `indexed`.

### Workflow B: Retrieval-Augmented Generation (AI Chat)
When a user asks a question in the AI Chat window:
1.  **Query Submission:** The user's text query is sent to the FastAPI backend `/api/chat` endpoint.
2.  **Query Embedding:** The backend converts the user's question into a mathematical vector using the exact same Embedding Model.
3.  **Vector Similarity Search:** The backend asks **Pinecone** to find the top 5 document chunks whose vectors are most mathematically similar (Cosine Similarity) to the question's vector.
4.  **Context Assembly:** The retrieved chunks are formatted into a large context block.
5.  **LLM Generation:** The context block AND the user's original question are sent to **Google Gemini**. The prompt strictly instructs Gemini to answer the question *only* using the provided context.
6.  **Telemetry & History:**
    *   The user's query and the AI's response are saved in the **Supabase `chat_history` table** to maintain conversation memory.
    *   A telemetry event is fired to the **Supabase `analytics_events` table** for dashboard metrics.
7.  **Response:** The AI's answer, along with precise source citations (document name, chunk text), is streamed back to the React frontend.

---

## 3. Database Schemas

### Supabase (PostgreSQL)
*   **`documents`**: Tracks physical files. (Columns: `id`, `name`, `file_type`, `size_bytes`, `chunk_count`, `status`, `uploaded_at`).
*   **`chat_history`**: Tracks user conversations. (Columns: `id`, `session_id`, `role`, `content`, `timestamp`).
*   **`analytics_events`**: Tracks system usage. (Columns: `id`, `event_type`, `document_id`, `latency_ms`, `tokens_used`).

### Pinecone (Vector Index)
*   **Index Name:** `enterprise-rag`
*   **Dimension:** 384
*   **Metric:** Cosine
*   **Stored Metadata:** `text` (the actual text chunk), `document_id` (foreign key to Supabase), `source` (filename).

---

## 4. Deployment Architecture

*   **Frontend Hosting:** **Vercel** (Connects directly to the GitHub repository, builds the Vite app, and serves the static assets globally via CDN).
*   **Backend Hosting:** **Render.com** (Pulls the Dockerfile from the GitHub repository, builds a Python container, and exposes the FastAPI endpoints over HTTPS).
*   **Data Layer:** **Supabase Cloud** (Managed Postgres DB) & **Pinecone Cloud** (Managed Vector DB).
