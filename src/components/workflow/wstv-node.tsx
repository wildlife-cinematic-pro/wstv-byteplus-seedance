"use client";

import { memo, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { WstvNode, WstvNodeData, PreviewKind } from "@/lib/workflow/types";
import { STATUS_LABEL } from "@/lib/workflow/types";
import { useWorkflowStore } from "@/lib/workflow/store";

const PREVIEW_STYLE: Record<PreviewKind, CSSProperties> = {
  master: {
    background:
      "radial-gradient(circle at 30% 30%, rgba(124,92,255,.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(34,211,238,.4), transparent 60%), #0a0e18",
  },
  image: {
    background:
      "linear-gradient(135deg,#1a2540,#0a0e18)",
  },
  story: { background: "#0a0e18" },
  video: { background: "linear-gradient(135deg,#231026,#0a0e18)" },
  frame: { background: "linear-gradient(135deg,#0c2018,#0a0e18)" },
  continue: { background: "linear-gradient(135deg,#241408,#0a0e18)" },
  upscale: { background: "linear-gradient(135deg,#0b1b33,#0a0e18)" },
  export: { background: "linear-gradient(135deg,#161d2e,#0a0e18)" },
};

function StatusPill({ status }: { status: WstvNodeData["status"] }) {
  const map: Record<WstvNodeData["status"], string> = {
    ready: "border-blue-500/40 text-blue-300 bg-blue-500/10",
    "running demo": "border-amber-500/50 text-amber-300 bg-amber-500/15 animate-pulse",
    done: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wide rounded border px-1.5 py-0.5 ${map[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function WstvNodeView({ id, data, selected }: NodeProps<WstvNode>) {
  const runMock = useWorkflowStore((s) => s.runMock);
  const running = data.status === "running demo";
  const done = data.status === "done";

  return (
    <div
      className={`wstv-node w-56 rounded-xl border bg-card shadow-lg overflow-hidden transition-shadow ${
        selected ? "border-2" : "border-border"
      } ${running ? "shadow-[0_0_24px_-4px_rgba(245,177,61,.5)]" : ""}`}
      style={{
        borderColor: selected ? data.color : undefined,
        "--wstv-accent": data.color,
      } as CSSProperties}
    >
      {data.inputs.map((p, i) => (
        <Handle
          key={`in-${p.id}`}
          type="target"
          position={Position.Left}
          id={p.id}
          style={{
            background: p.color,
            width: 10,
            height: 10,
            border: "2px solid var(--background)",
            top: `${((i + 1) / (data.inputs.length + 1)) * 100}%`,
          }}
        />
      ))}

      <div
        className="flex items-center gap-2 px-2.5 py-2 border-b border-border/60"
        style={{ background: `linear-gradient(180deg, ${data.color}22, transparent)` }}
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded-md text-[13px] font-extrabold text-black shrink-0"
          style={{ background: data.color }}
        >
          {data.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-foreground truncate leading-tight">{data.title}</p>
          <span
            className="inline-block text-[8.5px] font-bold uppercase tracking-wide rounded px-1 py-px text-black mt-0.5"
            style={{ background: data.color }}
          >
            {data.type}
          </span>
        </div>
        <StatusPill status={data.status} />
      </div>

      <div className="px-2.5 pt-1.5 pb-1 text-[10.5px] text-muted-foreground">{data.settings}</div>

      <div className="px-2.5 pb-2">
        <div className="relative h-[60px] rounded-md border border-border/60 overflow-hidden" style={PREVIEW_STYLE[data.preview]}>
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          {data.preview === "story" && (
            <div className="absolute inset-1 grid grid-cols-3 grid-rows-3 gap-[2px]">
              {Array.from({ length: 9 }).map((_, k) => (
                <span key={k} className="rounded-[2px]" style={{ background: "linear-gradient(135deg, rgba(245,177,61,.5), rgba(124,92,255,.25))" }} />
              ))}
            </div>
          )}
          {data.preview === "video" && (
            <div className="absolute inset-0 grid place-items-center text-pink-400/80 text-xl">▶</div>
          )}
          {data.preview === "frame" && (
            <div className="absolute inset-2 border-2 border-dashed border-emerald-400/60 rounded" />
          )}
          {data.preview === "upscale" && (
            <div className="absolute inset-0 grid place-items-center text-blue-300/80 text-[13px] font-extrabold tracking-widest">4K</div>
          )}
          {data.preview === "image" && (
            <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 60% 40%, rgba(34,211,238,.35), transparent 55%)" }} />
          )}
          {data.preview === "export" && (
            <div className="absolute inset-1.5 grid grid-cols-4 gap-[2px]">
              {Array.from({ length: 8 }).map((_, k) => (
                <span key={k} className="rounded-[2px] bg-slate-400/25" />
              ))}
            </div>
          )}
          {data.preview === "continue" && (
            <div className="absolute inset-0 grid place-items-center text-orange-300/70 text-base font-semibold">+5s</div>
          )}
          <span className="absolute left-1.5 bottom-1 text-[8.5px] uppercase tracking-wide text-white/70" style={{ textShadow: "0 1px 2px #000" }}>
            {data.previewLabel}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center gap-1 px-2.5 pb-2">
        <div className="min-w-0 flex-1">
          {data.inputs.length > 0 && (
            <p className="text-[8.5px] text-muted-foreground truncate">in: {data.inputs.map((p) => p.label).join(", ")}</p>
          )}
          {data.outputs.length > 0 && (
            <p className="text-[8.5px] text-muted-foreground truncate">out: {data.outputs.map((p) => p.label).join(", ")}</p>
          )}
          {data.inputs.length === 0 && data.outputs.length === 0 && (
            <p className="text-[8.5px] text-muted-foreground">no ports</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-t border-border/60 bg-muted/20">
        <span className="text-[9px] text-muted-foreground">est. $0.00 · demo</span>
        <button
          type="button"
          disabled={running}
          onClick={(e) => {
            e.stopPropagation();
            runMock(id);
          }}
          className="text-[10.5px] font-semibold rounded-md border border-border bg-card px-2 py-1 hover:border-[var(--wstv-accent)] hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {done ? "Re-run Mock" : "Run Mock"}
        </button>
      </div>

      {data.outputs.map((p, i) => (
        <Handle
          key={`out-${p.id}`}
          type="source"
          position={Position.Right}
          id={p.id}
          style={{
            background: p.color,
            width: 10,
            height: 10,
            border: "2px solid var(--background)",
            top: `${((i + 1) / (data.outputs.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

export const WstvNodeComponent = memo(WstvNodeView);
export default WstvNodeComponent;
