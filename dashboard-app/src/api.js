/**
 * ProITBridge API Service Layer
 *
 * Centralised HTTP client for all backend API interactions.
 * Supports both standard JSON responses and Server-Sent Event (SSE) streams.
 */

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// ─── Helpers ────────────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Chat ───────────────────────────────────────────────────────────────────

/**
 * Send a chat query and receive a complete JSON response.
 * @returns {{ answer, citations, latency_ms, tokens_used, session_id }}
 */
export async function sendChatMessage(query, { sessionId, topK = 5, temperature = 0.3 } = {}) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      query,
      session_id: sessionId || undefined,
      top_k: topK,
      temperature,
      stream: false,
    }),
  });
}

/**
 * Send a chat query and stream the response via SSE.
 * @param {function} onToken   - Called for each text token: (tokenStr) => void
 * @param {function} onMeta    - Called once with { citations, retrieval_latency_ms }
 * @param {function} onDone    - Called when stream completes: (fullText) => void
 * @param {function} onError   - Called on error: (errorMsg) => void
 */
export async function streamChatMessage(
  query,
  { sessionId, topK = 5, temperature = 0.3 } = {},
  { onToken, onMeta, onDone, onError } = {}
) {
  const url = `${API_BASE}/api/chat`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        session_id: sessionId || undefined,
        top_k: topK,
        temperature,
        stream: true,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `API error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === "metadata" && onMeta) {
            onMeta(data);
          } else if (data.type === "summary") {
            // Summary event — stream is ending
          } else if (data.error) {
            onError?.(data.error);
          } else if (data.done && data.full_text) {
            fullText = data.full_text;
            onDone?.(fullText);
          } else if (data.token) {
            fullText += data.token;
            onToken?.(data.token);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    // If we never got a "done" event, fire onDone with what we have
    if (fullText && !fullText.endsWith("")) {
      onDone?.(fullText);
    }
  } catch (err) {
    onError?.(err.message || "Stream connection failed");
  }
}

// ─── Documents ──────────────────────────────────────────────────────────────

/**
 * Upload a file to be indexed.
 * @returns {{ document_id, name, chunk_count, status, message }}
 */
export async function uploadDocument(file) {
  const url = `${API_BASE}/api/upload`;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

/**
 * List all documents in the knowledge base.
 * @returns {{ documents: [...], total: number }}
 */
export async function fetchDocuments() {
  return request("/api/documents");
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(documentId) {
  return request(`/api/documents/${documentId}`, { method: "DELETE" });
}

// ─── Analytics ──────────────────────────────────────────────────────────────

/**
 * Fetch aggregated analytics.
 * @returns {{ total_documents, total_chunks, total_queries, avg_retrieval_latency_ms, ... }}
 */
export async function fetchAnalytics() {
  return request("/api/analytics");
}

// ─── Health ─────────────────────────────────────────────────────────────────

/**
 * Check backend health status.
 * @returns {{ status, version, services: {...} }}
 */
export async function fetchHealth() {
  return request("/api/health");
}
