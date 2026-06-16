import { useCallback, useEffect, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { api } from "@/lib/api";
import { FilmIcon, RefreshIcon } from "./ui/Icon";

function basename(path: string): string | null {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || null;
}

export function VideoPreview() {
  const { result } = useDashboard();
  const [latest, setLatest] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const r = await api.latestVideo();
      setLatest(r.exists && r.name ? r.name : null);
    } catch {
      setLatest(null);
    }
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-check whenever a run completes (paid output, or latest after a dry run).
  useEffect(() => {
    if (result) refresh();
  }, [result, refresh]);

  const fromResult = result?.mp4_path ? basename(result.mp4_path) : null;
  const name = fromResult || latest;

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row between">
        <span className="section-title">Preview</span>
        <button
          className="icon-btn sm"
          onClick={refresh}
          title="Refresh preview"
          aria-label="Refresh preview"
        >
          <RefreshIcon size={14} />
        </button>
      </div>

      {name ? (
        <>
          <div className="video-box">
            <video
              key={`${name}-${version}`}
              src={api.videoUrl(name, version)}
              controls
              playsInline
              preload="metadata"
            />
          </div>
          <span className="small faint mono" style={{ wordBreak: "break-all" }}>
            {name}
          </span>
        </>
      ) : (
        <div className="video-empty">
          <FilmIcon size={22} />
          <span className="small">
            No generated video yet. Dry runs don’t produce a video — paid runs appear here.
          </span>
        </div>
      )}
    </div>
  );
}
