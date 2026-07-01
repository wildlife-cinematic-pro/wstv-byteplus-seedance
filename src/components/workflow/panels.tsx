"use client";

import { ShieldCheck, ShieldOff, ShieldAlert, FlaskConical, Play, RotateCcw, History, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KIND_ORDER, NODE_CATALOG, PRESETS } from "@/lib/workflow/graph";
import { useWorkflowStore } from "@/lib/workflow/store";
import type { NodeKind } from "@/lib/workflow/types";

export function WorkflowTopBar() {
  const runAll = useWorkflowStore((s) => s.runAll);
  const resetAll = useWorkflowStore((s) => s.resetAll);
  const busyAll = useWorkflowStore((s) => s.busyAll);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-2 mr-1">
        <FlaskConical className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold text-foreground">WSTV Workflow Studio</span>
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">Prototype</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/15">
          <span className="mr-1">●</span>Demo Mode
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/40">
          <ShieldOff className="w-3 h-3 mr-1" />Real API Disabled
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/40">
          <ShieldCheck className="w-3 h-3 mr-1" />No Paid Calls
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
          <WifiOff className="w-3 h-3 mr-1" />No Network
        </Badge>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" onClick={runAll} disabled={busyAll} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8">
          <Play className="w-3.5 h-3.5 mr-1" />Run All Demo
        </Button>
        <Button size="sm" variant="outline" onClick={resetAll} className="h-8">
          <RotateCcw className="w-3.5 h-3.5 mr-1" />Reset Demo
        </Button>
      </div>
    </div>
  );
}

export function NodeLibrary() {
  const addNode = useWorkflowStore((s) => s.addNode);
  return (
    <div className="rounded-xl border border-border bg-card flex flex-col min-h-0 h-full w-full">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs font-semibold text-foreground">Node Library</p>
        <p className="text-[10px] text-muted-foreground">Click + to add a node</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {KIND_ORDER.map((kind: NodeKind) => {
            const c = NODE_CATALOG[kind];
            return (
              <div key={kind} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted/40">
                <span className="grid place-items-center w-6 h-6 rounded text-[11px] font-bold text-black" style={{ background: c.color }}>
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-[9px] text-muted-foreground">{c.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addNode(kind)}
                  className="w-5 h-5 grid place-items-center rounded border border-border bg-background text-foreground text-xs hover:border-emerald-500"
                  title={`Add ${c.title}`}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-border p-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Wildlife Presets</p>
        <div className="space-y-1">
          {PRESETS.map((p) => (
            <PresetButton key={p.id} id={p.id} icon={p.icon} name={p.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PresetButton({ id, icon, name }: { id: string; icon: string; name: string }) {
  const applyPreset = useWorkflowStore((s) => s.applyPreset);
  const preset = PRESETS.find((p) => p.id === id)!;
  return (
    <button
      type="button"
      onClick={() => applyPreset(preset.prompt)}
      className="w-full flex items-center gap-2 text-left rounded-md border border-border bg-background px-2 py-1 hover:border-violet-500"
    >
      <span className="text-sm">{icon}</span>
      <span className="text-[10.5px] text-foreground truncate">{name}</span>
    </button>
  );
}

export function SafetyCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <ShieldAlert className="w-3 h-3" />Safety
      </p>
      <Row ok label="Safety constraints active" />
      <Row ok label="No network requests" />
      <Row label="Real paid call blocked" danger />
      <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border">
        <span className="text-[11px] text-muted-foreground">Estimated cost</span>
        <span className="text-base font-bold text-emerald-400">
          $0.00 <span className="text-[10px] text-muted-foreground font-normal">demo</span>
        </span>
      </div>
    </div>
  );
}

function Row({ label, ok, danger }: { label: string; ok?: boolean; danger?: boolean }) {
  const color = ok ? "bg-emerald-500" : danger ? "bg-red-500" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function HistoryPanel() {
  const history = useWorkflowStore((s) => s.history);
  return (
    <div className="rounded-xl border border-border bg-card flex flex-col min-h-0">
      <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
        <History className="w-3.5 h-3.5 text-emerald-400" />
        <p className="text-xs font-semibold text-foreground">History</p>
        <span className="ml-auto text-[10px] text-muted-foreground">mock outputs</span>
      </div>
      <ScrollArea className="flex-1 max-h-40">
        <div className="p-2 space-y-1.5">
          {history.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic px-1 py-2">No outputs yet.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="rounded-md border border-border border-l-2 border-l-emerald-500 bg-background px-2 py-1.5">
                <p className="text-[11px] font-medium text-foreground">{h.label}</p>
                <p className="text-[9.5px] text-muted-foreground">{h.nodeTitle} · {h.time} · demo</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
