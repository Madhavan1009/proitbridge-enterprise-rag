import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Trash2, FileText, BookOpen, File, Plus,
  CheckCircle, Clock, AlertCircle, Loader, Files,
  Database, MessageSquare, Zap,
} from "lucide-react";

// Preserved: exact same API imports
import { uploadDocument, fetchDocuments, deleteDocument, fetchAnalytics } from "../../api.js";
import { formatBytes, timeAgo, getExt, DEFAULT_STATS } from "../../utils.js";

// ── Icon helpers ─────────────────────────────────────────────────────────────

function DocIcon({ name, size = "md" }) {
  const ext  = getExt(name);
  const cls  = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  if (ext === "pdf")  return <FileText  className={`${cls} text-red-500`}   />;
  if (ext === "docx") return <FileText  className={`${cls} text-blue-500`}  />;
  if (ext === "md")   return <BookOpen  className={`${cls} text-emerald-500`} />;
  return                      <File     className={`${cls} text-slate-400`} />;
}

const STAT_ICONS = {
  total_documents:        { Icon: Files,          bg: "bg-indigo-50",  icon: "text-indigo-600" },
  total_chunks:           { Icon: Database,       bg: "bg-violet-50",  icon: "text-violet-600" },
  queries_today:          { Icon: MessageSquare,  bg: "bg-sky-50",     icon: "text-sky-600"    },
  avg_retrieval_latency_ms:{ Icon: Zap,           bg: "bg-emerald-50", icon: "text-emerald-600"},
};

function StatusBadge({ status }) {
  if (status === "indexed") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" /> Indexed
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Loader className="w-3 h-3 animate-spin" /> Processing
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
        <AlertCircle className="w-3 h-3" /> Error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
      <Clock className="w-3 h-3" /> {status ?? "Queued"}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentsPanel() {
  // ── State — identical to original ────────────────────────────────────────
  const [dragging,   setDragging]   = useState(false);
  const [docs,       setDocs]       = useState([]);
  const [stats,      setStats]      = useState(DEFAULT_STATS);
  const [uploading,  setUploading]  = useState(false);
  const fileInputRef = useRef(null);

  // Preserved: exact same data-loading logic
  const loadData = useCallback(async () => {
    try {
      const [docRes, anaRes] = await Promise.all([
        fetchDocuments(),
        fetchAnalytics().catch(() => null),
      ]);
      setDocs(docRes.documents || []);
      if (anaRes) {
        setStats(
          DEFAULT_STATS.map((s) => {
            const v   = anaRes[s.key];
            const val = s.key === "avg_retrieval_latency_ms"
              ? `${Math.round(v || 0)}ms`
              : (v ?? 0).toLocaleString();
            return {
              ...s,
              value: val,
              delta: s.key === "queries_today"
                ? `${anaRes.queries_delta_pct > 0 ? "+" : ""}${anaRes.queries_delta_pct}% vs yesterday`
                : "",
            };
          }),
        );
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Preserved: exact same upload handler
  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) { await uploadDocument(file); }
      await loadData();
    } catch (err) { alert("Upload failed: " + err.message); }
    finally { setUploading(false); }
  };

  // Preserved: exact same delete handler
  const handleDelete = async (id) => {
    if (!confirm("Delete this document and its vectors?")) return;
    try { await deleteDocument(id); await loadData(); }
    catch (err) { alert("Delete failed: " + err.message); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">

      {/* ── Upload zone ── */}
      <div
        onDragOver={(e)  => { e.preventDefault(); setDragging(true);  }}
        onDragLeave={()  => setDragging(false)}
        onDrop={(e)      => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); }}
        onClick={()      => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
          ${dragging
            ? "border-indigo-400 bg-indigo-50 shadow-md shadow-indigo-100"
            : "border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all
          ${dragging ? "bg-indigo-100" : "bg-slate-100"}`}
        >
          {uploading
            ? <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
            : <Upload className={`w-6 h-6 transition-colors ${dragging ? "text-indigo-600" : "text-slate-400"}`} />
          }
        </div>

        <p className="text-slate-700 font-semibold text-sm mb-1">
          {uploading ? "Uploading & indexing…" : dragging ? "Drop files here" : "Drop files to index"}
        </p>
        <p className="text-slate-400 text-xs mb-5">
          PDF, DOCX, TXT, MD &middot; Max 50 MB per file
        </p>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Browse Files
        </button>
      </div>

      {/* ── KPI stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const meta = STAT_ICONS[s.key];
          const Icon = meta?.Icon ?? Zap;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-9 h-9 rounded-xl ${meta?.bg ?? "bg-slate-50"} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${meta?.icon ?? "text-slate-500"}`} />
              </div>
              <div className="text-slate-900 font-bold text-xl leading-none mb-1">{s.value}</div>
              <div className="text-slate-500 text-xs font-medium">{s.label}</div>
              {s.delta && (
                <div className="text-emerald-600 text-[10px] font-semibold mt-1.5 flex items-center gap-1">
                  <span>▲</span> {s.delta}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Document list ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-slate-800 font-semibold text-sm">Knowledge Base</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">{docs.length} document{docs.length !== 1 ? "s" : ""} indexed</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Document
          </button>
        </div>

        {/* Empty state */}
        {docs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Files className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No documents yet</p>
            <p className="text-slate-400 text-xs">Upload files above to start indexing your knowledge base</p>
          </div>
        )}

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          <AnimatePresence initial={false}>
            {docs.map((doc) => {
              const ext = getExt(doc.name) || doc.file_type?.replace(".", "");
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all group cursor-pointer"
                >
                  {/* File type icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${ext === "pdf"  ? "bg-red-50"     :
                      ext === "md"   ? "bg-emerald-50" :
                      ext === "docx" ? "bg-blue-50"    : "bg-slate-100"}`}
                  >
                    <DocIcon name={doc.name} size="lg" />
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-semibold truncate group-hover:text-indigo-700 transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {formatBytes(doc.size_bytes)}
                      {doc.chunk_count > 0 ? ` · ${doc.chunk_count} chunks` : " · pending"}
                      {" · "}{timeAgo(doc.uploaded_at)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={doc.status} />

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
