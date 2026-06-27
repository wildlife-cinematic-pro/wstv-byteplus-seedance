'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Loader2, ChevronDown, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

/** Numbered step circle with glow effect when completed */
export function StepNumber({ num, active, completed }: { num: number; active: boolean; completed: boolean }) {
  return (
    <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border-2 transition-all duration-300 ${
      completed ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_16px_rgba(52,211,153,0.6)] scale-105' :
      active ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]' :
      'bg-gray-800 border-gray-600 text-gray-500'
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
        <circle cx={s.svg / 2} cy={s.svg / 2} r={r} fill="none" stroke="currentColor" className="text-gray-700" strokeWidth={s.stroke} />
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
      <Progress value={pct} className={`h-2 bg-gray-800 ${barColor}`} />
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
          <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">{count}/{maxCount}</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
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
      {showLabel && <span className={`${subSizes[size]} text-gray-500`}>≈ ¥{cny.toFixed(2)}</span>}
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
