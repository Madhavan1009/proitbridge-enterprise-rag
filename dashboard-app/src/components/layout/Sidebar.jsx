import { MessageSquare, FileText, BarChart3, Settings, Plug, Users, Sparkles, ChevronRight, Building2 } from "lucide-react";

const NAV_ITEMS = [
  { id: "chat",      label: "AI Chat",    icon: MessageSquare },
  { id: "documents", label: "Documents",  icon: FileText      },
  { id: "analytics", label: "Analytics",  icon: BarChart3     },
  { id: "settings",  label: "Settings",   icon: Settings      },
];

const SYSTEM_ITEMS = [
  { id: "integrations", label: "Integrations", icon: Plug  },
  { id: "team",         label: "Team",         icon: Users },
];

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-slate-900 font-bold text-sm tracking-tight leading-none">
            PROITBRIDGE AI
          </div>
          <div className="text-indigo-500 text-[10px] font-medium mt-0.5">
            Enterprise Knowledge Platform
          </div>
        </div>
      </div>

      {/* ── Main navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors
                  ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
              )}
            </button>
          );
        })}

        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest px-3 mt-5 mb-3">
          Workspace
        </p>

        {SYSTEM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-150 group"
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-slate-500" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          );
        })}
      </nav>

      {/* ── Bottom brand / workspace card ── */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-800 text-xs font-bold truncate leading-none">
              PROITBRIDGE
            </div>
            <div className="text-slate-500 text-[10px] mt-0.5">
              Enterprise Workspace
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
