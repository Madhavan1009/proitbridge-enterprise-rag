import { useState, useEffect } from "react";
import { Search, Bell, Zap, Settings } from "lucide-react";
import { fetchHealth } from "../../api.js";

const PAGE_META = {
  chat:      { title: "AI Chat Assistant",      sub: "Ask anything about your indexed documents"  },
  documents: { title: "Knowledge Base",          sub: "Upload, manage, and index your documents"   },
  analytics: { title: "Analytics Dashboard",     sub: "Monitor performance, usage, and retrieval"  },
  settings:  { title: "Settings",                sub: "Configure your AI workspace and integrations" },
};

export default function TopBar({ activeTab }) {
  const [health, setHealth] = useState(null);

  // Preserved: exact same fetchHealth() call and status resolution
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline" }));
  }, []);

  const isOnline = health?.status === "healthy" || health?.status === "degraded";
  const meta     = PAGE_META[activeTab] ?? PAGE_META.chat;

  return (
    <header className="h-16 flex-shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center px-6 gap-4 z-20 shadow-sm">

      {/* ── Page title ── */}
      <div className="flex-shrink-0">
        <h1 className="text-slate-900 font-semibold text-[15px] leading-none">
          {meta.title}
        </h1>
        <p className="text-slate-400 text-[11px] mt-0.5 font-normal">
          {meta.sub}
        </p>
      </div>

      {/* ── Search ── */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
      </div>

      {/* ── Right actions ── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Health status pill */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold
          ${isOnline
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50   border-red-200   text-red-600"}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
            ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`}
          />
          {isOnline ? "RAG Engine Online" : "Backend Offline"}
        </div>

        {/* Gemini model badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
          <Zap className="w-3 h-3" />
          Gemini 2.5 Flash
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 border-2 border-white" />
        </button>

        {/* Settings shortcut */}
        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
