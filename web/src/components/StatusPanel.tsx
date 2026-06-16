import { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { api } from "@/lib/api";
import { Button, Card } from "./ui/primitives";
import { ChevronRight, FolderIcon, PlayIcon } from "./ui/Icon";
import { VideoPreview } from "./VideoPreview";

const QA_ITEMS = [
  { id: "duration", label: "Duration verified" },
  { id: "resolution", label: "Resolution verified" },
  { id: "orientation", label: "Vertical 9:16 verified" },
  { id: "loop", label: "Loop ending clean" },
];

export function StatusPanel() {
  const { result, statusBadge, lastVideoPath, generating, dryRunning } = useDashboard();
  const [openMsg, setOpenMsg] = useState("");
  const [qa, setQa] = useState<Record<string, boolean>>({});

  const busy = generating || dryRunning;
  const statusLine = busy
    ? generating
      ? "Generating paid video…"
      : "Running dry run…"
    : result
      ? result.ok
        ? `${result.submitted ? "Paid generation" : "Dry run"} succeeded.`
        : `${result.submitted ? "Paid generation" : "Dry run"} failed.`
      : "Ready.";

  const mp4 = result?.mp4_path || lastVideoPath || "";
  const folder = result?.video_folder || "";

  const openFolder = async () => {
    const r = await api.openVideoFolder();
    setOpenMsg(r.ok ? `Opened ${r.opened}` : r.error || "Could not open folder.");
  };
  const openLatest = async () => {
    const r = await api.openLatestVideo();
    setOpenMsg(r.ok ? `Opened ${r.opened}` : r.error || "No generated video found yet.");
  };

  return (
    <Card className="stack">
      <div className="card-head">
        <h2>Status</h2>
        <span className="badge">{statusBadge}</span>
      </div>

      <div
        className="callout"
        style={
          result && !result.ok && !busy
            ? { background: "var(--danger-bg)", color: "var(--danger)", border: "none" }
            : undefined
        }
      >
        <div>{statusLine}</div>
      </div>

      {result && !result.ok && result.error && (
        <p className="small" style={{ color: "var(--danger)" }}>
          {result.error}
        </p>
      )}

      <VideoPreview />

      {(result?.log || result?.error) && (
        <details className="disclose">
          <summary>
            <ChevronRight size={13} /> Technical details
          </summary>
          <pre className="log">{result.log || result.error}</pre>
        </details>
      )}

      {mp4 && (
        <div className="field">
          <span className="label">Downloaded MP4</span>
          <div className="path">{mp4}</div>
        </div>
      )}
      {folder && (
        <div className="field">
          <span className="label">Video folder</span>
          <div className="path">{folder}</div>
        </div>
      )}

      <div className="btn-split">
        <Button size="sm" onClick={openFolder}>
          <FolderIcon size={14} /> Open folder
        </Button>
        <Button size="sm" onClick={openLatest}>
          <PlayIcon size={14} /> Open latest video
        </Button>
      </div>
      {openMsg && <p className="small faint">{openMsg}</p>}

      <hr className="hr" />

      <div className="stack" style={{ gap: 8 }}>
        <span className="section-title">QA checklist</span>
        <p className="small faint" style={{ margin: 0 }}>
          Verify each item manually before publishing.
        </p>
        {QA_ITEMS.map((item) => (
          <label key={item.id} className="check">
            <input
              type="checkbox"
              checked={!!qa[item.id]}
              onChange={(e) => setQa((q) => ({ ...q, [item.id]: e.target.checked }))}
            />
            {item.label}
          </label>
        ))}
      </div>
    </Card>
  );
}
