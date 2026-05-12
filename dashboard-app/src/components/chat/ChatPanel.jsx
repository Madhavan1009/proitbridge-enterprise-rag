import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Cpu } from "lucide-react";

// Preserved: exact same API function used in original
import { sendChatMessage } from "../../api.js";
import { WELCOME_MSG } from "../../utils.js";
import Message   from "./Message";
import InputArea from "./InputArea";

export default function ChatPanel() {
  // ── State — identical to original ────────────────────────────────────────
  const [messages,    setMessages]    = useState([WELCOME_MSG]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [contextUsed, setContextUsed] = useState(0);
  const [sessionId,   setSessionId]   = useState(null);
  const [error,       setError]       = useState(null);   // eslint-disable-line no-unused-vars
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send handler — logic identical to original ────────────────────────────
  const send = async () => {
    if (!input.trim() || loading) return;
    const query = input.trim();

    const userMsg = {
      id:   Date.now(),
      role: "user",
      content: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Preserved: exact same API call, exact same field reads
      const res = await sendChatMessage(query, { sessionId });
      if (res.session_id) setSessionId(res.session_id);

      const aiMsg = {
        id:      Date.now() + 1,
        role:    "assistant",
        content: res.answer,
        sources: res.citations   || [],
        time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tokens:  res.tokens_used || 0,
      };
      setMessages((p) => [...p, aiMsg]);
      setContextUsed((prev) => Math.min(prev + 8, 95));
    } catch (err) {
      setError(err.message);
      const errMsg = {
        id:      Date.now() + 1,
        role:    "assistant",
        content: `Something went wrong: ${err.message}. Please try again.`,
        sources: [],
        time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tokens:  0,
      };
      setMessages((p) => [...p, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50">

      {/* ── Context window bar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-200 bg-white">
        <Cpu className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-slate-500 text-[11px] font-medium">Context Window</span>
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-xs">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${contextUsed}%` }}
          />
        </div>
        <span className="text-slate-600 text-[11px] font-semibold font-mono">
          {contextUsed}%
        </span>
        <span className="text-slate-300 text-[11px] hidden sm:block">&middot;</span>
        <span className="text-slate-400 text-[11px] hidden sm:block">
          Gemini 2.5 Flash &middot; 1M ctx
        </span>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <Message key={m.id} msg={m} />
          ))}
        </AnimatePresence>

        {/* Typing / loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms"   }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-slate-400 text-xs">
                Retrieving from knowledge base…
              </span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <InputArea
        input={input}
        setInput={setInput}
        onSend={send}
        loading={loading}
      />
    </div>
  );
}
