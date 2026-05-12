import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Files, Database, MessageSquare, Zap, TrendingUp, BarChart3, Clock } from "lucide-react";

// Preserved: exact same API import
import { fetchAnalytics } from "../../api.js";
import { DEFAULT_STATS } from "../../utils.js";

// Bar chart heights for the last 14 days (visual-only, same as original)
const BAR_HEIGHTS = [65, 82, 54, 91, 78, 43, 88, 96, 72, 84, 61, 79, 88, 95];
const BAR_LABELS  = ["May 1","","","","May 5","","","","May 10","","","","","May 14"];

const QUERY_CATEGORIES = [
  { label: "Technical Docs",    pct: 42, color: "bg-indigo-500"  },
  { label: "Policy Questions",  pct: 28, color: "bg-violet-500"  },
  { label: "HR & Operations",   pct: 18, color: "bg-sky-500"     },
  { label: "Product Queries",   pct: 12, color: "bg-emerald-500" },
];

const STAT_CONFIG = {
  total_documents:         { Icon: Files,         bg: "bg-indigo-50",  text: "text-indigo-600",  label: "Documents"  },
  total_chunks:            { Icon: Database,      bg: "bg-violet-50",  text: "text-violet-600",  label: "Chunks"     },
  queries_today:           { Icon: MessageSquare, bg: "bg-sky-50",     text: "text-sky-600",     label: "Queries"    },
  avg_retrieval_latency_ms:{ Icon: Zap,           bg: "bg-emerald-50", text: "text-emerald-600", label: "Latency"    },
};

export default function AnalyticsPanel() {
  // ── State — identical to original ────────────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [stats,     setStats]     = useState(DEFAULT_STATS);

  // Preserved: exact same fetchAnalytics() call and stats mapping
  useEffect(() => {
    fetchAnalytics()
      .then((data) => {
        setAnalytics(data);
        setStats(
          DEFAULT_STATS.map((s) => {
            const v   = data[s.key];
            const val = s.key === "avg_retrieval_latency_ms"
              ? `${Math.round(v || 0)}ms`
              : (v ?? 0).toLocaleString();
            return {
              ...s,
              value: val,
              delta: s.key === "queries_today"
                ? `${data.queries_delta_pct > 0 ? "+" : ""}${data.queries_delta_pct}% vs yesterday`
                : "",
            };
          }),
        );
      })
      .catch(() => {});
  }, []);

  const topDocs = analytics?.top_queried_documents || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const cfg  = STAT_CONFIG[s.key];
          const Icon = cfg?.Icon ?? BarChart3;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cfg?.bg ?? "bg-slate-50"}`}>
                <Icon className={`w-4 h-4 ${cfg?.text ?? "text-slate-500"}`} />
              </div>
              <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                {s.label}
              </div>
              <div className="text-slate-900 font-bold text-2xl leading-none">
                {s.value}
              </div>
              {s.delta && (
                <div className="text-emerald-600 text-[11px] font-semibold mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {s.delta}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Query volume chart ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-slate-800 font-semibold text-sm">Query Volume</h3>
            <p className="text-slate-400 text-xs mt-0.5">Last 14 days</p>
          </div>
          <div className="text-right">
            <div className="text-slate-900 font-bold text-lg leading-none">
              {analytics ? analytics.total_queries.toLocaleString() : "—"}
            </div>
            {analytics?.queries_delta_pct != null && (
              <div className="text-emerald-600 text-xs font-semibold mt-0.5 flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />
                {analytics.queries_delta_pct > 0 ? "+" : ""}{analytics.queries_delta_pct}%
              </div>
            )}
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-32">
          {BAR_HEIGHTS.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 opacity-75 group-hover:opacity-100 transition-opacity"
                style={{ height: `${h}%` }}
                title={`Day ${i + 1}: ${h} queries`}
              />
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex mt-2">
          {BAR_LABELS.map((l, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-slate-400">{l}</div>
          ))}
        </div>
      </div>

      {/* ── Bottom row: categories + top docs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Query categories */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-slate-800 font-semibold text-sm mb-5">Query Categories</h3>
          <div className="space-y-4">
            {QUERY_CATEGORIES.map((q, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-xs font-medium">{q.label}</span>
                  <span className="text-slate-500 text-xs font-mono">{q.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${q.pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${q.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top queried documents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-slate-800 font-semibold text-sm">Top Documents</h3>
            <span className="text-slate-400 text-xs">by query count</span>
          </div>

          {topDocs.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <BarChart3 className="w-8 h-8 text-slate-300" />
              <p className="text-slate-400 text-xs">No query data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDocs.slice(0, 5).map((doc, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                  <span className="text-slate-300 font-mono text-xs w-5 text-right flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-xs font-medium truncate group-hover:text-indigo-700 transition-colors">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                          style={{ width: `${Math.max(10, 80 - i * 15)}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-[10px] flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{doc.query_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
