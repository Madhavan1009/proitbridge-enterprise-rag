# ProITBridge — Enterprise AI Knowledge Assistant

A production-grade RAG (Retrieval-Augmented Generation) platform. Upload internal documents, ask questions in plain English, get AI-generated answers with cited sources.

**Live Demo**
- Frontend: `https://your-project.vercel.app`
- Backend API: `https://proitbridge-rag-backend.onrender.com/api/health`

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Google Gemini 2.5 Flash |
| Embeddings | Gemini text-embedding-001 (768-dim) |
| Vector DB | Pinecone Serverless (cosine, AWS us-east-1) |
| Database | Supabase PostgreSQL |
| Backend | FastAPI + Python 3.11 + uvicorn |
| Frontend | React 19 + Vite 8 + Tailwind CSS v4 |
| Animations | Framer Motion |
| Deployment | Render (Docker) + Vercel |

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, startup
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings (env vars)
│   │   │   ├── database.py          # Supabase client + migrations
│   │   │   └── dependencies.py      # Lazy Pinecone/Gemini singletons
│   │   ├── rag/
│   │   │   ├── embeddings.py        # Gemini text-embedding-001
│   │   │   ├── pipeline.py          # RAG chain: embed → retrieve → generate
│   │   │   └── retrieval.py         # Pinecone vector search
│   │   ├── routes/
│   │   │   ├── chat.py              # POST /api/chat + SSE stream
│   │   │   ├── documents.py         # Upload / list / delete
│   │   │   └── analytics.py         # Stats aggregation
│   │   └── utils/
│   │       └── document_parser.py   # PDF / DOCX / TXT / MD chunking
│   ├── Dockerfile
│   ├── render.yaml
│   └── requirements.txt
│
└── dashboard-app/
    └── src/
        ├── api.js                   # All API calls (never modify)
        ├── utils.js                 # formatBytes, timeAgo, DEFAULT_STATS
        └── components/
            ├── layout/              # Sidebar, TopBar
            ├── chat/                # ChatPanel, Message, SourceCard, InputArea
            ├── documents/           # DocumentsPanel
            ├── analytics/           # AnalyticsPanel
            └── settings/            # SettingsPanel
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | RAG query → `{answer, citations, session_id, tokens_used}` |
| GET | `/api/chat/stream` | Same as above via SSE token stream |
| POST | `/api/documents/upload` | Upload & index a document |
| GET | `/api/documents` | List all indexed documents |
| DELETE | `/api/documents/{id}` | Delete document + its vectors |
| GET | `/api/analytics` | Query stats, latency, top documents |
| GET | `/api/health` | Service health check |

---

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=enterprise-rag
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

```bash
uvicorn app.main:app --reload --port 8000
# Swagger UI → http://localhost:8000/docs
```

### Frontend

```bash
cd dashboard-app
npm install
```

Create `dashboard-app/.env`:

```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
# → http://localhost:5173
```

---

## Pinecone Index Setup

| Setting | Value |
|---|---|
| Index name | `enterprise-rag` |
| Dimensions | `768` |
| Metric | `cosine` |
| Type | Serverless |
| Cloud / Region | AWS us-east-1 |

---

## Supabase — Required Tables

Run this in the Supabase SQL Editor:

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

---

## Deployment

### Backend → Render

1. Push to GitHub
2. New Web Service → connect repo → Root Directory: `backend` → Runtime: Docker
3. Add all env vars from `.env` in the Environment tab
4. Render auto-deploys on every push to `main`

> Free tier spins down after 15 min inactivity. First request after sleep takes ~30–60s.

### Frontend → Vercel

1. New Project → connect repo → Root Directory: `dashboard-app` → Framework: Vite
2. Add environment variable: `VITE_API_URL` = your Render backend URL
3. Vercel auto-deploys on every push to `main`

---

## Supported File Types

`PDF` · `DOCX` · `TXT` · `Markdown` — max 50 MB per file

Chunking: `chunk_size=500` · `overlap=100` via LangChain `RecursiveCharacterTextSplitter`
