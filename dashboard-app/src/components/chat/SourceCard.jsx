import { FileText, BookOpen, File, ExternalLink } from "lucide-react";

function FileIcon({ name }) {
  const ext = (name?.split(".").pop() || "").toLowerCase();
  if (ext === "pdf")  return <FileText  className="w-3.5 h-3.5 text-red-500   flex-shrink-0" />;
  if (ext === "docx") return <FileText  className="w-3.5 h-3.5 text-blue-500  flex-shrink-0" />;
  if (ext === "md")   return <BookOpen  className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
  return                      <File     className="w-3.5 h-3.5 text-slate-400  flex-shrink-0" />;
}

// Score → colour helpers
function scoreClasses(pct) {
  if (pct >= 90) return { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (pct >= 80) return { bar: "bg-amber-500",   badge: "bg-amber-50   text-amber-700   border-amber-200"  };
  return               { bar: "bg-slate-400",    badge: "bg-slate-50   text-slate-600   border-slate-200"  };
}

export default function SourceCard({ source, idx }) {
  const pct     = Math.round((source.score ?? 0) * 100);
  const { bar, badge } = scoreClasses(pct);

  return (
    <div className="group flex flex-col gap-2.5 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50 transition-all cursor-pointer">

      {/* ── Header row ── */}
      <div className="flex items-start gap-2">
        {/* Index badge */}
        <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold flex-shrink-0 mt-0.5 group-hover:bg-indigo-200 transition-colors">
          {idx + 1}
        </div>

        {/* File type icon */}
        <div className="mt-0.5">
          <FileIcon name={source.doc} />
        </div>

        {/* Doc name + chunk */}
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 text-[11px] font-semibold truncate group-hover:text-indigo-700 transition-colors leading-snug">
            {source.doc}
          </p>
          <p className="text-slate-400 text-[10px] truncate mt-0.5">
            {source.chunk}
            {source.page ? <span className="ml-1 px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">p.{source.page}</span> : null}
          </p>
        </div>

        {/* Score badge */}
        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${badge}`}>
          {pct}%
        </div>

        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {/* ── Similarity score bar ── */}
      <div className="pl-7">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-mono w-8 text-right">
            {(source.score ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
