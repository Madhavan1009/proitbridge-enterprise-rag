import { Send, Paperclip, Globe, Keyboard } from "lucide-react";

export default function InputArea({ input, setInput, onSend, loading }) {
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      {/* ── Input card ── */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-lg shadow-slate-200/50 hover:border-indigo-300 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all overflow-hidden">

        {/* Text area */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about your documents…  (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="w-full px-4 pt-3.5 pb-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 outline-none resize-none leading-relaxed"
          style={{ minHeight: "26px", maxHeight: "160px" }}
        />

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-1.5 px-3 pb-3 pt-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attach</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web</span>
          </button>

          {/* Char counter */}
          <span className="ml-auto text-slate-300 text-[10px] font-mono">
            {input.length}/4096
          </span>

          {/* Keyboard hint */}
          <div className="hidden sm:flex items-center gap-1 text-slate-300 text-[10px] mr-1">
            <Keyboard className="w-3 h-3" />
            <span>Enter to send</span>
          </div>

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-slate-300 text-[10px] mt-2">
        ProITBridge AI &middot; Powered by Gemini&nbsp;2.5&nbsp;Flash&nbsp;+&nbsp;Pinecone&nbsp;RAG
      </p>
    </div>
  );
}
