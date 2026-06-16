import { useDashboard } from "@/context/DashboardContext";
import { Badge, Button, Card } from "./ui/primitives";
import { RefreshIcon } from "./ui/Icon";

export function HistoryPanel() {
  const { history, refreshHistory } = useDashboard();

  return (
    <Card className="stack">
      <div className="card-head">
        <h2>Recent history</h2>
        <button className="icon-btn" onClick={refreshHistory} title="Refresh" aria-label="Refresh">
          <RefreshIcon size={16} />
        </button>
      </div>

      {history.length === 0 ? (
        <p className="small faint">No runs recorded yet. Dry-runs and paid submits appear here.</p>
      ) : (
        <div className="timeline">
          {history.map((h, i) => (
            <div className="tl-item" key={`${h.timestamp}-${i}`}>
              <Badge tone={h.submitted ? "solid" : "neutral"}>{h.submitted ? "PAID" : "DRY RUN"}</Badge>
              <Badge tone={h.ok ? "ok" : "danger"} dot>
                {h.ok ? "ok" : "failed"}
              </Badge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tl-file">{h.output_filename || "—"}</div>
                <div className="tl-meta mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.mp4_path || h.timestamp}
                </div>
              </div>
              {h.resolution && <span className="badge">{h.resolution}</span>}
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={refreshHistory}>
            Refresh
          </Button>
        </div>
      )}
    </Card>
  );
}
