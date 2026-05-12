// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export function getExt(name) {
  return (name?.split(".").pop() || "").toLowerCase();
}

// ─── Shared constants ────────────────────────────────────────────────────────

export const DEFAULT_STATS = [
  { label: "Documents Indexed", value: "0", delta: "", iconKey: "docs",    color: "indigo",  key: "total_documents" },
  { label: "Total Chunks",      value: "0", delta: "", iconKey: "chunks",  color: "violet",  key: "total_chunks" },
  { label: "Queries Today",     value: "0", delta: "", iconKey: "queries", color: "sky",     key: "queries_today" },
  { label: "Avg Retrieval",   value: "0ms", delta: "", iconKey: "speed",   color: "emerald", key: "avg_retrieval_latency_ms" },
];

export const WELCOME_MSG = {
  id: 1,
  role: "assistant",
  content:
    "Hello! I'm the ProITBridge AI Knowledge Assistant. I have access to your indexed documents and can answer questions with precise source citations. How can I help you today?",
  sources: [],
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  tokens: 0,
};
