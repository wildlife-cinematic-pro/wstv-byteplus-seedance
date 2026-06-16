import { useDashboard, type StatusBadge } from "@/context/DashboardContext";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "./ui/primitives";
import { SafeModeToggle } from "./SafeModeToggle";
import { FacebookIcon, FilmIcon, MoonIcon, SunIcon } from "./ui/Icon";

export type Tab = "create" | "budget" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "create", label: "Create" },
  { id: "budget", label: "Budget" },
  { id: "history", label: "History" },
];

const STATUS_STYLE: Record<
  StatusBadge,
  { chip: string; color: string; pulse: boolean }
> = {
  READY: { chip: "badge", color: "var(--ok)", pulse: true },
  "DRY RUN OK": { chip: "badge ok", color: "currentColor", pulse: false },
  "PAID RECORDED": { chip: "badge ok", color: "currentColor", pulse: false },
  GENERATING: { chip: "badge warn", color: "currentColor", pulse: true },
  ERROR: { chip: "badge danger", color: "currentColor", pulse: false },
};

function StatusChip({ badge }: { badge: StatusBadge }) {
  const s = STATUS_STYLE[badge];
  return (
    <span className={s.chip}>
      {s.pulse ? (
        <span className="pulse-dot" style={{ color: s.color }} />
      ) : (
        <span className="dot" style={{ color: s.color }} />
      )}
      {badge}
    </span>
  );
}

export function TopBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { theme, toggle } = useTheme();
  const { statusBadge, budgetBlocked, tokenPackBlocked } = useDashboard();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="mark">
            <FilmIcon size={16} />
          </span>
          <span>
            WSTV Seedance
            <small>Local dashboard · 127.0.0.1</small>
          </span>
        </div>

        <div className="spacer" />

        <nav className="tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              className="tab"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="spacer" />

        <div className="row" style={{ gap: 10 }}>
          <StatusChip badge={statusBadge} />
          {(budgetBlocked || tokenPackBlocked) && <Badge tone="warn">BUDGET LOW</Badge>}
          <SafeModeToggle />
          <a
            className="icon-btn"
            href="https://www.facebook.com/wildstoriestv"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WSTV on Facebook"
            title="WSTV on Facebook"
          >
            <FacebookIcon size={16} />
          </a>
          <button
            className="icon-btn"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
