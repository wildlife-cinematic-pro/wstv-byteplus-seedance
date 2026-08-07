'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

// ─── Types ───
interface ContentCalendarEntry {
  id: string;
  scheduledDate: string;
  projectTitle: string | null;
  animalStoryName: string | null;
  status: string;
  presetId: string | null;
  promptVersionId: string | null;
  qaId: string | null;
  postProductionId: string | null;
  performanceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Phase4ContentCalendarProps {
  initialSafeMode: boolean;
}

// ─── Status lifecycle (existing persisted values only) ───
const STATUS_VALUES = [
  'idea',
  'master_image',
  'storyboard',
  'prompted',
  'generated',
  'capcut_edit',
  'scheduled',
  'posted',
  'reviewed',
] as const;

const PRODUCTION_STATUSES = [
  'master_image',
  'storyboard',
  'prompted',
  'generated',
  'capcut_edit',
];

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  idea: { label: 'Idea', dot: 'bg-slate-400', badge: 'border-slate-500/30 bg-slate-500/10 text-slate-300' },
  master_image: { label: 'Master Image', dot: 'bg-blue-400', badge: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  storyboard: { label: 'Storyboard', dot: 'bg-purple-400', badge: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  prompted: { label: 'Prompted', dot: 'bg-amber-400', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  generated: { label: 'Generated', dot: 'bg-emerald-400', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  capcut_edit: { label: 'CapCut Edit', dot: 'bg-cyan-400', badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
  scheduled: { label: 'Scheduled', dot: 'bg-orange-400', badge: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
  posted: { label: 'Posted', dot: 'bg-green-400', badge: 'border-green-500/30 bg-green-500/10 text-green-300' },
  reviewed: { label: 'Reviewed', dot: 'bg-teal-400', badge: 'border-teal-500/30 bg-teal-500/10 text-teal-300' },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, dot: 'bg-slate-400', badge: 'border-slate-600/40 bg-slate-700/20 text-slate-300' };
}

type FilterKey = 'all' | 'idea' | 'production' | 'scheduled' | 'posted' | 'reviewed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'idea', label: 'Idea' },
  { key: 'production', label: 'Production' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'posted', label: 'Posted' },
  { key: 'reviewed', label: 'Reviewed' },
];

// ─── Helpers ───
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Derive the calendar day from the YYYY-MM-DD date portion of a stored ISO scheduledDate
// so timezone conversion never shifts which calendar day an entry lands on.
function dateKeyOf(isoDate: string): string {
  return String(isoDate).slice(0, 10);
}

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
}

// ─── Small UI atoms ───
function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs capitalize ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
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

function Field({
  label, id, children,
}: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'h-10 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300';

// ─── Main dashboard ───
export default function Phase4ContentCalendar({ initialSafeMode }: Phase4ContentCalendarProps) {
  // Default to the user's current calendar month in the browser (after mount to avoid hydration mismatch).
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const [entries, setEntries] = useState<ContentCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [inspectorId, setInspectorId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // ── Create / edit form state ──
  const [createForm, setCreateForm] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const now = new Date();
    const tKey = todayKey();
    setView({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDay(tKey);
  }, []);

  const monthParam = view ? `${view.year}-${pad(view.month + 1)}` : null;

  useEffect(() => {
    if (!monthParam) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetch(`/api/content-calendar?month=${monthParam}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('calendar request failed');
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data.map((item: Record<string, unknown>) => ({
              id: String(item.id ?? ''),
              scheduledDate: String(item.scheduledDate ?? ''),
              projectTitle: (item.projectTitle as string | null) ?? null,
              animalStoryName: (item.animalStoryName as string | null) ?? null,
              status: String(item.status ?? 'idea'),
              presetId: (item.presetId as string | null) ?? null,
              promptVersionId: (item.promptVersionId as string | null) ?? null,
              qaId: (item.qaId as string | null) ?? null,
              postProductionId: (item.postProductionId as string | null) ?? null,
              performanceId: (item.performanceId as string | null) ?? null,
              notes: (item.notes as string | null) ?? null,
              createdAt: String(item.createdAt ?? ''),
              updatedAt: String(item.updatedAt ?? ''),
            }))
          : [];
        setEntries(list);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setEntries([]);
        setLoadError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [monthParam, reload]);

  const byDate = useMemo(() => {
    const map = new Map<string, ContentCalendarEntry[]>();
    for (const entry of entries) {
      const key = dateKeyOf(entry.scheduledDate);
      const arr = map.get(key) ?? [];
      arr.push(entry);
      map.set(key, arr);
    }
    return map;
  }, [entries]);

  const selectedDayEntries = selectedDay ? (byDate.get(selectedDay) ?? []) : [];
  const inspectorEntry = entries.find((e) => e.id === inspectorId) ?? null;

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (filter === 'idea') list = list.filter((e) => e.status === 'idea');
    else if (filter === 'production') list = list.filter((e) => PRODUCTION_STATUSES.includes(e.status));
    else if (filter === 'scheduled') list = list.filter((e) => e.status === 'scheduled');
    else if (filter === 'posted') list = list.filter((e) => e.status === 'posted');
    else if (filter === 'reviewed') list = list.filter((e) => e.status === 'reviewed');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        (e.projectTitle ?? '').toLowerCase().includes(q) ||
        (e.animalStoryName ?? '').toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [entries, filter, search]);

  const totals = useMemo(() => {
    const total = entries.length;
    const scheduledPosted = entries.filter((e) => e.status === 'scheduled' || e.status === 'posted').length;
    const activePipeline = entries.filter((e) => PRODUCTION_STATUSES.includes(e.status) || e.status === 'idea').length;
    const reviewed = entries.filter((e) => e.status === 'reviewed').length;
    const openDays = view
      ? new Date(view.year, view.month + 1, 0).getDate() - byDate.size
      : 0;
    return { total, scheduledPosted, activePipeline, reviewed, openDays };
  }, [entries, byDate, view]);

  const calendarCells = useMemo(() => {
    if (!view) return [];
    const startDay = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: Array<{ dateKey: string; day: number | null }> = [];
    for (let i = 0; i < startDay; i++) cells.push({ dateKey: '', day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ dateKey: `${view.year}-${pad(view.month + 1)}-${pad(d)}`, day: d });
    }
    while (cells.length % 7 !== 0) cells.push({ dateKey: '', day: null });
    return cells;
  }, [view]);

  const tKey = todayKey();

  const selectDay = (dateKey: string) => {
    setSelectedDay(dateKey);
    setInspectorId(null);
    setShowCreate(false);
    setEditingId(null);
    setDeleteId(null);
  };

  const openEntry = (entry: ContentCalendarEntry) => {
    setInspectorId(entry.id);
    setSelectedDay(dateKeyOf(entry.scheduledDate));
    setShowCreate(false);
    setEditingId(null);
    setDeleteId(null);
  };

  const openCreate = () => {
    setShowCreate(true);
    setEditingId(null);
    setDeleteId(null);
    setCreateSuccess(false);
    setCreateError(false);
    setCreateForm({
      scheduledDate: selectedDay ?? tKey,
      projectTitle: '',
      animalStoryName: '',
      status: 'idea',
      notes: '',
      presetId: '',
      promptVersionId: '',
      qaId: '',
      postProductionId: '',
      performanceId: '',
    });
  };

  const openEdit = (entry: ContentCalendarEntry) => {
    setEditingId(entry.id);
    setShowCreate(false);
    setDeleteId(null);
    setUpdateSuccess(false);
    setUpdateError(false);
    setEditForm({
      scheduledDate: dateKeyOf(entry.scheduledDate),
      projectTitle: entry.projectTitle ?? '',
      animalStoryName: entry.animalStoryName ?? '',
      status: entry.status,
      notes: entry.notes ?? '',
    });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreateError(false);
    setCreateSuccess(false);
    const payload: Record<string, unknown> = {};
    const scheduledDate = createForm.scheduledDate || tKey;
    payload.scheduledDate = `${scheduledDate}T00:00:00.000Z`;
    if (createForm.projectTitle?.trim()) payload.projectTitle = createForm.projectTitle.trim();
    if (createForm.animalStoryName?.trim()) payload.animalStoryName = createForm.animalStoryName.trim();
    payload.status = createForm.status || 'idea';
    if (createForm.notes?.trim()) payload.notes = createForm.notes.trim();
    for (const key of ['presetId', 'promptVersionId', 'qaId', 'postProductionId', 'performanceId']) {
      if (createForm[key]?.trim()) payload[key] = createForm[key].trim();
    }
    try {
      const res = await fetch('/api/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('create failed');
      const created = await res.json();
      setCreateSuccess(true);
      setShowCreate(false);
      setReload((r) => r + 1);
      setSelectedDay(dateKeyOf(String(created.scheduledDate ?? scheduledDate)));
      setInspectorId(created?.id ?? null);
    } catch {
      setCreateError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setUpdateError(false);
    setUpdateSuccess(false);
    const payload = {
      scheduledDate: `${editForm.scheduledDate || tKey}T00:00:00.000Z`,
      projectTitle: editForm.projectTitle?.trim() || null,
      animalStoryName: editForm.animalStoryName?.trim() || null,
      status: editForm.status || 'idea',
      notes: editForm.notes?.trim() || null,
    };
    try {
      const res = await fetch(`/api/content-calendar/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('update failed');
      const updated = await res.json();
      setUpdateSuccess(true);
      setEditingId(null);
      const movedKey = dateKeyOf(String(updated.scheduledDate ?? payload.scheduledDate));
      const [y, m] = movedKey.slice(0, 7).split('-').map(Number);
      if (view && (y !== view.year || m - 1 !== view.month)) {
        setView({ year: y, month: m - 1 });
      }
      setSelectedDay(movedKey);
      setReload((r) => r + 1);
    } catch {
      setUpdateError(true);
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (entry: ContentCalendarEntry) => {
    setDeleteId(entry.id);
    setShowCreate(false);
    setEditingId(null);
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteError(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      // Content-Type: application/json satisfies the authoritative same-origin mutation guard.
      const res = await fetch(`/api/content-calendar/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error('delete failed');
      setDeleteId(null);
      setInspectorId((prev) => (prev === deleteId ? null : prev));
      setReload((r) => r + 1);
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  const changeMonth = (delta: number) => {
    setView((v) => (v ? { year: v.year, month: v.month + delta } : v));
  };

  const goToday = () => {
    const now = new Date();
    const tKeyNow = todayKey();
    setView({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDay(tKeyNow);
    setInspectorId(null);
  };

  const monthLabel = view
    ? new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(view.year, view.month, 1))
    : '';

  const monthDays = view ? new Date(view.year, view.month + 1, 0).getDate() : 0;

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
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">ASTV / Content Calendar</p>
              <h1 className="truncate font-semibold text-slate-100">Content Calendar</h1>
            </div>
          </div>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 text-sm text-emerald-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Safe Mode {initialSafeMode ? 'ON' : 'server state'} · PLANNING ONLY · no provider actions
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1580px] px-4 py-6 md:px-6">
        {/* Month navigation */}
        <section aria-label="Month navigation" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-900 bg-[#0d1210] p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-300 transition hover:border-emerald-500/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-300 transition hover:border-emerald-500/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="h-9 rounded-lg border border-slate-800 px-3 text-xs font-medium text-slate-300 transition hover:border-emerald-500/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Today
            </button>
            <h2 className="ml-2 min-w-0 truncate text-lg font-semibold text-slate-100">{monthLabel}</h2>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-500/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New entry
          </button>
        </section>

        {/* Summary cards */}
        <section aria-label="Month summary" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total entries" value={String(totals.total)} detail={`Entries loaded for ${monthLabel}`} />
          <MetricCard label="Scheduled / posted" value={String(totals.scheduledPosted)} detail="Ready or published planning items" />
          <MetricCard label="Active pipeline" value={String(totals.activePipeline)} detail="Idea through CapCut edit stages" />
          <MetricCard
            label="Open calendar days"
            value={String(totals.openDays)}
            detail={`${monthDays} days in month · Reviewed: ${totals.reviewed}`}
          />
        </section>

        {!view ? (
          <EmptyState title="Loading calendar" message="Preparing your content calendar…" />
        ) : loading ? (
          <EmptyState title="Loading calendar" message="Fetching this month's planning metadata…" />
        ) : loadError ? (
          <EmptyState title="Unable to load calendar" message="Calendar data could not be loaded. Please try again." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Left: calendar + agenda */}
            <div className="min-w-0 space-y-4">
              <section aria-label="Calendar" className="min-w-0 rounded-2xl border border-slate-900 bg-[#0d1210] p-4">
                <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <span key={d} className="px-1">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, idx) => {
                    if (!cell.dateKey) {
                      return <div key={`blank-${idx}`} className="min-w-0" aria-hidden="true" />;
                    }
                    const dayEntries = byDate.get(cell.dateKey) ?? [];
                    const isToday = cell.dateKey === tKey;
                    const isSelected = cell.dateKey === selectedDay;
                    return (
                      <button
                        key={cell.dateKey}
                        type="button"
                        aria-label={`${formatShortDate(cell.dateKey)}${dayEntries.length ? `, ${dayEntries.length} entries` : ''}`}
                        aria-pressed={isSelected}
                        onClick={() => selectDay(cell.dateKey)}
                        className={`min-w-0 rounded-lg border p-1 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-emerald-300 ${
                          isSelected
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : isToday
                              ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                              : 'border-slate-900 bg-slate-950/40 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                            isToday ? 'bg-emerald-500/20 text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          {cell.day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEntries.slice(0, 2).map((entry) => (
                            <span
                              key={entry.id}
                              className={`block h-1.5 w-4 rounded-full ${statusMeta(entry.status).dot}`}
                              title={statusMeta(entry.status).label}
                            />
                          ))}
                          {dayEntries.length > 2 ? (
                            <span className="block text-[10px] font-medium text-slate-500">+{dayEntries.length - 2}</span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section aria-label="Agenda" className="min-w-0 rounded-2xl border border-slate-900 bg-[#0d1210] p-4">
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">Agenda</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <label htmlFor="phase4-search" className="sr-only">Search agenda</label>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" aria-hidden="true" />
                      <input
                        id="phase4-search"
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search title, story, status"
                        className="h-9 w-56 max-w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                      />
                    </div>
                    <fieldset className="flex flex-wrap items-center gap-1.5">
                      <legend className="sr-only">Filter agenda</legend>
                      {FILTERS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          aria-pressed={filter === item.key}
                          onClick={() => setFilter(item.key)}
                          className={`h-8 rounded-lg border px-2.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${
                            filter === item.key
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                              : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </fieldset>
                  </div>
                </div>

                {filteredEntries.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    {entries.length === 0 ? 'No entries for this month.' : 'No entries match the current search or filter.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-900">
                    {filteredEntries.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => openEntry(entry)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${
                            inspectorId === entry.id ? 'bg-emerald-500/[0.06]' : ''
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-200">
                              {entry.projectTitle || 'Untitled project'}
                            </span>
                            {entry.animalStoryName ? (
                              <span className="block truncate text-xs text-slate-500">{entry.animalStoryName}</span>
                            ) : null}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-slate-500">{formatShortDate(dateKeyOf(entry.scheduledDate))}</span>
                            <StatusBadge status={entry.status} />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Right: inspector / create / edit / delete */}
            <aside aria-label="Calendar detail panel" className="min-w-0 space-y-4">
              {showCreate ? (
                <section aria-label="Create calendar entry" className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100">New calendar entry</h3>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      aria-label="Close create form"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 text-slate-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <Field label="Scheduled date" id="phase4-create-date">
                      <input
                        id="phase4-create-date"
                        type="date"
                        required
                        value={createForm.scheduledDate ?? ''}
                        onChange={(e) => setCreateForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Project title" id="phase4-create-title">
                      <input
                        id="phase4-create-title"
                        type="text"
                        value={createForm.projectTitle ?? ''}
                        onChange={(e) => setCreateForm((f) => ({ ...f, projectTitle: e.target.value }))}
                        placeholder="Optional project title"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Animal story name" id="phase4-create-story">
                      <input
                        id="phase4-create-story"
                        type="text"
                        value={createForm.animalStoryName ?? ''}
                        onChange={(e) => setCreateForm((f) => ({ ...f, animalStoryName: e.target.value }))}
                        placeholder="Optional story name"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Status" id="phase4-create-status">
                      <select
                        id="phase4-create-status"
                        value={createForm.status ?? 'idea'}
                        onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                        className={inputCls}
                      >
                        {STATUS_VALUES.map((s) => (
                          <option key={s} value={s}>{statusMeta(s).label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Notes" id="phase4-create-notes">
                      <textarea
                        id="phase4-create-notes"
                        value={createForm.notes ?? ''}
                        onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={3}
                        placeholder="Optional planning notes"
                        className={`${inputCls} h-auto py-2`}
                      />
                    </Field>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm font-medium text-emerald-200 transition hover:border-emerald-500/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Create entry'}
                    </button>
                    {createSuccess ? <p className="text-xs text-emerald-300">Entry created successfully.</p> : null}
                    {createError ? <p className="text-xs text-red-300">Could not create the entry. Please try again.</p> : null}
                  </form>
                </section>
              ) : null}

              {editingId ? (
                <section aria-label="Edit calendar entry" className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100">Edit entry</h3>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Close edit form"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 text-slate-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <Field label="Scheduled date" id="phase4-edit-date">
                      <input
                        id="phase4-edit-date"
                        type="date"
                        required
                        value={editForm.scheduledDate ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Project title" id="phase4-edit-title">
                      <input
                        id="phase4-edit-title"
                        type="text"
                        value={editForm.projectTitle ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, projectTitle: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Animal story name" id="phase4-edit-story">
                      <input
                        id="phase4-edit-story"
                        type="text"
                        value={editForm.animalStoryName ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, animalStoryName: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Status" id="phase4-edit-status">
                      <select
                        id="phase4-edit-status"
                        value={editForm.status ?? 'idea'}
                        onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                        className={inputCls}
                      >
                        {STATUS_VALUES.map((s) => (
                          <option key={s} value={s}>{statusMeta(s).label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Notes" id="phase4-edit-notes">
                      <textarea
                        id="phase4-edit-notes"
                        value={editForm.notes ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={3}
                        className={`${inputCls} h-auto py-2`}
                      />
                    </Field>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm font-medium text-emerald-200 transition hover:border-emerald-500/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                    {updateSuccess ? <p className="text-xs text-emerald-300">Entry updated successfully.</p> : null}
                    {updateError ? <p className="text-xs text-red-300">Could not update the entry. Please try again.</p> : null}
                  </form>
                </section>
              ) : null}

              {deleteId ? (
                <section aria-label="Delete entry confirmation" className="rounded-2xl border border-red-500/25 bg-[#0d1210] p-5">
                  <h3 className="text-sm font-semibold text-slate-100">Delete this calendar entry?</h3>
                  <p className="mt-2 text-sm text-slate-500">This removes planning metadata only.</p>
                  {deleteError ? <p className="mt-2 text-xs text-red-300">Could not delete the entry. Please try again.</p> : null}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={cancelDelete}
                      disabled={deleting}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-800 px-3 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deleting}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 px-3 text-sm text-red-200 transition hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300 disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Confirm delete'}
                    </button>
                  </div>
                </section>
              ) : null}

              <section aria-label="Selected day entries" className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
                <h3 className="text-sm font-semibold text-slate-100">
                  {selectedDay ? `Entries · ${formatShortDate(selectedDay)}` : 'Select a day'}
                </h3>
                {selectedDayEntries.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No entries on this day.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-900">
                    {selectedDayEntries.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => openEntry(entry)}
                          aria-label={`Inspect entry ${entry.id.slice(0, 8)}`}
                          className="flex w-full items-center justify-between gap-2 py-2 text-left transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                        >
                          <span className="min-w-0 truncate text-sm text-slate-300">{entry.projectTitle || 'Untitled'}</span>
                          <StatusBadge status={entry.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-label="Entry inspector" className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Read only planning metadata</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">Entry inspector</h3>
                {!inspectorEntry ? (
                  <p className="mt-4 text-sm text-slate-500">Select an entry to inspect its planning metadata.</p>
                ) : (
                  <>
                    <dl className="mt-4 space-y-3 text-sm">
                      <InspectorRow term="Entry ID" value={inspectorEntry.id.slice(0, 8)} />
                      <InspectorRow term="Scheduled date" value={formatDate(inspectorEntry.scheduledDate)} />
                      <InspectorRow term="Project title" value={inspectorEntry.projectTitle || '—'} />
                      <InspectorRow term="Animal story" value={inspectorEntry.animalStoryName || '—'} />
                      <InspectorRow term="Status" value={statusMeta(inspectorEntry.status).label} />
                      <InspectorRow term="Preset ID" value={inspectorEntry.presetId || '—'} />
                      <InspectorRow term="Prompt version ID" value={inspectorEntry.promptVersionId || '—'} />
                      <InspectorRow term="QA ID" value={inspectorEntry.qaId || '—'} />
                      <InspectorRow term="Post-production ID" value={inspectorEntry.postProductionId || '—'} />
                      <InspectorRow term="Performance ID" value={inspectorEntry.performanceId || '—'} />
                      <InspectorRow term="Notes" value={inspectorEntry.notes || '—'} />
                      <InspectorRow term="Created" value={formatDate(inspectorEntry.createdAt)} />
                      <InspectorRow term="Updated" value={formatDate(inspectorEntry.updatedAt)} />
                    </dl>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(inspectorEntry)}
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-800 px-3 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(inspectorEntry)}
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-red-500/40 px-3 text-sm text-red-200 transition hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300"
                      >
                        Delete entry
                      </button>
                    </div>
                  </>
                )}
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section aria-label="Calendar status" className="rounded-2xl border border-dashed border-slate-800 bg-[#0d1210] p-10 text-center">
      <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-300">
        <Leaf className="h-3.5 w-3.5" aria-hidden="true" /> Planning only · no provider actions
      </span>
    </section>
  );
}
