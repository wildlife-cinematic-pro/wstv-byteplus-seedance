"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkflowStore } from "@/lib/workflow/store";
import { SAFETY_CHIPS } from "@/lib/workflow/graph";
import { STATUS_LABEL } from "@/lib/workflow/types";
import type { PromptState } from "@/lib/workflow/types";

const PROMPT_FIELDS: { key: keyof PromptState; label: string; area?: boolean }[] = [
  { key: "subject", label: "Subject" },
  { key: "environment", label: "Environment" },
  { key: "camera", label: "Camera movement" },
  { key: "lighting", label: "Lighting" },
  { key: "realism", label: "Realism" },
  { key: "safety", label: "Safety constraints", area: true },
];

export function Inspector() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedId = useWorkflowStore((s) => s.selectedId);
  const prompt = useWorkflowStore((s) => s.prompt);
  const setPrompt = useWorkflowStore((s) => s.setPrompt);
  const runMock = useWorkflowStore((s) => s.runMock);

  const node = nodes.find((n) => n.id === selectedId) ?? null;

  if (!node) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Select a node to inspect.</p>
      </div>
    );
  }

  const d = node.data;
  const running = d.status === "running demo";

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col min-h-0 h-full w-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <span className="grid place-items-center w-7 h-7 rounded text-[13px] font-bold text-black" style={{ background: d.color }}>
          {d.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground truncate">{d.title}</p>
          <p className="text-[10px] text-muted-foreground">{d.type} · stage in WSTV pipeline</p>
        </div>
        <StatusPill status={d.status} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          <p className="text-[11px] text-muted-foreground">{d.summary}</p>

          <div className="rounded-lg border border-border overflow-hidden">
            {(d.inputs.length > 0 || d.outputs.length > 0) ? (
              [...d.inputs, ...d.outputs].map((p) => (
                <div key={`${p.id}-${p.label}`} className="flex items-center justify-between px-2.5 py-1.5 border-b border-border last:border-b-0">
                  <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.label}
                  </span>
                  <Badge variant="outline" className="text-[8.5px] text-muted-foreground border-border">
                    {d.inputs.includes(p) ? "in" : "out"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">no ports</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Settings summary</p>
            <div className="rounded-md border border-dashed border-border bg-background px-2.5 py-2 text-[11px] text-foreground/90 leading-relaxed">
              {d.settings}
            </div>
          </div>

          {d.kind === "masterPrompt" && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Prompt helper</p>
              {PROMPT_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] text-muted-foreground mb-1">{f.label}</label>
                  {f.area ? (
                    <Textarea
                      value={prompt[f.key]}
                      onChange={(e) => setPrompt(f.key, e.target.value)}
                      className="text-[11px] min-h-[52px] bg-background"
                    />
                  ) : (
                    <Input
                      value={prompt[f.key]}
                      onChange={(e) => setPrompt(f.key, e.target.value)}
                      className="text-[11px] h-8 bg-background"
                    />
                  )}
                </div>
              ))}

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Safety language</p>
                <div className="flex flex-wrap gap-1">
                  {SAFETY_CHIPS.map((c) => (
                    <span key={c} className="text-[9.5px] rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-300 px-2 py-0.5">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Compiled master prompt (demo)</p>
                <div className="rounded-md border border-dashed border-border bg-background px-2.5 py-2 text-[11px] text-foreground/90 leading-relaxed">
                  {compiledPrompt(prompt)}
                </div>
              </div>
            </div>
          )}

          <Button
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            disabled={running}
            onClick={() => runMock(node.id)}
          >
            {d.status === "done" ? "Re-run Mock" : "Run Mock"}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

function compiledPrompt(p: PromptState): string {
  return `${p.subject}. ${p.environment}. Camera: ${p.camera}. Lighting: ${p.lighting}. ${p.realism}. Constraints: ${p.safety}.`;
}

function StatusPill({ status }: { status: "ready" | "running demo" | "done" }) {
  const map = {
    ready: "border-blue-500/40 text-blue-300 bg-blue-500/10",
    "running demo": "border-amber-500/50 text-amber-300 bg-amber-500/15 animate-pulse",
    done: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
  } as const;
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wide rounded border px-1.5 py-0.5 ${map[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
