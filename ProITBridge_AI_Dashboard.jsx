import { useState, useRef, useEffect } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_DOCS = [
  { id: 1, name: "Product Requirements v2.4.pdf", size: "2.3 MB", chunks: 142, status: "indexed", type: "pdf", uploaded: "2h ago", color: "blue" },
  { id: 2, name: "Engineering Handbook 2025.pdf", size: "8.1 MB", chunks: 521, status: "indexed", type: "pdf", uploaded: "1d ago", color: "indigo" },
  { id: 3, name: "API Documentation.md", size: "340 KB", chunks: 89, status: "indexed", type: "md", uploaded: "3d ago", color: "violet" },
  { id: 4, name: "Company Policies Q1.docx", size: "1.1 MB", chunks: 67, status: "processing", type: "docx", uploaded: "5m ago", color: "sky" },
  { id: 5, name: "ML Research Notes.txt", size: "220 KB", chunks: 0, status: "queued", type: "txt", uploaded: "just now", color: "cyan" },
];

const MOCK_MESSAGES = [
  {
    id: 1, role: "assistant",
    content: "Hello! I'm the ProITBridge AI Knowledge Assistant. I have access to your indexed documents and can answer questions with precise source citations. How can I help you today?",
    sources: [], time: "10:42 AM", tokens: 38,
  },
  {
    id: 2, role: "user",
    content: "What are the authentication requirements from the Engineering Handbook?",
    time: "10:43 AM",
  },
  {
    id: 3, role: "assistant",
    content: "Based on the Engineering Handbook 2025, the authentication requirements are:\n\n**1. Multi-Factor Authentication (MFA)**\nAll production system access requires MFA using TOTP or hardware keys. SMS-based OTP is deprecated as of Q1 2025.\n\n**2. Token Expiry Policy**\nAccess tokens expire after 15 minutes. Refresh tokens have a 7-day rolling window with a hard cap of 30 days.\n\n**3. Service-to-Service Auth**\nAll internal microservices must use mTLS with certificates rotated every 90 days via the internal CA.\n\n**4. Password Policy**\nMinimum 16 characters, at least one uppercase, one digit, one special character. No reuse of last 12 passwords.",
    sources: [
      { doc: "Engineering Handbook 2025.pdf", page: 34, chunk: "Auth Requirements §4.2", score: 0.97 },
      { doc: "Engineering Handbook 2025.pdf", page: 36, chunk: "Token Policy §4.4", score: 0.91 },
      { doc: "API Documentation.md", page: null, chunk: "Security Headers", score: 0.82 },
    ],
    time: "10:43 AM", tokens: 187,
  },
];

const STATS = [
  { label: "Documents Indexed", value: "1,284", delta: "+12 today", icon: "📄", color: "from-blue-500 to-indigo-600" },
  { label: "Total Chunks", value: "84,291", delta: "+891 chunks", icon: "🧩", color: "from-violet-500 to-purple-600" },
  { label: "Queries Today", value: "2,847", delta: "+18% vs yesterday", icon: "💬", color: "from-sky-500 to-cyan-500" },
  { label: "Avg Retrieval", value: "142ms", delta: "↓ 12ms faster", icon: "⚡", color: "from-emerald-500 to-teal-500" },
];

const NAV_ITEMS = [
  { id: "chat", label: "AI Chat", icon: "💬", badge: null },
  { id: "documents", label: "Documents", icon: "📁", badge: "5" },
  { id: "analytics", label: "Analytics", icon: "📊", badge: null },
  { id: "settings", label: "Settings", icon: "⚙️", badge: null },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40 flex-shrink-0">
        P
      </div>
      <div>
        <div className="text-white font-bold text-sm tracking-tight leading-none">PROITBRIDGE</div>
        <div className="text-blue-400/70 text-[10px] font-medium tracking-widest uppercase mt-0.5">AI Knowledge</div>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-[#0d1117] border-r border-white/[0.06] flex flex-col h-full">
      <Logo />
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        <div className="text-white/25 text-[9px] font-bold uppercase tracking-widest px-3 mb-2">Main</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group
              ${active === item.id
                ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white border border-blue-500/20"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-bold">
                {item.badge}
              </span>
            )}
            {active === item.id && (
              <span className="w-1 h-1 rounded-full bg-blue-400"></span>
            )}
          </button>
        ))}

        <div className="text-white/25 text-[9px] font-bold uppercase tracking-widest px-3 mt-5 mb-2">System</div>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
          <span className="text-base">🔗</span>
          <span>Integrations</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
          <span className="text-base">👥</span>
          <span>Team</span>
        </button>
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] cursor-pointer transition-all">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">Madhavan</div>
            <div className="text-white/35 text-[10px]">AI Researcher</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ activeTab }) {
  const labels = { chat: "AI Chat Assistant", documents: "Knowledge Base", analytics: "Analytics", settings: "Settings" };
  return (
    <header className="h-14 flex-shrink-0 bg-[#0d1117]/80 backdrop-blur border-b border-white/[0.06] flex items-center px-5 gap-4">
      <div>
        <div className="text-white font-semibold text-sm">{labels[activeTab]}</div>
        <div className="text-white/35 text-[10px] font-medium">ProITBridge Enterprise · RAG v2.1</div>
      </div>
      <div className="flex-1 max-w-md ml-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search knowledge base..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white/70 placeholder-white/20 outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-400 text-[10px] font-semibold">RAG Engine Online</span>
        </div>
        <button className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.09] transition-all relative">
          🔔
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400 border border-[#0d1117]"></span>
        </button>
      </div>
    </header>
  );
}

function SourceCard({ source, idx }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/15 hover:bg-blue-500/10 transition-all cursor-pointer group">
      <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold flex-shrink-0 mt-0.5 group-hover:bg-blue-500/30 transition-all">
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-blue-300 text-[10px] font-semibold truncate">{source.doc}</div>
        <div className="text-white/40 text-[10px] truncate mt-0.5">{source.chunk}{source.page ? ` · p.${source.page}` : ""}</div>
      </div>
      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${source.score >= 0.9 ? "bg-emerald-500/15 text-emerald-400" : source.score >= 0.8 ? "bg-amber-500/15 text-amber-400" : "bg-white/10 text-white/40"}`}>
        {Math.round(source.score * 100)}%
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
        ${isUser ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white" : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"}`}>
        {isUser ? "M" : "AI"}
      </div>
      <div className={`flex-1 max-w-2xl ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? "bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/20 text-white/90 rounded-tr-sm"
            : "bg-white/[0.04] border border-white/[0.08] text-white/85 rounded-tl-sm"
          }`}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {msg.content}
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="w-full space-y-1.5">
            <div className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">Sources ({msg.sources.length})</div>
            <div className="space-y-1">
              {msg.sources.map((s, i) => <SourceCard key={i} source={s} idx={i} />)}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-white/20 text-[10px]">
          <span>{msg.time}</span>
          {msg.tokens && <span>· {msg.tokens} tokens</span>}
        </div>
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextUsed, setContextUsed] = useState(42);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now(), role: "user", content: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1, role: "assistant",
        content: "I've searched through your knowledge base and found relevant information. Based on the indexed documents, here's what I found regarding your query.\n\nThe documentation covers this topic in detail across multiple sources. The primary reference is from your Engineering Handbook, with supporting context from the API docs.",
        sources: [
          { doc: "Engineering Handbook 2025.pdf", page: 12, chunk: "Overview §1.2", score: 0.94 },
          { doc: "API Documentation.md", page: null, chunk: "Getting Started", score: 0.87 },
        ],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tokens: 124,
      };
      setMessages(p => [...p, aiMsg]);
      setContextUsed(prev => Math.min(prev + 8, 95));
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Context bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05] bg-[#0d1117]/40">
        <span className="text-white/30 text-[10px] font-medium uppercase tracking-wider">Context Window</span>
        <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700" style={{ width: `${contextUsed}%` }}></div>
        </div>
        <span className="text-white/35 text-[10px] font-mono">{contextUsed}% used</span>
        <span className="text-white/20 text-[10px]">·</span>
        <span className="text-white/25 text-[10px]">GPT-4o · 128K ctx</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin">
        {messages.map(m => <Message key={m.id} msg={m} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              <span className="text-white/30 text-xs ml-2">Retrieving from knowledge base...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06] bg-[#0d1117]/60">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-white/[0.04] border border-white/[0.10] rounded-2xl px-4 py-3 focus-within:border-blue-500/40 focus-within:bg-white/[0.06] transition-all">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about your documents... (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 outline-none resize-none leading-relaxed"
              style={{ minHeight: "20px", maxHeight: "120px" }}
            />
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.06]">
              <button className="text-white/30 hover:text-white/60 transition-all text-xs flex items-center gap-1">📎 Attach</button>
              <button className="text-white/30 hover:text-white/60 transition-all text-xs flex items-center gap-1">🌐 Web</button>
              <span className="ml-auto text-white/20 text-[10px] font-mono">{input.length}/4096</span>
            </div>
          </div>
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-900/40 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentsPanel() {
  const statusColor = { indexed: "emerald", processing: "amber", queued: "white" };
  const statusLabel = { indexed: "Indexed", processing: "Processing...", queued: "Queued" };
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
          ${dragging ? "border-blue-400/60 bg-blue-500/10" : "border-white/[0.10] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04]"}`}
      >
        <div className="text-3xl mb-3">📤</div>
        <div className="text-white/70 font-semibold text-sm mb-1">Drop files to index</div>
        <div className="text-white/30 text-xs mb-4">PDF, DOCX, TXT, MD, CSV · Max 50MB per file</div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-indigo-900/30">
          Browse Files
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">{s.icon}</span>
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${s.color}`}></div>
            </div>
            <div className="text-white font-bold text-xl leading-none mb-1">{s.value}</div>
            <div className="text-white/40 text-[10px] font-medium">{s.label}</div>
            <div className="text-emerald-400 text-[10px] mt-1">{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Document list */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
          <span className="text-white/70 text-sm font-semibold">Knowledge Base</span>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">{MOCK_DOCS.length} documents</span>
            <button className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 text-[10px] font-semibold hover:bg-blue-500/25 transition-all">+ Add</button>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {MOCK_DOCS.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-all group cursor-pointer">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0
                ${doc.type === "pdf" ? "bg-red-500/15 text-red-400" : doc.type === "md" ? "bg-emerald-500/15 text-emerald-400" : doc.type === "docx" ? "bg-blue-500/15 text-blue-400" : "bg-white/10 text-white/50"}`}>
                {doc.type === "pdf" ? "📕" : doc.type === "md" ? "📗" : doc.type === "docx" ? "📘" : "📄"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/80 text-xs font-semibold truncate group-hover:text-white transition-all">{doc.name}</div>
                <div className="text-white/30 text-[10px] mt-0.5">{doc.size} · {doc.chunks > 0 ? `${doc.chunks} chunks` : "pending"} · {doc.uploaded}</div>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
                ${doc.status === "indexed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                  : doc.status === "processing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                  : "bg-white/[0.06] text-white/30 border border-white/[0.08]"}`}>
                {doc.status === "processing" && <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></span>}
                {doc.status === "indexed" && <span className="w-1 h-1 rounded-full bg-emerald-400"></span>}
                {statusLabel[doc.status]}
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-all text-white/30 hover:text-red-400 text-xs px-2">🗑</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const bars = [65, 82, 54, 91, 78, 43, 88, 96, 72, 84, 61, 79, 88, 95];
  const queryTypes = [
    { label: "Technical docs", pct: 42, color: "from-blue-500 to-indigo-500" },
    { label: "Policy questions", pct: 28, color: "from-violet-500 to-purple-500" },
    { label: "HR & Operations", pct: 18, color: "from-sky-500 to-cyan-500" },
    { label: "Product queries", pct: 12, color: "from-emerald-500 to-teal-500" },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-white font-bold text-2xl leading-none">{s.value}</div>
            <div className="text-emerald-400 text-[10px] mt-1.5 flex items-center gap-1">▲ {s.delta}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-white/80 font-semibold text-sm">Query Volume</div>
            <div className="text-white/30 text-xs mt-0.5">Last 14 days</div>
          </div>
          <div className="text-white font-bold text-lg">2,847 <span className="text-emerald-400 text-xs font-normal">↑18%</span></div>
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-400 transition-all group-hover:from-blue-500 group-hover:to-indigo-300 opacity-70 group-hover:opacity-100"
                style={{ height: `${h}%` }}></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {["May 1", "", "", "", "May 5", "", "", "", "May 10", "", "", "", "May 14"].map((l, i) => (
            <div key={i} className="text-white/20 text-[9px] flex-1 text-center">{l}</div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
          <div className="text-white/70 font-semibold text-sm mb-4">Query Categories</div>
          <div className="space-y-3">
            {queryTypes.map((q, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-white/60 text-xs">{q.label}</span>
                  <span className="text-white/40 text-xs font-mono">{q.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${q.color}`} style={{ width: `${q.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
          <div className="text-white/70 font-semibold text-sm mb-4">Top Documents</div>
          <div className="space-y-2.5">
            {MOCK_DOCS.slice(0, 4).map((doc, i) => (
              <div key={i} className="flex items-center gap-2.5 group cursor-pointer">
                <span className="text-white/20 font-mono text-xs w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs truncate group-hover:text-white/80 transition-all">{doc.name}</div>
                  <div className="text-white/25 text-[10px]">{Math.floor(Math.random() * 400 + 100)} queries</div>
                </div>
                <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${75 - i * 15}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [llm, setLlm] = useState("gpt-4o");
  const [temp, setTemp] = useState(0.3);
  const [topK, setTopK] = useState(5);
  const [streaming, setStreaming] = useState(true);
  const [citations, setCitations] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl">
      {[
        {
          title: "LLM Configuration", icon: "🤖",
          content: (
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs font-medium block mb-2">Model</label>
                <select value={llm} onChange={e => setLlm(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2.5 text-white/70 text-sm outline-none focus:border-blue-500/40 transition-all">
                  <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gemini-pro">Gemini 1.5 Pro</option>
                  <option value="claude-3">Claude 3.5 Sonnet</option>
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium flex justify-between mb-2">
                  <span>Temperature</span><span className="text-blue-400 font-mono">{temp}</span>
                </label>
                <input type="range" min="0" max="1" step="0.05" value={temp} onChange={e => setTemp(+e.target.value)}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-white/20 text-[10px] mt-1"><span>Precise</span><span>Creative</span></div>
              </div>
            </div>
          )
        },
        {
          title: "Retrieval Settings", icon: "🔍",
          content: (
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs font-medium flex justify-between mb-2">
                  <span>Top-K Chunks</span><span className="text-blue-400 font-mono">{topK}</span>
                </label>
                <input type="range" min="1" max="20" step="1" value={topK} onChange={e => setTopK(+e.target.value)}
                  className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium block mb-2">Vector Store</label>
                <select className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2.5 text-white/70 text-sm outline-none focus:border-blue-500/40 transition-all">
                  <option>ChromaDB (Local)</option>
                  <option>Pinecone (Cloud)</option>
                  <option>Qdrant</option>
                </select>
              </div>
            </div>
          )
        },
        {
          title: "UI Preferences", icon: "🎨",
          content: (
            <div className="space-y-3">
              {[
                { label: "Streaming responses", sublabel: "Show tokens as they generate", val: streaming, set: setStreaming },
                { label: "Show source citations", sublabel: "Display document references below answers", val: citations, set: setCitations },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-white/70 text-sm font-medium">{item.label}</div>
                    <div className="text-white/30 text-xs">{item.sublabel}</div>
                  </div>
                  <button onClick={() => item.set(!item.val)}
                    className={`w-10 h-5.5 rounded-full transition-all duration-200 relative flex-shrink-0 ${item.val ? "bg-blue-500" : "bg-white/[0.12]"}`}
                    style={{ height: "22px" }}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${item.val ? "left-5" : "left-0.5"}`}></span>
                  </button>
                </div>
              ))}
            </div>
          )
        },
      ].map((section, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{section.icon}</span>
            <span className="text-white/80 font-semibold text-sm">{section.title}</span>
          </div>
          {section.content}
        </div>
      ))}

      <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-indigo-900/30 active:scale-[0.98]">
        Save Configuration
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("chat");

  const panels = {
    chat: <ChatPanel />,
    documents: <DocumentsPanel />,
    analytics: <AnalyticsPanel />,
    settings: <SettingsPanel />,
  };

  return (
    <div className="h-screen flex flex-col bg-[#080c12] overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        select option { background: #1a1f2e; color: white; }
        textarea { field-sizing: content; }
      `}</style>

      <TopBar activeTab={activeTab} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeTab} setActive={setActiveTab} />
        <main className="flex-1 flex overflow-hidden bg-[#0a0e16]">
          {panels[activeTab]}
        </main>
      </div>
    </div>
  );
}
