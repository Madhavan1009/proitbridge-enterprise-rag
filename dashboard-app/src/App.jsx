import { useState } from "react";

import Sidebar        from "./components/layout/Sidebar.jsx";
import TopBar         from "./components/layout/TopBar.jsx";
import ChatPanel      from "./components/chat/ChatPanel.jsx";
import DocumentsPanel from "./components/documents/DocumentsPanel.jsx";
import AnalyticsPanel from "./components/analytics/AnalyticsPanel.jsx";
import SettingsPanel  from "./components/settings/SettingsPanel.jsx";

export default function App() {
  // Preserved: same activeTab state and same hidden/visible panel pattern
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <TopBar activeTab={activeTab} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeTab} setActive={setActiveTab} />

        <main className="flex-1 flex overflow-hidden bg-slate-50">
          {/* All panels stay mounted so state is preserved on tab switch */}
          <div className={activeTab === "chat"      ? "flex-1 flex min-w-0 h-full"        : "hidden"}><ChatPanel      /></div>
          <div className={activeTab === "documents" ? "flex-1 flex min-w-0 h-full w-full" : "hidden"}><DocumentsPanel /></div>
          <div className={activeTab === "analytics" ? "flex-1 flex min-w-0 h-full w-full" : "hidden"}><AnalyticsPanel /></div>
          <div className={activeTab === "settings"  ? "flex-1 flex min-w-0 h-full w-full" : "hidden"}><SettingsPanel  /></div>
        </main>
      </div>
    </div>
  );
}
