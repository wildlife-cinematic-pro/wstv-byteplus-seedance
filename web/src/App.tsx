import { useState } from "react";
import { DashboardProvider } from "./context/DashboardContext";
import { TopBar, type Tab } from "./components/TopBar";
import { CreatePanel } from "./components/create/CreatePanel";
import { StatusPanel } from "./components/StatusPanel";
import { BudgetPanel } from "./components/budget/BudgetPanel";
import { HistoryPanel } from "./components/HistoryPanel";

function CreateLayout() {
  return (
    <div className="create-layout">
      <div className="create-main">
        <CreatePanel />
      </div>
      <aside className="create-side">
        <StatusPanel />
      </aside>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("create");

  return (
    <DashboardProvider>
      <div className="app">
        <TopBar tab={tab} onTab={setTab} />
        <main className="shell">
          {tab === "create" && <CreateLayout />}
          {tab === "budget" && <BudgetPanel />}
          {tab === "history" && <HistoryPanel />}
        </main>
      </div>
    </DashboardProvider>
  );
}
