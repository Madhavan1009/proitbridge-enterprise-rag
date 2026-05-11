# ProITBridge Enterprise AI Knowledge Assistant — Backend

Production-grade RAG (Retrieval Augmented Generation) backend powering the Enterprise AI Knowledge Assistant. Built with FastAPI, Pinecone, Gemini 2.5 Flash, and Supabase.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                     http://localhost:5173                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API + SSE
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (:8000)                       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Upload   │  │   Chat   │  │Analytics │  │   Documents  │   │
│  │   API     │  │   API    │  │   API    │  │     API      │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │             │               │            │
│  ┌────▼──────────────▼─────────────▼───────────────▼────────┐  │
│  │                  Service Layer                            │  │
│  │  document_service · query_service · analytics_service     │  │
│  └────┬──────────────┬─────────────────────────────┬────────┘  │
│       │              │                             │            │
│  ┌────▼──────┐  ┌────▼──────────────────────┐ ┌───▼────────┐  │
│  │  Extract  │  │      RAG Pipeline          │ │  History   │  │
│  │  Clean    │  │  Chunk → Embed → Retrieve  │ │  Service   │  │
│  │  Chunk    │  │  → Rerank → Prompt → LLM   │ │            │  │
│  └────┬──────┘  └───────┬───────────┬────────┘ └───┬────────┘  │
│       │                 │           │              │            │
└───────┼─────────────────┼───────────┼──────────────┼────────────┘
        │                 │           │              │
   ┌────▼──────┐    ┌─────▼────┐ ┌───▼─────┐  ┌────▼──────┐
   │ Pinecone  │    │ Pinecone │ │ Gemini  │  │ Supabase  │
   │ (upsert)  │    │ (query)  │ │ 2.5 FL  │  │ Postgres  │
   └───────────┘    └──────────┘ └─────────┘  └───────────┘
```

## Tech Stack

| Component       | Technology                  |
|-----------------|-----------------------------|
| Web Framework   | FastAPI (Python 3.11+)      |
| LLM             | Google Gemini 2.5 Flash     |
| Embeddings      | BAAI/bge-small-en-v1.5      |
| Vector DB       | Pinecone Serverless         |
| Database        | Supabase PostgreSQL         |
| RAG Framework   | LangChain                   |
| Deployment      | Docker / Render             |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── api/                    # Route handlers
│   │   ├── chat.py             # POST /api/chat
│   │   ├── upload.py           # POST /api/upload
│   │   ├── documents.py        # GET/DELETE /api/documents
│   │   ├── analytics.py        # GET /api/analytics
│   │   └── health.py           # GET /api/health
│   ├── core/                   # Infrastructure
│   │   ├── config.py           # Pydantic settings
│   │   ├── database.py         # Supabase client
│   │   ├── pinecone_client.py  # Pinecone operations
│   │   ├── gemini_client.py    # Gemini LLM client
│   │   └── logging.py          # Structured logging
│   ├── rag/                    # RAG pipeline
│   │   ├── chunking.py         # Text splitting
│   │   ├── embeddings.py       # BGE embeddings
│   │   ├── retriever.py        # Vector search
│   │   ├── reranker.py         # Result reranking
│   │   ├── prompt_builder.py   # Prompt engineering
│   │   ├── citation_builder.py # Citation extraction
│   │   └── pipeline.py         # Pipeline orchestrator
│   ├── services/               # Business logic
│   │   ├── document_service.py # Document ingestion
│   │   ├── query_service.py    # Query processing
│   │   ├── analytics_service.py# Metrics aggregation
│   │   └── history_service.py  # Chat history
│   ├── models/                 # Pydantic models
│   │   ├── request_models.py
│   │   ├── response_models.py
│   │   └── database_models.py
│   ├── middleware/
│   │   ├── logging_middleware.py
│   │   └── error_handler.py
│   └── utils/
│       ├── pdf_parser.py
│       ├── text_cleaner.py
│       ├── token_counter.py
│       └── file_validators.py
├── requirements.txt
├── Dockerfile
├── render.yaml
├── .env.example
├── start.sh
└── README.md
```

---

## Setup Instructions

### 1. Clone & Navigate

```bash
cd RAG_Production_Project/backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 5. Set Up Supabase Tables

Run the following SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    chunk_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'queued',
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    tokens_used INTEGER DEFAULT 0,
    retrieval_latency_ms REAL,
    generation_latency_ms REAL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chat_history_session ON chat_history(session_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
```

### 6. Start the Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API docs will be available at: **http://localhost:8000/docs**

---

## Service Setup

### Pinecone

1. Create an account at [pinecone.io](https://www.pinecone.io)
2. Create a **Serverless** index:
   - **Name**: `enterprise-rag`
   - **Dimension**: `384`
   - **Metric**: `cosine`
3. Copy your API key to `.env`

### Google Gemini

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Generate an API key
3. Copy to `.env` as `GEMINI_API_KEY`

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migration (Step 5 above)
3. Copy the project URL and `anon` key to `.env`

---

## API Endpoints

### Upload Document
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@Engineering_Handbook.pdf"
```

### Ask a Question
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the authentication requirements?",
    "top_k": 5,
    "stream": false
  }'
```

**Response:**
```json
{
  "answer": "Based on the Engineering Handbook...",
  "citations": [
    {
      "doc": "Engineering Handbook.pdf",
      "page": 34,
      "chunk": "Auth Requirements §4.2",
      "score": 0.97
    }
  ],
  "latency_ms": 142,
  "tokens_used": 321,
  "session_id": "abc-123"
}
```

### Get Analytics
```bash
curl http://localhost:8000/api/analytics
```

### List Documents
```bash
curl http://localhost:8000/api/documents
```

### Delete Document
```bash
curl -X DELETE http://localhost:8000/api/documents/{document_id}
```

### Health Check
```bash
curl http://localhost:8000/api/health
```

---

## Deployment on Render

### Option 1: Docker Deploy

1. Push your code to GitHub
2. Connect your repo to Render
3. Set the root directory to `backend`
4. Add environment variables in the Render dashboard
5. Deploy

### Option 2: render.yaml

1. Update `render.yaml` with your GitHub repo URL
2. Push to GitHub
3. In Render dashboard, create a new **Blueprint** from your repo
4. Render will auto-detect the `render.yaml` configuration

---

## Frontend Integration

The backend is configured with CORS for `http://localhost:5173` (Vite dev server).

The frontend dashboard in `dashboard-app/` connects to these endpoints:

| Frontend Action     | Backend Endpoint              |
|---------------------|-------------------------------|
| Send message        | `POST /api/chat`              |
| Upload document     | `POST /api/upload`            |
| List documents      | `GET /api/documents`          |
| Delete document     | `DELETE /api/documents/{id}`  |
| Load analytics      | `GET /api/analytics`          |
| Health status       | `GET /api/health`             |

---

## License

ProITBridge © 2025. All rights reserved.
