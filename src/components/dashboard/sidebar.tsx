'use client';

import { useState, useMemo, useCallback } from 'react';
import { History, TrendingUp, Search, Download, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from './shared';
import type { TaskHistory, BudgetInfo } from './types';

interface SidebarProps {
  open: boolean;
  taskHistory: TaskHistory[];
  budgetInfo: BudgetInfo | null;
}

type FilterKey = 'all' | 'dry_run' | 'paid' | 'failed';
const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'dry_run', label: 'Dry Run' },
  { key: 'paid', label: 'Simulation' },
  { key: 'failed', label: 'Failed' },
];
const filterSets: Record<FilterKey, string[]> = {
  all: [],
  dry_run: ['draft', 'dry_run_passed', 'dry_run_failed'],
  paid: ['submitted', 'processing', 'succeeded', 'failed'],
  failed: ['failed', 'dry_run_failed', 'cancelled'],
};

function BudgetRing({ spent, limit }: { spent: number; limit: number }) {
  const pct = Math.min((spent / limit) * 100, 100);
  const color = pct >= 90 ? 'stroke-red-400' : pct >= 70 ? 'stroke-amber-400' : 'stroke-emerald-400';
  const sz = 56, sw = 5, r = (sz - sw * 2) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={sz} height={sz} className="-rotate-90">
      <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="currentColor" className="text-gray-700" strokeWidth={sw} />
      <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" className={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

export function Sidebar({ open, taskHistory, budgetInfo }: SidebarProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let tasks = taskHistory;
    if (filter !== 'all') tasks = tasks.filter(t => filterSets[filter].includes(t.status));
    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t => t.prompt.toLowerCase().includes(q));
    }
    return tasks;
  }, [taskHistory, filter, search]);

  const handleExport = useCallback(() => {
    const data = taskHistory.map(({ id, status, prompt, costEstimate, modelType, resolution, duration, dryRunPassed, createdAt }) => ({
      id, status, prompt, costEstimate, modelType, resolution, duration, dryRunPassed, createdAt,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'wstv-tasks.json'; a.click();
    URL.revokeObjectURL(url);
  }, [taskHistory]);

  // Quick Stats
  const now = new Date();
  const thisMonth = taskHistory.filter(t => new Date(t.createdAt).getMonth() === now.getMonth() && new Date(t.createdAt).getFullYear() === now.getFullYear());
  const succeeded = thisMonth.filter(t => t.status === 'succeeded').length;
  const totalSpent = thisMonth.reduce((s, t) => s + (t.costEstimate ?? 0), 0);
  const modelCounts = thisMonth.reduce<Record<string, number>>((a, t) => { a[t.modelType] = (a[t.modelType] ?? 0) + 1; return a; }, {});
  const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  if (!open) return null;

  return (
    <div className="w-80 shrink-0 space-y-4 transition-all duration-200">
      {/* Quick Stats */}
      <Card className="bg-card border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-muted/40 border border-emerald-500/5 text-center">
              <p className="text-lg font-bold text-emerald-400">{thisMonth.length}</p>
              <p className="text-[10px] text-gray-500">Tasks</p>
            </div>
            <div className="p-2 rounded bg-muted/40 border border-emerald-500/5 text-center">
              <p className="text-lg font-bold text-emerald-400">{thisMonth.length ? Math.round((succeeded / thisMonth.length) * 100) : 0}%</p>
              <p className="text-[10px] text-gray-500">Success</p>
            </div>
            <div className="p-2 rounded bg-muted/40 border border-emerald-500/5 text-center">
              <p className="text-lg font-bold text-emerald-400">${totalSpent.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500">Spent</p>
            </div>
            <div className="p-2 rounded bg-muted/40 border border-emerald-500/5 text-center">
              <p className="text-lg font-bold text-emerald-400 capitalize">{topModel}</p>
              <p className="text-[10px] text-gray-500">Top Model</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task History */}
      <Card className="bg-card border-emerald-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" /> Task History
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleExport} className="h-6 px-2 text-[10px] text-gray-400 hover:text-emerald-400">
              <Download className="w-3 h-3 mr-1" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Filters */}
          <div className="flex gap-1">
            {filters.map(f => (
              <Button key={f.key} variant="ghost" size="sm"
                onClick={() => setFilter(f.key)}
                className={`h-6 px-2 text-[10px] ${filter === f.key ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>
                {f.label}
              </Button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..."
              className="h-7 text-xs pl-7 bg-muted/50 border-emerald-500/20 focus:border-emerald-500/50" />
          </div>
          <p className="text-[10px] text-gray-600">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          {/* Task List */}
          <ScrollArea className="max-h-64">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No tasks match</p>
            ) : (
              <div className="space-y-2">
                {filtered.map(task => (
                  <div key={task.id} className="p-2 rounded bg-muted/40 border border-emerald-500/5">
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={task.status} />
                      <span className="text-[10px] text-gray-600">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{task.prompt}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] h-4 px-1 ${task.modelType === 'mini' ? 'border-amber-500/30 text-amber-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                        {task.modelType === 'mini' ? 'Mini' : 'Full'}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 border-gray-600 text-gray-400">{task.duration}s</Badge>
                      <span className="text-[10px] text-gray-500">📸🎵🎬</span>
                      {task.dryRunPassed && <span className="text-[10px] text-emerald-400">✓ Dry</span>}
                      {task.costEstimate !== null && <span className="text-[10px] text-emerald-400 ml-auto">${task.costEstimate.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card className="bg-card border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {budgetInfo && (
            <>
              <div className="flex items-center gap-3">
                <BudgetRing spent={budgetInfo.spentThisMonth} limit={budgetInfo.monthlyLimit} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Spent</span>
                    <span className="text-sm text-gray-300">${budgetInfo.spentThisMonth.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Budget</span>
                    <span className="text-sm text-emerald-400">${budgetInfo.monthlyLimit.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Remaining</span>
                    <span className="text-sm text-emerald-400">${(budgetInfo.monthlyLimit - budgetInfo.spentThisMonth).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Progress value={(budgetInfo.spentThisMonth / budgetInfo.monthlyLimit) * 100} className="h-1.5" />
              {(() => {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const daysElapsed = now.getDate();
                const dailyAvg = daysElapsed > 0 ? budgetInfo.spentThisMonth / daysElapsed : 0;
                const projected = dailyAvg * daysInMonth;
                const daysRemaining = daysInMonth - daysElapsed;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Daily avg</span>
                      <span className="text-[10px] text-gray-400">${dailyAvg.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Projected monthly</span>
                      <span className={`text-[10px] ${projected > budgetInfo.monthlyLimit ? 'text-red-400' : 'text-gray-400'}`}>${projected.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Days remaining</span>
                      <span className="text-[10px] text-gray-400">{daysRemaining}</span>
                    </div>
                    {budgetInfo.spentThisMonth >= budgetInfo.monthlyLimit * budgetInfo.alertThreshold && (
                      <p className="text-[10px] text-amber-400 bg-amber-500/10 rounded px-2 py-1">
                        ⚠ Over {(budgetInfo.alertThreshold * 100).toFixed(0)}% budget used
                      </p>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
