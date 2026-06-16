import { useEffect, useState } from "react";
import { isWstvHost } from "@/lib/constants";
import { XIcon } from "./ui/Icon";

interface Props {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "comma" }
  | { kind: "invalid" }
  | { kind: "loading"; src: string; host: string; offHost: boolean }
  | { kind: "ready"; src: string; host: string; offHost: boolean }
  | { kind: "error"; host: string; offHost: boolean };

export function ImageField({ index, value, onChange, onRemove }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const label = `Image ${index + 1}`;
  const placeholder =
    index === 0
      ? "https://images.wildstoriestv.com/elephant_master.png"
      : "https://images.wildstoriestv.com/elephant_reference.png";

  useEffect(() => {
    const v = value.trim();
    if (!v) return setStatus({ kind: "idle" });
    if (v.includes(",")) return setStatus({ kind: "comma" });
    let url: URL;
    try {
      url = new URL(v);
    } catch {
      return setStatus({ kind: "invalid" });
    }
    const offHost = !isWstvHost(url.hostname);
    if (url.protocol !== "https:") {
      return setStatus({ kind: "error", host: url.hostname, offHost });
    }
    setStatus({ kind: "loading", src: v, host: url.hostname, offHost });
  }, [value]);

  const host = "host" in status ? status.host : "";
  const offHost = "offHost" in status ? status.offHost : false;
  const showThumb = status.kind === "loading" || status.kind === "ready";
  const hasExtra =
    status.kind === "comma" ||
    status.kind === "invalid" ||
    status.kind === "error" ||
    !!host ||
    showThumb;

  return (
    <div className="image-table-row">
      <div className="itr-main">
        <span className="itr-num">{index + 1}</span>
        <input
          className="itr-input"
          id={`imageUrl-${index}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
        <button
          type="button"
          className="itr-remove"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          title={`Remove ${label}`}
        >
          <XIcon size={15} />
        </button>
      </div>

      {hasExtra && (
        <div className="itr-extra">
          {status.kind === "comma" && (
            <div className="hint" style={{ color: "var(--danger)" }}>
              {label} must contain one URL only — use a separate row, not commas.
            </div>
          )}
          {status.kind === "invalid" && (
            <div className="hint" style={{ color: "var(--danger)" }}>
              Enter a valid HTTPS direct image URL.
            </div>
          )}
          {host && (
            <div className="hint">
              Host: <span className="mono">{host}</span>
              {offHost && (
                <span style={{ color: "var(--warn)" }}>
                  {" "}
                  · not images.wildstoriestv.com — confirm before paid generation
                </span>
              )}
            </div>
          )}
          {status.kind === "error" && (
            <div className="hint" style={{ color: "var(--danger)" }}>
              Preview failed. Check the direct image URL (HTTPS required).
            </div>
          )}
          {showThumb && (
            <img
              className="preview"
              alt={`${label} preview`}
              src={status.src}
              style={{ display: status.kind === "ready" ? "block" : "none" }}
              onLoad={() =>
                setStatus((s) =>
                  s.kind === "loading"
                    ? { kind: "ready", src: s.src, host: s.host, offHost: s.offHost }
                    : s,
                )
              }
              onError={() =>
                setStatus((s) =>
                  s.kind === "loading" || s.kind === "ready"
                    ? { kind: "error", host: s.host, offHost: s.offHost }
                    : s,
                )
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
