import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Search, Database, Palette, Building2, Save,
  ChevronRight, ExternalLink, AlertCircle, CheckCircle,
  Sliders, Server,
} from "lucide-react";

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0
        ${value ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200
          ${value ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`}
      />
    </button>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, children, badge }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-slate-800 font-semibold text-sm leading-none">{title}</h3>
          {subtitle && <p className="text-slate-400 text-[11px] mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-slate-700 text-sm font-medium leading-none">{label}</p>
        {hint && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Coming-soon placeholder ───────────────────────────────────────────────────
function ComingSoon() {
  return (
    <div className="flex items-center gap-2 py-2">
      <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      <span className="text-slate-400 text-xs">Configuration available in next release</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SettingsPanel() {
  // ── State — identical to original ────────────────────────────────────────
  const [llm,       setLlm]       = useState("gpt-4o");
  const [temp,      setTemp]      = useState(0.3);
  const [topK,      setTopK]      = useState(5);
  const [streaming, setStreaming] = useState(true);
  const [citations, setCitations] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-2xl space-y-4">

        {/* ── LLM Configuration ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Section icon={Bot} title="LLM Configuration" subtitle="Select model and sampling parameters">
            <div className="space-y-5">
              {/* Model */}
              <div>
                <label className="text-slate-500 text-xs font-medium block mb-2">Model</label>
                <select
                  value={llm}
                  onChange={(e) => setLlm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gemini-pro">Gemini 1.5 Pro</option>
                  <option value="claude-3">Claude 3.5 Sonnet</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-500 text-xs font-medium">Temperature</label>
                  <span className="text-indigo-600 text-xs font-semibold font-mono bg-indigo-50 px-2 py-0.5 rounded-md">
                    {temp}
                  </span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={temp}
                  onChange={(e) => setTemp(+e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-slate-300 text-[10px] mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* ── Retrieval Settings ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Section icon={Search} title="Retrieval Settings" subtitle="Control how documents are retrieved from Pinecone">
            <div className="space-y-5">
              {/* Top-K */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-500 text-xs font-medium">Top-K Chunks</label>
                  <span className="text-indigo-600 text-xs font-semibold font-mono bg-indigo-50 px-2 py-0.5 rounded-md">
                    {topK}
                  </span>
                </div>
                <input
                  type="range" min="1" max="20" step="1"
                  value={topK}
                  onChange={(e) => setTopK(+e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-slate-300 text-[10px] mt-1">
                  <span>Fewer (faster)</span>
                  <span>More (thorough)</span>
                </div>
              </div>

              {/* Vector store */}
              <div>
                <label className="text-slate-500 text-xs font-medium block mb-2">Vector Store</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                  <option>Pinecone (Cloud)</option>
                  <option>ChromaDB (Local)</option>
                  <option>Qdrant</option>
                </select>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* ── UI Preferences ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Section icon={Palette} title="UI Preferences" subtitle="Personalise your workspace experience">
            <div>
              <FieldRow label="Streaming responses" hint="Show tokens as they generate in real time">
                <Toggle value={streaming} onChange={setStreaming} />
              </FieldRow>
              <FieldRow label="Show source citations" hint="Display document references below AI answers">
                <Toggle value={citations} onChange={setCitations} />
              </FieldRow>
            </div>
          </Section>
        </motion.div>

        {/* ── Pinecone Config ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
          <Section icon={Database} title="Pinecone Configuration" subtitle="Vector database connection settings" badge="Connected">
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-emerald-700 text-xs font-semibold">enterprise-rag index · 768 dimensions</p>
                <p className="text-emerald-600 text-[10px] mt-0.5">Connected via environment variables</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            </div>
          </Section>
        </motion.div>

        {/* ── Supabase Config ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Section icon={Server} title="Supabase Configuration" subtitle="Database and auth connection settings">
            <ComingSoon />
          </Section>
        </motion.div>

        {/* ── Embedding Settings ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Section icon={Sliders} title="Embedding Settings" subtitle="Gemini embedding model configuration">
            <ComingSoon />
          </Section>
        </motion.div>

        {/* ── Workspace Preferences ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <Section icon={Building2} title="Workspace Preferences" subtitle="Organisation-level settings">
            <ComingSoon />
          </Section>
        </motion.div>

        {/* ── Save button ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.49 }}>
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </motion.div>

      </div>
    </div>
  );
}
