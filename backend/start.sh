#!/bin/bash
# ─── ProITBridge Enterprise AI Knowledge Assistant ───────────────────────────
# Startup script for local development and deployment
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "============================================"
echo " ProITBridge Enterprise AI Knowledge Assistant"
echo " Starting Backend Server..."
echo "============================================"

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "   Please edit .env with your API keys before continuing."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ] && [ -z "$VIRTUAL_ENV" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
    source venv/bin/activate
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
else
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
fi

# Create uploads directory
mkdir -p uploads

# Start the server
echo "🚀 Starting FastAPI server on http://0.0.0.0:8000"
echo "📄 API docs: http://localhost:8000/docs"
echo "============================================"

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
