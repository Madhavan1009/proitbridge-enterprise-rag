import { motion } from "framer-motion";
import { Bot, User, BookMarked } from "lucide-react";
import SourceCard from "./SourceCard";

const msgVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function Message({ msg }) {
  const isUser    = msg.role === "user";
  const hasSources = !isUser && msg.sources?.length > 0;

  return (
    <motion.div
      variants={msgVariants}
      initial="hidden"
      animate="visible"
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* ── Avatar ── */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm
        ${isUser
          ? "bg-gradient-to-br from-violet-500 to-purple-600"
          : "bg-gradient-to-br from-indigo-500 to-blue-600"}`}
      >
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot  className="w-4 h-4 text-white" />
        }
      </div>

      {/* ── Content column ── */}
      <div className={`flex-1 max-w-2xl flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>

        {/* Sender label */}
        <span className="text-slate-400 text-[10px] font-medium px-1">
          {isUser ? "You" : "ProITBridge AI"}
        </span>

        {/* Bubble / Card */}
        {isUser ? (
          /* ── User bubble ── */
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-md shadow-indigo-200/60 max-w-lg">
            <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
          </div>
        ) : (
          /* ── AI card ── */
          <div className="w-full bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-700 text-sm leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
              {msg.content}
            </p>

            {/* ── Source citations ── */}
            {hasSources && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-3">
                  <BookMarked className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    Sources &middot; {msg.sources.length} reference{msg.sources.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {msg.sources.map((s, i) => (
                    <SourceCard key={i} source={s} idx={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timestamp + token count */}
        <div className="flex items-center gap-2 text-slate-300 text-[10px] px-1">
          <span>{msg.time}</span>
          {msg.tokens > 0 && (
            <>
              <span>&middot;</span>
              <span>{msg.tokens.toLocaleString()} tokens</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
