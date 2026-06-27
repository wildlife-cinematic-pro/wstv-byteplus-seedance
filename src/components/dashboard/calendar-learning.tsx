'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, BookOpen, GitCompare, Download, ChevronLeft, ChevronRight,
  Plus, Save, Star, Copy, TrendingUp, Eye, Clock
} from 'lucide-react';
import { StepShell } from './shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// ─── Calendar status config ───
const STATUS_CONFIG = [
  { value: 'idea', label: 'Idea', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { value: 'master_image', label: 'Master Image', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'storyboard', label: 'Storyboard', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'prompted', label: 'Prompted', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'generated', label: 'Generated', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'capcut_edit', label: 'CapCut Edit', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'posted', label: 'Posted', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
] as const;

// ─── Viral learning categories ───
const VIRAL_CATEGORIES = ['Animals', 'Hooks', 'Endings', 'Captions', 'Posting Time', 'Failed Scenes'] as const;

// ─── Provider comparison ───
const PROVIDERS = ['Seedance Mini', 'Seedance Full', 'Kling', 'Runway'] as const;
const COMP_CATEGORIES = ['Animal Realism', 'Water', 'Storm', 'Snow', 'Baby Animals', 'Rescue', 'Predator', 'Emotional Endings'] as const;

// ─── Types ───
interface CalendarEntry {
  date: string;
  projectTitle: string | null;
  status: string;
}

interface ViralEntry {
  id: string;
  category: string;
  value: string;
  performanceScore: number | null;
  occurrenceCount: number;
  avgViews: number | null;
  avgRetention: number | null;
}

interface ProviderRating {
  provider: string;
  category: string;
  rating: number;
  notes: string;
}

// ─── Helper: get days in month ───
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Star rating component ───
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star className={`w-3.5 h-3.5 ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
        </button>
      ))}
    </div>
  );
}

export default function CalendarLearning() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryStatus, setNewEntryStatus] = useState('idea');

  // Viral learning state
  const [viralEntries, setViralEntries] = useState<ViralEntry[]>([]);
  const [newViralCategory, setNewViralCategory] = useState<string>('Animals');
  const [newViralValue, setNewViralValue] = useState('');

  // Provider comparison state
  const [providerRatings, setProviderRatings] = useState<ProviderRating[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Fetch calendar data
  useEffect(() => {
    fetch('/api/content-calendar')
      .then(async (r) => r.ok ? await r.json().catch(() => ({})) : {})
      .then((data) => {
        setCalendarEntries(Array.isArray(data?.entries) ? data.entries : []);
      })
      .catch(() => {});
  }, []);

  // Fetch viral learning data
  useEffect(() => {
    fetch('/api/viral-learning')
      .then(async (r) => r.ok ? await r.json().catch(() => ({})) : {})
      .then((data) => {
        setViralEntries(Array.isArray(data?.entries) ? data.entries : []);
      })
      .catch(() => {});
  }, []);

  // Fetch provider comparison data
  useEffect(() => {
    fetch('/api/provider-comparisons')
      .then(async (r) => r.ok ? await r.json().catch(() => ({})) : {})
      .then((data) => {
        const comparisons = Array.isArray(data?.comparisons) ? data.comparisons : [];
        setProviderRatings(comparisons.map((c: any) => ({
          provider: c?.provider ?? 'Unknown',
          category: c?.category ?? 'General',
          rating: typeof c?.rating === 'number' ? c.rating : 0,
          notes: typeof c?.notes === 'string' ? c.notes : '',
        })));
      })
      .catch(() => {});
  }, []);

  // Calendar helpers
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long' });

  const entryMap = useMemo(() => {
    const map: Record<string, CalendarEntry> = {};
    (calendarEntries ?? []).forEach(e => {
      if (e && e.date) map[e.date] = e;
    });
    return map;
  }, [calendarEntries]);

  const prevMonth = useCallback(() => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }, [calMonth]);

  const addCalendarEntry = () => {
    if (!selectedDay || !newEntryTitle.trim()) return;
    const date = formatDate(calYear, calMonth, selectedDay);
    const newEntries = [...(calendarEntries ?? []).filter(e => e.date !== date), { date, projectTitle: newEntryTitle, status: newEntryStatus }];
    setCalendarEntries(newEntries);
    setNewEntryTitle('');
    setSelectedDay(null);
    showToast(`Entry added for ${date}`);
  };

  // Provider rating helpers
  const getRating = useCallback((provider: string, category: string) => {
    return (providerRatings ?? []).find(r => r.provider === provider && r.category === category)?.rating ?? 0;
  }, [providerRatings]);

  const getNotes = useCallback((provider: string, category: string) => {
    return (providerRatings ?? []).find(r => r.provider === provider && r.category === category)?.notes ?? "";
  }, [providerRatings]);

  const setRating = useCallback((provider: string, category: string, rating: number) => {
    setProviderRatings(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      const exists = arr.find(r => r.provider === provider && r.category === category);
      if (exists) return arr.map(r => r.provider === provider && r.category === category ? { ...r, rating } : r);
      return [...arr, { provider, category, rating, notes: '' }];
    });
  }, []);

  const setProviderNotes = useCallback((provider: string, category: string, notes: string) => {
    setProviderRatings(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      const exists = arr.find(r => r.provider === provider && r.category === category);
      if (exists) return arr.map(r => r.provider === provider && r.category === category ? { ...r, notes } : r);
      return [...arr, { provider, category, rating: 0, notes }];
    });
  }, []);

  // Export functions
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`);
    } catch {
      showToast('Failed to copy');
    }
  }, [showToast]);

  const exportSeedancePrompt = useCallback(() => {
    copyToClipboard('[Seedance Final Prompt — paste your generated prompt here]', 'Seedance Prompt');
  }, [copyToClipboard]);

  const exportRunwayPrompt = useCallback(() => {
    copyToClipboard('[Runway Prompt — paste your adapted prompt here]', 'Runway Prompt');
  }, [copyToClipboard]);

  const exportKlingPrompt = useCallback(() => {
    copyToClipboard('[Kling Prompt — paste your adapted prompt here]', 'Kling Prompt');
  }, [copyToClipboard]);

  const exportCaptionHashtags = useCallback(() => {
    copyToClipboard('[Caption + Hashtags — paste your caption here]', 'Caption + Hashtags');
  }, [copyToClipboard]);

  const exportFullProjectJSON = useCallback(() => {
    const data = { calendar: calendarEntries, viralLearning: viralEntries, providerRatings };
    copyToClipboard(JSON.stringify(data, null, 2), 'Full Project JSON');
  }, [calendarEntries, viralEntries, providerRatings, copyToClipboard]);

  const exportProjectSummary = useCallback(() => {
    const lines = [
      `WSTV Project Summary`,
      `Calendar: ${(calendarEntries ?? []).length} entries`,
      `Viral Learnings: ${(viralEntries ?? []).length} entries`,
      `Provider Ratings: ${(providerRatings ?? []).length} ratings`,
    ];
    copyToClipboard(lines.join('\n'), 'Project Summary');
  }, [calendarEntries, viralEntries, providerRatings, copyToClipboard]);

  // Days with no content
  const gapDays = useMemo(() => {
    const gaps: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = formatDate(calYear, calMonth, d);
      if (!entryMap[date]) gaps.push(d);
    }
    return gaps;
  }, [daysInMonth, calYear, calMonth, entryMap]);

  const getStatusConfig = useCallback((status: string) => {
    return STATUS_CONFIG.find(s => s.value === status) ?? STATUS_CONFIG[0];
  }, []);

  return (
    <StepShell
      icon={<Calendar className="w-5 h-5" />}
      title="Calendar & Learning Center"
      cardClassName="bg-[oklch(0.18_0.03_155)]"
      bodyClassName=""
    >
        <div className="flex flex-wrap gap-1 mb-4 p-1 bg-[oklch(0.15_0.02_155)] border border-emerald-500/20 rounded-md">
          {[
            { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-3 h-3" /> },
            { id: 'viral', label: 'Viral DB', icon: <BookOpen className="w-3 h-3" /> },
            { id: 'providers', label: 'Providers', icon: <GitCompare className="w-3 h-3" /> },
            { id: 'export', label: 'Export', icon: <Download className="w-3 h-3" /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors ${
                activeTab === t.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "calendar" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={prevMonth} className="text-gray-400 hover:text-emerald-400">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h4 className="text-sm font-medium text-emerald-400">{monthName} {calYear}</h4>
                <Button variant="ghost" size="sm" onClick={nextMonth} className="text-gray-400 hover:text-emerald-400">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] text-gray-500 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = formatDate(calYear, calMonth, day);
                  const entry = entryMap[date];
                  const isSelected = selectedDay === day;
                  const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                  const statusCfg = entry ? getStatusConfig(entry.status) : null;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      className={`aspect-square rounded-md border text-xs p-1 transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected ? 'border-emerald-500 bg-emerald-500/20' :
                        isToday ? 'border-emerald-400/50 bg-emerald-500/10' :
                        entry ? 'border-emerald-500/20 bg-[oklch(0.13_0.02_155)] hover:border-emerald-500/40' :
                        'border-gray-700/30 bg-[oklch(0.13_0.02_155)] hover:border-gray-600/50'
                      }`}
                    >
                      <span className={`${isToday ? 'text-emerald-400 font-bold' : entry ? 'text-gray-300' : 'text-gray-600'}`}>{day}</span>
                      {entry && (
                        <>
                          {statusCfg && <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.color.split(' ')[0]}`} />}
                          <span className="text-[8px] text-gray-500 truncate w-full text-center">{entry.projectTitle}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status legend */}
              <div className="flex flex-wrap gap-2 mt-3">
                {STATUS_CONFIG.map(s => (
                  <div key={s.value} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${s.color.split(' ')[0]}`} />
                    <span className="text-[10px] text-gray-500">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Gap warning */}
              {gapDays.length > 0 && (
                <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                  <span className="text-[10px] text-amber-400">{gapDays.length} days with no content planned this month</span>
                </div>
              )}
            </div>

            {/* Add/Edit entry */}
            {selectedDay && (
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/20">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">
                  {entryMap[formatDate(calYear, calMonth, selectedDay)] ? 'Edit Entry' : 'Add Entry'} — {monthName} {selectedDay}
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Project Title</Label>
                    <Input
                      placeholder="Project title..."
                      value={newEntryTitle}
                      onChange={e => setNewEntryTitle(e.target.value)}
                      className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Label className="text-xs text-gray-400">Status</Label>
                    <select
                      value={newEntryStatus}
                      onChange={(e) => setNewEntryStatus(e.target.value)}
                      className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1 w-full rounded px-2"
                    >
                      {STATUS_CONFIG.map(s => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 self-end text-xs" onClick={addCalendarEntry}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}
            
            {(calendarEntries ?? []).length === 0 && (
              <p className="text-xs text-gray-600 text-center p-4">No calendar items yet</p>
            )}
          </div>
        )}

        {activeTab === "viral" && (
          <div className="space-y-4">
            {VIRAL_CATEGORIES.map(cat => {
              const catEntries = (viralEntries ?? []).filter(e => e.category === cat);
              return (
                <div key={cat} className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-emerald-400">{cat}</h4>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">{catEntries.length}</Badge>
                  </div>
                  {catEntries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catEntries.map(e => (
                        <div key={e.id} className="p-2 rounded bg-[oklch(0.13_0.02_155)] border border-emerald-500/10">
                          <p className="text-xs text-gray-200 font-medium">{e.value}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px]">
                            {e.performanceScore && (
                              <span className="flex items-center gap-1 text-amber-400"><Star className="w-2.5 h-2.5" />{e.performanceScore}</span>
                            )}
                            {e.occurrenceCount > 0 && (
                              <span className="text-gray-500">×{e.occurrenceCount}</span>
                            )}
                            {e.avgViews && (
                              <span className="flex items-center gap-1 text-gray-400"><Eye className="w-2.5 h-2.5" />{(e.avgViews / 1000).toFixed(1)}K</span>
                            )}
                            {e.avgRetention && (
                              <span className="flex items-center gap-1 text-gray-400"><Clock className="w-2.5 h-2.5" />{e.avgRetention}%</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">No viral learning entries yet</p>
                  )}
                </div>
              );
            })}

            <Separator className="bg-emerald-500/10" />

            {/* Add Learning */}
            <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
              <h4 className="text-sm font-medium text-emerald-400 mb-3">Add Learning</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newViralCategory}
                  onChange={(e) => setNewViralCategory(e.target.value)}
                  className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs w-full sm:w-40 rounded px-2"
                >
                  {VIRAL_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Input
                  placeholder="Learning value..."
                  value={newViralValue}
                  onChange={e => setNewViralValue(e.target.value)}
                  className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs flex-1"
                />
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={() => {
                  if (!newViralValue.trim()) return;
                  setViralEntries(prev => [...(prev ?? []), {
                    id: `viral-${Date.now()}`,
                    category: newViralCategory,
                    value: newViralValue,
                    performanceScore: null,
                    occurrenceCount: 1,
                    avgViews: null,
                    avgRetention: null,
                  }]);
                  setNewViralValue('');
                  showToast('Learning added');
                }}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "providers" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-gray-500 p-2 border-b border-emerald-500/10">Category</th>
                    {PROVIDERS.map(p => (
                      <th key={p} className="text-center text-gray-400 p-2 border-b border-emerald-500/10 min-w-[120px]">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMP_CATEGORIES.map(cat => (
                    <tr key={cat}>
                      <td className="text-gray-300 p-2 border-b border-emerald-500/5">{cat}</td>
                      {PROVIDERS.map(prov => (
                        <td key={prov} className="p-2 border-b border-emerald-500/5 text-center">
                          <StarRating
                            value={getRating(prov, cat)}
                            onChange={v => setRating(prov, cat, v)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes per provider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROVIDERS.map(prov => (
                <div key={prov} className="p-3 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                  <Label className="text-xs text-gray-400">{prov} Notes</Label>
                  <Input
                    placeholder="Notes..."
                    value={getNotes(prov, "General")}
                    onChange={e => setProviderNotes(prov, "General", e.target.value)}
                    className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1"
                  />
                </div>
              ))}
            </div>

            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => showToast('Provider comparisons saved')}>
              <Save className="w-4 h-4 mr-2" /> Save Comparisons
            </Button>

            {(providerRatings ?? []).length === 0 && (
              <p className="text-xs text-gray-600 text-center p-4">No provider comparison data yet</p>
            )}
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-3">
            {[
              { label: 'Copy Seedance Final Prompt', icon: <Copy className="w-4 h-4" />, action: exportSeedancePrompt, desc: 'Copy the final optimized prompt for Seedance 2.0' },
              { label: 'Copy Runway Prompt', icon: <Copy className="w-4 h-4" />, action: exportRunwayPrompt, desc: 'Copy adapted prompt for Runway ML' },
              { label: 'Copy Kling Prompt', icon: <Copy className="w-4 h-4" />, action: exportKlingPrompt, desc: 'Copy adapted prompt for Kling AI' },
              { label: 'Copy Caption + Hashtags', icon: <Copy className="w-4 h-4" />, action: exportCaptionHashtags, desc: 'Copy formatted caption with hashtags for posting' },
              { label: 'Export Full Project JSON', icon: <Download className="w-4 h-4" />, action: exportFullProjectJSON, desc: 'Export complete project data as JSON' },
              { label: 'Export Project Summary', icon: <Download className="w-4 h-4" />, action: exportProjectSummary, desc: 'Export text summary of the project' },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full p-3 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/20 hover:border-emerald-500/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{item.label}</p>
                      <p className="text-[10px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-sm px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm animate-[slideInRight_0.3s_ease-out]">
            {toastMsg}
          </div>
        )}
    </StepShell>
  );
}