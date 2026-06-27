'use client';

import React, { useState, useContext, createContext } from 'react';
import { CheckCircle2, Clock, XCircle, Loader2, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/** Numbered step circle with glow effect when completed */
export function StepNumber({ num, active, completed }: { num: number; active: boolean; completed: boolean }) {
  return (
    <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border-2 transition-all duration-300 ${
      completed ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_16px_rgba(52,211,153,0.6)] scale-105' :
      active ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]' :
      'bg-muted border-border text-muted-foreground'
    }`}>
      {completed ? <CheckCircle2 className="w-4 h-4" /> : num}
    </div>
  );
}

/** Status badge with pulse animation for processing states */
export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; icon: React.ReactNode; pulse?: boolean }> = {
    draft: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <Clock className="w-3 h-3" /> },
    dry_run_passed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
    dry_run_failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
    submitted: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Loader2 className="w-3 h-3 animate-spin" />, pulse: true },
    processing: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Loader2 className="w-3 h-3 animate-spin" />, pulse: true },
    succeeded: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
    cancelled: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <XCircle className="w-3 h-3" /> },
  };
  const v = variants[status] || variants.draft;
  return (
    <Badge variant="outline" className={`${v.color} text-xs ${v.pulse ? 'animate-pulse' : ''}`}>
      {v.icon}
      <span className="ml-1">{status.replace(/_/g, ' ').toUpperCase()}</span>
    </Badge>
  );
}

/** Circular quality meter with color-coded score (0-100) */
export function QualityMeter({ score, label, size = 'md' }: { score: number; label?: string; size?: 'sm' | 'md' | 'lg' }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped <= 30 ? 'text-red-400' : clamped <= 60 ? 'text-amber-400' : clamped <= 80 ? 'text-emerald-400' : 'text-green-300';
  const ringColor = clamped <= 30 ? 'stroke-red-400' : clamped <= 60 ? 'stroke-amber-400' : clamped <= 80 ? 'stroke-emerald-400' : 'stroke-green-300';
  const sizes = { sm: { svg: 48, stroke: 3, text: 'text-xs' }, md: { svg: 72, stroke: 4, text: 'text-sm' }, lg: { svg: 96, stroke: 5, text: 'text-lg' } };
  const s = sizes[size];
  const r = (s.svg - s.stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamped / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={s.svg} height={s.svg} className="-rotate-90">
        <circle cx={s.svg / 2} cy={s.svg / 2} r={r} fill="none" stroke="currentColor" className="text-muted-foreground/60" strokeWidth={s.stroke} />
        <circle cx={s.svg / 2} cy={s.svg / 2} r={r} fill="none" className={ringColor} strokeWidth={s.stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <span className={`${s.text} font-bold ${color} -mt-[calc(${s.svg}px/2+8px)] mb-[calc(${s.svg}px/2-8px)]`}>{clamped}</span>
      {label && <span className="text-xs text-gray-400">{label}</span>}
    </div>
  );
}

/** Gate progress bar showing passed/total */
export function GateProgress({ passed, total, className }: { passed: number; total: number; className?: string }) {
  const pct = total > 0 ? (passed / total) * 100 : 0;
  const barColor = pct === 100 ? '[&>div]:bg-emerald-500' : pct >= 70 ? '[&>div]:bg-amber-400' : '[&>div]:bg-red-400';
  return (
    <div className={className}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{passed}/{total} gates passed</span>
        <span className={pct === 100 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400'}>{Math.round(pct)}%</span>
      </div>
      <Progress value={pct} className={`h-2 bg-muted ${barColor}`} />
    </div>
  );
}

/** Collapsible section with count badge */
export function CollapsibleSection({ title, icon, count, maxCount, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; count: number; maxCount: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-200">{title}</span>
          <Badge variant="outline" className="text-xs border-border text-gray-400">{count}/{maxCount}</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Cost display showing USD + CNY with color-coded budget status */
export function CostDisplay({ usd, cny, size = 'md', showLabel = true }: {
  usd: number; cny: number; size?: 'sm' | 'md' | 'lg'; showLabel?: boolean;
}) {
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const subSizes = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' };
  const color = usd <= 0.5 ? 'text-emerald-400' : usd <= 2 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${textSizes[size]} font-bold ${color}`}>${usd.toFixed(2)}</span>
      {showLabel && <span className={`${subSizes[size]} text-muted-foreground`}>≈ ¥{cny.toFixed(2)}</span>}
    </div>
  );
}

/** Compact status chip used in StepShell header summaries */
export function StepChip({ children, tone = 'emerald', className }: {
  children: React.ReactNode; tone?: 'emerald' | 'amber' | 'red' | 'muted'; className?: string;
}) {
  const tones: Record<string, string> = {
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    red: 'border-red-500/30 text-red-400 bg-red-500/10',
    muted: 'border-border text-muted-foreground bg-muted/30',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  );
}

/**
 * StepAccordion — coordinates a group of StepShells so only one is open at a
 * time and Prev/Next navigation can move between them. Provide the ordered list
 * of step `value`s and the value that should start open. StepShells with a
 * matching `value` become controlled by this provider; StepShells used outside a
 * provider stay self-managed (uncontrolled).
 */
interface StepAccordionCtx {
  openValue: string | null;
  setOpenValue: (v: string | null) => void;
  order: string[];
}
const StepAccordionContext = createContext<StepAccordionCtx | null>(null);

export function StepAccordion({ order, defaultOpenValue = null, children }: {
  order: string[];
  defaultOpenValue?: string | null;
  children: React.ReactNode;
}) {
  const [openValue, setOpenValue] = useState<string | null>(defaultOpenValue);
  return (
    <StepAccordionContext.Provider value={{ openValue, setOpenValue, order }}>
      {children}
    </StepAccordionContext.Provider>
  );
}

/**
 * Collapsible step container — a table-row style header (number/icon · title ·
 * summary chips · chevron) over a collapsible body. Replaces the per-step
 * Card/CardHeader/CardContent so every step shares one consistent, compact look
 * and can be collapsed to reduce vertical clutter. When given a `value` inside a
 * <StepAccordion>, it is driven by that provider and shows Prev/Next controls.
 */
export function StepShell({
  num, icon, title, value, active = false, completed = false,
  summary, headerBadge, defaultOpen = true,
  cardClassName, bodyClassName = 'space-y-4', children,
}: {
  num?: number;
  icon?: React.ReactNode;
  title: string;
  value?: string;
  active?: boolean;
  completed?: boolean;
  summary?: React.ReactNode;
  headerBadge?: React.ReactNode;
  defaultOpen?: boolean;
  cardClassName?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(StepAccordionContext);
  const controlled = ctx !== null && value !== undefined;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlled ? ctx!.openValue === value : uncontrolledOpen;
  const setOpen = controlled
    ? (o: boolean) => ctx!.setOpenValue(o ? value! : null)
    : setUncontrolledOpen;

  // Prev/Next targets (controlled mode only)
  const idx = controlled ? ctx!.order.indexOf(value!) : -1;
  const prevValue = idx > 0 ? ctx!.order[idx - 1] : null;
  const nextValue = idx >= 0 && idx < ctx!.order.length - 1 ? ctx!.order[idx + 1] : null;

  return (
    <div className={cn(
      'rounded-xl border bg-card overflow-hidden transition-colors duration-300',
      completed ? 'border-emerald-500/40' : 'border-emerald-500/20',
      cardClassName,
    )}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left group hover:bg-emerald-500/[0.04] data-[state=open]:bg-emerald-500/[0.02] transition-colors"
          >
            {icon
              ? <span className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">{icon}</span>
              : <StepNumber num={num ?? 0} active={active || open} completed={completed} />}
            <span className="text-base sm:text-lg font-semibold text-foreground flex-1 min-w-0 truncate">{title}</span>
            <div className="flex items-center gap-2 shrink-0">
              {headerBadge}
              {summary && <div className="hidden md:flex items-center gap-1.5">{summary}</div>}
              <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:text-emerald-400', open && 'rotate-180')} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className={cn('px-4 sm:px-5 pb-5 pt-0', bodyClassName)}>
            {children}
            {controlled && (
              <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-border/60">
                <Button
                  type="button" variant="ghost" size="sm"
                  disabled={!prevValue}
                  onClick={() => ctx!.setOpenValue(prevValue)}
                  className="text-muted-foreground hover:text-emerald-400 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  type="button" variant="ghost" size="sm"
                  disabled={!nextValue}
                  onClick={() => ctx!.setOpenValue(nextValue)}
                  className="text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/** Vertical connector line between steps */
export function StepConnector({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <div className="ml-4 w-0.5 h-4 transition-all duration-300"
      style={{
        background: completed
          ? 'linear-gradient(to bottom, #059669, #34d399)'
          : active
            ? 'linear-gradient(to bottom, rgba(16,185,129,0.3), rgba(16,185,129,0.1))'
            : 'rgba(75,85,99,0.3)',
      }}
    />
  );
}
