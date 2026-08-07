'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FolderClock,
  Leaf,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

export interface Phase3Task {
  id: string;
  status: string;
  modelType: string;
  modelId: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  dryRunPassed: boolean;
  safetyPassed: boolean;
  costEstimate: number | null;
  costActual: number | null;
  actualTokens: number | null;
  actualBillingStatus: string | null;
  createdAt: string;
  updatedAt: string;
  pollCount: number;
  lastCheckedAt: string | null;
}

export interface Phase3InitialData {
  safeMode: boolean;
  tasks: Phase3Task[];
}

type FilterKey = 'all' | 'dry_run' | 'succeeded' | 'failed' | 'other';
type SortKey = 'newest' | 'oldest' | 'cost_high' | 'cost_low';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'dry_run', label: 'Dry Run' },
  { key: 'succeeded', label: 'Succeeded' },
  { key: 'failed', label: 'Failed' },
  { key: 'other', label: 'In progress / other' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'cost_high', label: 'Highest estimated cost' },
  { key: 'cost_low', label: 'Lowest estimated cost' },
];

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusLabel(task: Phase3Task): string {
  if (task.dryRunPassed) return 'Dry run passed';
  if (task.status === 'succeeded') return 'Completed';
  if (task.status === 'failed') return 'Failed';
  return task.status.replaceAll('_', ' ');
}

function StatusBadge({ task }: { task: Phase3Task }) {
  const passed = task.dryRunPassed || task.status === 'succeeded';
  const failed = task.status === 'failed';
  const className = passed
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
    : failed
      ? 'border-red-500/25 bg-red-500/10 text-red-200'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-200';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs capitalize ${className}`}>
      {passed ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : failed ? <XCircle className="h-3 w-3" aria-hidden="true" /> : null}
      {statusLabel(task)}
    </span>
  );
}

function MetricCard({ label, value, provenance, detail }: { label: string; value: string; provenance: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{provenance}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

export default function Phase3HistoryDashboard({ initialData }: { initialData: Phase3InitialData }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => initialData.tasks.find(task => task.id === selectedId) ?? null,
    [initialData.tasks, selectedId],
  );

  const filtered = useMemo(() => {
    let tasks = initialData.tasks;
    if (filter === 'dry_run') tasks = tasks.filter(t => t.dryRunPassed);
    else if (filter === 'succeeded') tasks = tasks.filter(t => t.status === 'succeeded');
    else if (filter === 'failed') tasks = tasks.filter(t => t.status === 'failed');
    else if (filter === 'other') tasks = tasks.filter(t => t.status !== 'succeeded' && t.status !== 'failed');

    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t =>
        t.id.slice(0, 8).toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.modelType.toLowerCase().includes(q) ||
        t.resolution.toLowerCase().includes(q),
      );
    }

    const sorted = [...tasks];
    switch (sort) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'cost_high':
        sorted.sort((a, b) => (b.costEstimate ?? 0) - (a.costEstimate ?? 0));
        break;
      case 'cost_low':
        sorted.sort((a, b) => (a.costEstimate ?? 0) - (b.costEstimate ?? 0));
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [initialData.tasks, filter, search, sort]);

  const totals = useMemo(() => ({
    total: initialData.tasks.length,
    dryRunPassed: initialData.tasks.filter(t => t.dryRunPassed).length,
    completed: initialData.tasks.filter(t => t.status === 'succeeded').length,
    failed: initialData.tasks.filter(t => t.status === 'failed').length,
    estimated: initialData.tasks.reduce((sum, t) => sum + (t.costEstimate ?? 0), 0),
  }), [initialData.tasks]);

  const handleExport = () => {
    const sanitized = filtered.map(t => ({
      id: t.id,
      status: t.status,
      modelType: t.modelType,
      modelId: t.modelId,
      resolution: t.resolution,
      duration: t.duration,
      aspectRatio: t.aspectRatio,
      dryRunPassed: t.dryRunPassed,
      safetyPassed: t.safetyPassed,
      costEstimate: t.costEstimate,
      costActual: t.costActual,
      actualTokens: t.actualTokens,
      actualBillingStatus: t.actualBillingStatus,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      pollCount: t.pollCount,
      lastCheckedAt: t.lastCheckedAt,
    }));
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astv-history-sanitized.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectTask = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#090d0c] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-[#090d0c]/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1580px] flex-wrap items-center gap-3">
          <a
            href="/phase1"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-800 px-3 text-sm text-slate-300 transition hover:border-emerald-500/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Overview
          </a>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <FolderClock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">ASTV / History</p>
              <h1 className="truncate font-semibold text-slate-100">History</h1>
            </div>
          </div>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 text-sm text-emerald-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Safe Mode {initialData.safeMode ? 'ON' : 'server state'} · READ ONLY · no provider actions
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1580px] px-4 py-6 md:px-6">
        <section aria-label="History summary" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total tasks" value={String(totals.total)} provenance="Recorded" detail="Tasks loaded in this history view" />
          <MetricCard label="Dry-run passed" value={String(totals.dryRunPassed)} provenance="Recorded" detail="Passed validation in the loaded set" />
          <MetricCard label="Completed / succeeded" value={String(totals.completed)} provenance="Recorded" detail="Succeeded tasks in the loaded set" />
          <MetricCard label="Failed" value={String(totals.failed)} provenance="Recorded" detail="Failed tasks in the loaded set" />
          <MetricCard label="Estimated total cost" value={`$${totals.estimated.toFixed(2)}`} provenance="Estimate" detail="Sum of stored task estimates" />
        </section>

        <section aria-label="History controls" className="mb-5 grid gap-3 rounded-2xl border border-slate-900 bg-[#0d1210] p-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <label htmlFor="phase3-search" className="sr-only">Search history</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" aria-hidden="true" />
            <input
              id="phase3-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search task ID, status, model, resolution"
              className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            />
          </div>

          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="sr-only">Filter tasks</legend>
            {FILTERS.map(item => (
              <button
                key={item.key}
                type="button"
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
                className={`h-9 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
                  filter === item.key
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </fieldset>

          <div className="flex items-center gap-2">
            <label htmlFor="phase3-sort" className="text-xs text-slate-500">Sort</label>
            <select
              id="phase3-sort"
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-slate-800 bg-slate-950/60 px-2 text-sm text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              {SORTS.map(item => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section aria-label="Export" className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Leaf className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            Read-only audit metadata. No provider actions are available on this route.
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-800 px-3 text-sm text-slate-300 transition hover:border-emerald-500/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export sanitized JSON
          </button>
        </section>

        {initialData.tasks.length === 0 ? (
          <EmptyState title="No history available" message="Server data is unavailable or there are no recorded tasks yet. This view is read-only." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching records" message="No loaded tasks match the current search or filter. Adjust the controls above." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section aria-label="History records" className="rounded-2xl border border-slate-900 bg-[#0d1210]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">ASTV task history — read-only audit metadata</caption>
                  <thead>
                    <tr className="border-b border-slate-900 text-xs text-slate-600">
                      <th scope="col" className="px-5 py-3 font-medium">Task</th>
                      <th scope="col" className="px-5 py-3 font-medium">Status</th>
                      <th scope="col" className="px-5 py-3 font-medium">Model</th>
                      <th scope="col" className="px-5 py-3 font-medium">Output</th>
                      <th scope="col" className="px-5 py-3 font-medium">Dry run</th>
                      <th scope="col" className="px-5 py-3 font-medium">Estimate</th>
                      <th scope="col" className="px-5 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(task => (
                      <tr
                        key={task.id}
                        onClick={() => selectTask(task.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectTask(task.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-selected={selectedId === task.id}
                        aria-label={`View details for task ${task.id.slice(0, 8)}`}
                        className={`cursor-pointer border-b border-slate-900/80 text-sm last:border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-300 ${
                          selectedId === task.id ? 'bg-emerald-500/[0.06]' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <th scope="row" className="px-5 py-4 font-mono text-xs font-medium text-slate-400">{task.id.slice(0, 8)}</th>
                        <td className="px-5 py-4"><StatusBadge task={task} /></td>
                        <td className="px-5 py-4 capitalize text-slate-400">{task.modelType}</td>
                        <td className="px-5 py-4 text-slate-400">{task.resolution} · {task.duration}s</td>
                        <td className="px-5 py-4 text-slate-400">{task.dryRunPassed ? 'Passed' : '—'}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-400">{task.costEstimate == null ? '—' : `$${task.costEstimate.toFixed(2)}`}</td>
                        <td className="px-5 py-4 text-xs text-slate-600">{formatDate(task.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside aria-label="Task detail inspector">
              <DetailInspector task={selected} onClose={() => setSelectedId(null)} />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section aria-label="History status" className="rounded-2xl border border-dashed border-slate-800 bg-[#0d1210] p-10 text-center">
      <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
    </section>
  );
}

function DetailInspector({ task, onClose }: { task: Phase3Task | null; onClose: () => void }) {
  return (
    <section className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Read only audit metadata</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">Task inspector</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close task inspector"
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {!task ? (
        <p className="mt-6 text-sm text-slate-500">Select a task to inspect its read-only audit metadata.</p>
      ) : (
        <dl className="mt-4 space-y-3 text-sm">
          <InspectorRow term="Task ID" value={task.id.slice(0, 8)} />
          <InspectorRow term="Status" value={statusLabel(task)} />
          <InspectorRow term="Model" value={task.modelType} />
          <InspectorRow term="Model ID" value={task.modelId} />
          <InspectorRow term="Resolution" value={task.resolution} />
          <InspectorRow term="Duration" value={`${task.duration}s`} />
          <InspectorRow term="Aspect ratio" value={task.aspectRatio} />
          <InspectorRow term="Dry-run passed" value={task.dryRunPassed ? 'Yes' : 'No'} />
          <InspectorRow term="Safety passed" value={task.safetyPassed ? 'Yes' : 'No'} />
          <InspectorRow term="Estimated cost" value={task.costEstimate == null ? '—' : `$${task.costEstimate.toFixed(2)} (estimate)`} />
          <InspectorRow term="Actual cost" value={task.costActual == null ? 'Not recorded' : `$${task.costActual.toFixed(2)} (actual)`} />
          <InspectorRow term="Actual tokens" value={task.actualTokens == null ? 'Not recorded' : String(task.actualTokens)} />
          <InspectorRow term="Billing status" value={task.actualBillingStatus ?? 'Not recorded'} />
          <InspectorRow term="Created" value={formatDate(task.createdAt)} />
          <InspectorRow term="Updated" value={formatDate(task.updatedAt)} />
          <InspectorRow term="Poll count" value={String(task.pollCount)} />
          <InspectorRow term="Last checked" value={formatDate(task.lastCheckedAt)} />
        </dl>
      )}
    </section>
  );
}

function InspectorRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-900 pb-3 last:border-0 last:pb-0">
      <dt className="text-slate-600">{term}</dt>
      <dd className="text-right text-slate-300">{value}</dd>
    </div>
  );
}
