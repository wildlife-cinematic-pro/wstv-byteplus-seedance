'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Film,
  FolderClock,
  Image as ImageIcon,
  LayoutDashboard,
  Leaf,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react';

interface Phase1Task {
  id: string;
  status: string;
  modelType: string;
  resolution: string;
  duration: number;
  dryRunPassed: boolean;
  costEstimate: number | null;
  createdAt: string;
}

interface Phase1InitialData {
  safeMode: boolean;
  budget: {
    monthlyLimit: number;
    spentThisMonth: number;
    currency: string;
  };
  tasks: Phase1Task[];
}

const workspaceItems = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Generate', icon: Sparkles, href: '/' },
  { label: 'Image', icon: ImageIcon, href: '/' },
  { label: 'Post-Production', icon: Film, href: '/' },
  { label: 'History', icon: FolderClock, href: '/phase3' },
  { label: 'Content Calendar', icon: CalendarDays, href: '/' },
];

const managementItems = [
  { label: 'Usage & Costs', icon: WalletCards, href: '/' },
  { label: 'Settings', icon: Settings, href: '/' },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusLabel(task: Phase1Task): string {
  if (task.dryRunPassed) return 'Dry run passed';
  if (task.status === 'succeeded') return 'Completed';
  if (task.status === 'failed') return 'Failed';
  return task.status.replaceAll('_', ' ');
}

export default function Phase1Dashboard({ initialData }: { initialData: Phase1InitialData }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    firstNavRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const closeMobileNav = () => {
    setMobileOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const estimatedSpend = initialData.tasks.reduce((sum, task) => sum + (task.costEstimate ?? 0), 0);
  const dryRunPassed = initialData.tasks.filter(task => task.dryRunPassed).length;
  const remainingBudget = Math.max(0, initialData.budget.monthlyLimit - initialData.budget.spentThisMonth);

  const navContent = (
    <>
      <div className="flex items-center gap-3 border-b border-emerald-950/70 px-4 pb-4 pt-1">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <Leaf className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold tracking-wide text-slate-100">ASTV</p>
          <p className="text-xs text-slate-500">Production Console</p>
        </div>
      </div>

      <nav aria-label="Workspace" className="mt-5 space-y-1 px-2">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</p>
        {workspaceItems.map((item, index) => {
          const Icon = item.icon;
          if (item.href) {
            return (
              <a
                key={item.label}
                ref={index === 0 ? firstNavRef : undefined}
                href={item.href}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
              </a>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              aria-current={item.active ? 'page' : undefined}
              aria-disabled={!item.active}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
                item.active
                  ? 'border border-emerald-500/20 bg-emerald-500/10 text-slate-100'
                  : 'cursor-not-allowed border border-dashed border-slate-800 text-slate-600'
              }`}
            >
              <Icon className={`h-4 w-4 ${item.active ? 'text-emerald-300' : ''}`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <nav aria-label="Management" className="mt-6 space-y-1 px-2">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Management</p>
        {managementItems.map(item => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
            </a>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6">
        <section aria-labelledby="safe-mode-heading" className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            <h2 id="safe-mode-heading" className="text-sm font-semibold text-emerald-200">Safe Mode</h2>
            <span className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              {initialData.safeMode ? 'ON · Locked' : 'Server state'}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Server-owned status. Phase 1 does not expose a browser control for changing safety gates.
          </p>
        </section>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#090d0c] text-slate-100">
      <a
        href="#phase1-main"
        className="sr-only z-[70] rounded-md bg-slate-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-900 bg-[#0d1210] p-3 lg:flex">
        {navContent}
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={closeMobileNav}
          className={`absolute inset-0 bg-black/70 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          aria-label="Mobile navigation"
          className={`absolute inset-y-0 left-0 flex w-[min(82vw,280px)] flex-col border-r border-slate-800 bg-[#0d1210] p-3 shadow-2xl transition-transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={closeMobileNav}
            aria-label="Close navigation"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg border border-slate-800 text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {navContent}
        </aside>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-900 bg-[#090d0c]/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-800 text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 lg:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-600">ASTV / <span className="text-slate-400">Overview</span></p>
              <h1 className="truncate text-sm font-semibold text-slate-200">Production overview</h1>
            </div>
            <div className="order-last flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200 sm:order-none sm:w-auto">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Safe Mode {initialData.safeMode ? 'ON' : 'server state'} · DRY RUN · paid calls blocked
            </div>
            <a
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-800 px-3 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Open current workspace
            </a>
          </div>
        </header>

        <main id="phase1-main" className="mx-auto max-w-[1480px] px-4 py-6 md:px-6 md:py-8">
          <section aria-labelledby="overview-heading">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Phase 1 preview</p>
                <h2 id="overview-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">Overview</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  A production-safe summary built from existing ASTV records. Values below are labelled by provenance and no provider action is available on this route.
                </p>
              </div>
              <a
                href="/"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                Continue current workflow
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Recent tasks" value={String(initialData.tasks.length)} provenance="Recorded" detail="Latest database task records" />
              <MetricCard label="Dry-run passes" value={String(dryRunPassed)} provenance="Recorded" detail="Passed validation in recent records" />
              <MetricCard label="Estimated task cost" value={`$${estimatedSpend.toFixed(2)}`} provenance="Estimate" detail="Sum of stored task estimates" />
              <MetricCard label="Budget remaining" value={`$${remainingBudget.toFixed(2)}`} provenance="Recorded" detail={`${initialData.budget.currency} budget snapshot`} />
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)]">
            <div className="overflow-hidden rounded-2xl border border-slate-900 bg-[#0d1210]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 px-4 py-4 md:px-5">
                <div>
                  <h2 className="font-semibold text-slate-100">Recent production records</h2>
                  <p className="mt-1 text-xs text-slate-600">Read-only database view · prompts remain private</p>
                </div>
                <span className="rounded-full border border-slate-800 px-2.5 py-1 text-[11px] text-slate-500">Recorded data</span>
              </div>
              <div className="overflow-x-auto" role="region" aria-label="Recent production records" tabIndex={0}>
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <caption className="sr-only">Recent ASTV production task records</caption>
                  <thead>
                    <tr className="border-b border-slate-900 text-xs text-slate-600">
                      <th scope="col" className="px-5 py-3 font-medium">Task</th>
                      <th scope="col" className="px-5 py-3 font-medium">Status</th>
                      <th scope="col" className="px-5 py-3 font-medium">Model</th>
                      <th scope="col" className="px-5 py-3 font-medium">Output</th>
                      <th scope="col" className="px-5 py-3 font-medium">Estimate</th>
                      <th scope="col" className="px-5 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialData.tasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-600">No recent production records.</td>
                      </tr>
                    ) : initialData.tasks.slice(0, 8).map(task => (
                      <tr key={task.id} className="border-b border-slate-900/80 text-sm last:border-0">
                        <th scope="row" className="px-5 py-4 font-mono text-xs font-medium text-slate-400">{task.id.slice(0, 8)}</th>
                        <td className="px-5 py-4"><StatusBadge status={task.status} passed={task.dryRunPassed}>{statusLabel(task)}</StatusBadge></td>
                        <td className="px-5 py-4 capitalize text-slate-400">{task.modelType}</td>
                        <td className="px-5 py-4 text-slate-400">{task.resolution} · {task.duration}s</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-400">{task.costEstimate == null ? '—' : `$${task.costEstimate.toFixed(2)}`}</td>
                        <td className="px-5 py-4 text-xs text-slate-600">{formatDate(task.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
                <h2 className="font-semibold text-slate-100">Safety posture</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <SafetyRow term="Safe Mode" value={initialData.safeMode ? 'ON' : 'Server state'} />
                  <SafetyRow term="Provider execution" value="Blocked on this route" />
                  <SafetyRow term="Paid-call control" value="Not rendered" />
                  <SafetyRow term="Data source" value="Existing app database" />
                </dl>
              </section>

              <section className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
                <h2 className="font-semibold text-slate-100">Implementation boundary</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Phase 1 introduces the approved app shell and Overview behind a separate route. Existing Generate, Image, Cost, Calendar, Post-Production and Settings workflows remain unchanged.
                </p>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </div>
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

function StatusBadge({ status, passed, children }: { status: string; passed: boolean; children: React.ReactNode }) {
  const className = passed || status === 'succeeded'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
    : status === 'failed'
      ? 'border-red-500/25 bg-red-500/10 text-red-200'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-200';
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs capitalize ${className}`}>{children}</span>;
}

function SafetyRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-900 pb-3 last:border-0 last:pb-0">
      <dt className="text-slate-600">{term}</dt>
      <dd className="text-right text-slate-300">{value}</dd>
    </div>
  );
}
