// FILE 1: src/components/dashboard/client.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Leaf, Shield, ShieldCheck, ShieldOff, DollarSign, History, Cpu, Monitor, Keyboard, LayoutDashboard, Calculator, Film, Clapperboard, FolderOpen, Calendar, GraduationCap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepConnector } from '@/components/dashboard/shared';
import { StepPrompt } from '@/components/dashboard/step-prompt';
import { StepReferences } from '@/components/dashboard/step-references';
import { StepOutput } from '@/components/dashboard/step-output';
import { StepDryRun } from '@/components/dashboard/step-dryrun';
import { SeedancePayloadPreviewPanel } from '@/components/dashboard/seedance-payload-preview';
import { GenerateSafetyStrip } from '@/components/dashboard/generate-safety-strip';
import { OfficialQuickstartReference } from '@/components/dashboard/official-quickstart-reference';
import { ResourcePackBillingPanel } from '@/components/dashboard/resource-pack-billing';
import { StepPaid } from '@/components/dashboard/step-paid';
import { StepPreview } from '@/components/dashboard/step-preview';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ToastContainer } from '@/components/dashboard/toast';
import CostDashboard from '@/components/dashboard/cost-dashboard';
import { CostSettings } from '@/components/dashboard/cost-settings';
import ProductionWorkflow from '@/components/dashboard/production-workflow';
import ReferenceManager from '@/components/dashboard/reference-manager';
import PostProduction from '@/components/dashboard/post-production';
import CalendarLearning from '@/components/dashboard/calendar-learning';
import type { DryRunResult, TaskHistory, BudgetInfo, LatestVideo, Gates, ModelType, ToastMessage, ReferenceEntry } from '@/components/dashboard/types';
import { groupReferencesByType, remapReferenceRolesForMode } from '@/components/dashboard/types';

interface InitialData {
  safeMode: boolean;
  outputFolder: string;
  taskHistory: TaskHistory[];
  budget: BudgetInfo;
  latestVideo: LatestVideo | null;
}

export default function DashboardClient({ initialData }: { initialData: InitialData }) {
  const [activeTab, setActiveTab] = useState<string>('generation');
  const [safeMode, setSafeMode] = useState(initialData.safeMode);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [modelType, setModelType] = useState<ModelType>('full');

  // ─── PHASE4: Official Seedance 2.0 model ID + generation mode ───
  // seedanceModelId is the canonical BytePlus/ModelArk model identifier used
  // in payload validation and (future) real API calls. modelType ('full'|'mini')
  // is kept for backward compat with existing components.
  // WSTV default: Standard (dreamina-seedance-2-0-260128)
  const [seedanceModelId, setSeedanceModelId] = useState<string>('dreamina-seedance-2-0-260128');
  // WSTV default: reference_mode (master image + storyboard)
  const [generationMode, setGenerationMode] = useState<'reference_mode' | 'frame_mode'>('reference_mode');

  // ─── Paid Zone unlock state (LOCAL UI LOCK ONLY — not real security) ───
  // The unlock phrase is hardcoded in the frontend. Anyone with browser
  // devtools can bypass this. The real protection against accidental paid
  // submission remains:
  //   - Server-side safeMode check at /api/generate (returns 403 if on)
  //   - The 10 pre-submission gates
  //   - The SUBMIT_ONE_PAID_TASK confirmation text
  //   - The 3-second countdown
  // This lock ONLY hides the Paid Zone UI so it doesn't visually distract
  // the user during normal Dry-Run / Planning workflow.
  const [paidUnlocked, setPaidUnlocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);

  // ─── Unified Reference State ───
  const [references, setReferences] = useState<ReferenceEntry[]>([]);
  const [refRiskAcknowledged, setRefRiskAcknowledged] = useState(false);

  const [resolution, setResolution] = useState('720p');
  const [duration, setDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [maxCostUsd, setMaxCostUsd] = useState('');
  const [outputFilename, setOutputFilename] = useState('');
  const [fps, setFps] = useState(24);
  const [audioMode, setAudioMode] = useState('auto');
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [dryRunInvalidated, setDryRunInvalidated] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [paidLoading, setPaidLoading] = useState(false);
  const dryRunExists = useRef(false);
  const [latestVideo, setLatestVideo] = useState<LatestVideo | null>(initialData.latestVideo);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>(initialData.taskHistory);
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo>(initialData.budget);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helpers — stable references
  const addToastRef = useRef<(t: Omit<ToastMessage, 'id'>) => void>(() => {});
  const addToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    setToasts(prev => [...prev, { ...t, id: Math.random().toString(36).slice(2) }]);
  }, []);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Paid Zone unlock handlers (must be after addToast) ───
  // Restore unlock state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wstv_paid_unlocked');
      if (stored === 'true') setPaidUnlocked(true);
    } catch {
      // localStorage unavailable — leave locked
    }
  }, []);

  const handleUnlockSubmit = useCallback(() => {
    if (unlockInput.trim() === 'bimal2026') {
      setPaidUnlocked(true);
      setUnlockError(false);
      setUnlockInput('');
      try { localStorage.setItem('wstv_paid_unlocked', 'true'); } catch {}
      addToast({ type: 'info', title: 'Paid Zone Unlocked', message: 'Safe Mode is still ON — all gates still apply' });
    } else {
      setUnlockError(true);
    }
  }, [unlockInput, addToast]);

  const handleLockPaidZone = useCallback(() => {
    setPaidUnlocked(false);
    setUnlockInput('');
    setUnlockError(false);
    try { localStorage.removeItem('wstv_paid_unlocked'); } catch {}
    addToast({ type: 'info', title: 'Paid Zone Locked' });
  }, [addToast]);

  // Budget refresh function — used as a fallback when no detail payload is
  // included in the `wstv-budget-updated` event. When the event DOES carry
  // the new monthlyLimit (e.g. from CostSettings.handleSaveBudget), we apply
  // it directly without an extra network round-trip.
  const refreshBudgetInfo = useCallback(async () => {
    try {
      const r = await fetch('/api/cost-summary', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (r.ok) {
        const d = await r.json();
        if (d?.budget) setBudgetInfo(d.budget);
      }
    } catch (e) {
      console.error('Failed to refresh budget info', e);
    }
  }, []);

  // Refresh budget when Settings tab is opened — ensures the input field
  // shows the latest DB value even if the user opened Settings in another tab.
  useEffect(() => {
    if (activeTab === 'settings') {
      refreshBudgetInfo();
    }
  }, [activeTab, refreshBudgetInfo]);

  // Listen for budget updated custom event.
  // The event may carry `detail.monthlyLimit` (preferred path — no network
  // round trip). If detail is missing, fall back to a full GET refresh.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ monthlyLimit?: number; budget?: BudgetInfo }>).detail;
      if (detail?.monthlyLimit != null && budgetInfo) {
        // Optimistic update using the value returned by the POST handler.
        // `remainingBudget` is NOT in BudgetInfo — the sidebar computes it
        // inline as `monthlyLimit - spentThisMonth`, so we only patch the
        // fields that actually exist on the BudgetInfo type.
        setBudgetInfo({
          ...budgetInfo,
          monthlyLimit: detail.monthlyLimit,
        });
      } else if (detail?.budget) {
        setBudgetInfo(detail.budget);
      } else {
        // No detail payload — fall back to a full GET.
        refreshBudgetInfo();
      }
    };
    window.addEventListener('wstv-budget-updated', handler);
    return () => window.removeEventListener('wstv-budget-updated', handler);
  }, [refreshBudgetInfo, budgetInfo]);

  // Load references from DB on mount
  useEffect(() => {
    fetch('/api/reference-assets')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.assets) return;
        if (Array.isArray(d.assets) && d.assets.length > 0) {
          setReferences(d.assets.map((a: { id: string; assetType: string; role: string; url: string; label: string | null; notes: string | null; isActive: boolean; sortOrder: number }) => ({
            id: `${a.assetType}-${a.sortOrder}-${Date.now()}`,
            assetType: a.assetType as 'image' | 'video' | 'audio',
            role: a.role,
            url: a.url,
            label: a.label || '',
            notes: a.notes || '',
            isActive: a.isActive,
            sortOrder: a.sortOrder,
            dbId: a.id,
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Invalidation wrappers
  const invalidateIfNeeded = useCallback(() => { if (dryRunExists.current) setDryRunInvalidated(true); }, []);

  // Listen for "apply preset" events from the Workflow tab.
  // When a user clicks a preset card in ProductionWorkflow, it dispatches
  // `wstv-apply-preset` with detail.prompt. We populate the Generate tab
  // prompt box and switch to the Generate tab so the user sees it.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string; presetName?: string }>).detail;
      if (detail?.prompt) {
        setPrompt(detail.prompt);
        invalidateIfNeeded();
        setActiveTab('generation');
        addToast({ type: 'success', title: 'Preset Applied', message: detail.presetName ? `"${detail.presetName}" prompt loaded` : 'Preset prompt loaded' });
      }
    };
    window.addEventListener('wstv-apply-preset', handler);
    return () => window.removeEventListener('wstv-apply-preset', handler);
  }, [addToast, invalidateIfNeeded]);

  const setPromptV = useCallback((v: string) => { setPrompt(v); invalidateIfNeeded(); }, [invalidateIfNeeded]);
  const setMaxCostUsdV = useCallback((v: string) => { setMaxCostUsd(v); invalidateIfNeeded(); }, [invalidateIfNeeded]);
  const setDurationV = useCallback((v: number) => { setDuration(v); invalidateIfNeeded(); }, [invalidateIfNeeded]);
  const setAspectRatioV = useCallback((v: string) => { setAspectRatio(v); invalidateIfNeeded(); }, [invalidateIfNeeded]);
  const setModelTypeV = useCallback((v: ModelType) => {
    setModelType(v); invalidateIfNeeded();
    const avail = v === 'mini' ? ['480p', '720p'] : ['480p', '720p', '1080p', '4K'];
    setResolution(prev => avail.includes(prev) ? prev : avail[avail.length - 1]);
  }, [invalidateIfNeeded]);

  // ─── PHASE4: Seedance model ID + generation mode setters ───
  // When the user switches the Seedance model, auto-clamp the resolution to
  // the model's supported set (Fast/Mini only support 480p/720p).
  const setSeedanceModelIdV = useCallback((v: string) => {
    setSeedanceModelId(v); invalidateIfNeeded();
    // Import is at top of file via seedance-validation; use inline rules to avoid circular import
    const supported = v === 'dreamina-seedance-2-0-fast-260128' || v === 'dreamina-seedance-2-0-mini-260615'
      ? ['480p', '720p']
      : ['480p', '720p', '1080p', '4K'];
    setResolution(prev => supported.includes(prev) ? prev : '720p');
    // Sync legacy modelType for backward compat
    setModelType(v === 'dreamina-seedance-2-0-mini-260615' ? 'mini' : 'full');
  }, [invalidateIfNeeded]);

  const setGenerationModeV = useCallback((v: 'reference_mode' | 'frame_mode') => {
    setGenerationMode(v);
    // Realign image roles so the new mode's payload actually carries them.
    // (frame mode needs first_frame/last_frame; reference mode rejects those.)
    setReferences(prev => remapReferenceRolesForMode(prev, v));
    invalidateIfNeeded();
  }, [invalidateIfNeeded]);
  const setResolutionV = useCallback((v: string) => { setResolution(v); invalidateIfNeeded(); }, [invalidateIfNeeded]);
  const setFpsV = useCallback((v: number) => { setFps(v); invalidateIfNeeded(); }, [invalidateIfNeeded]);
  const setAudioModeV = useCallback((v: string) => { setAudioMode(v); invalidateIfNeeded(); }, [invalidateIfNeeded]);

  // Invalidate dry run when references change
  const setReferencesV = useCallback((action: React.SetStateAction<ReferenceEntry[]>) => {
    setReferences(action);
    invalidateIfNeeded();
  }, [invalidateIfNeeded]);

  useEffect(() => { if (dryRunResult) dryRunExists.current = true; }, [dryRunResult]);

  const onDryRunResult = useCallback((r: DryRunResult) => {
    setDryRunResult(r);
    if (r.passed) addToastRef.current({ type: 'success', title: 'Dry Run Passed', message: 'Ready for paid generation' });
    else if (r.errors.length) addToastRef.current({ type: 'error', title: 'Dry Run Failed', message: r.errors[0] });
  }, []);
  const onInvalidatedClear = useCallback(() => setDryRunInvalidated(false), []);

  // Keyboard shortcut: Ctrl+D for dry run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const btn = document.querySelector('[data-dry-run-btn]') as HTMLButtonElement;
        if (btn && !btn.disabled) btn.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleSafeMode = useCallback(async () => {
    const v = !safeMode;
    setSafeMode(v);
    addToast({ type: v ? 'info' : 'warning', title: v ? 'Safe Mode ON' : 'Safe Mode OFF', message: v ? 'Paid generation disabled' : 'Paid generation enabled — proceed with caution' });
    try { await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ safeMode: v }) }); } catch (e) { console.error(e); }
  }, [safeMode, addToast]);

  const refreshVideo = useCallback(async () => {
    try {
      const r = await fetch('/api/latest-video');
      if (r.ok) { const d = await r.json(); setLatestVideo(d.video); addToast({ type: 'info', title: 'Preview Refreshed' }); }
    } catch (e) { console.error(e); }
  }, [addToast]);

  const openFolder = useCallback(async () => {
    try { await fetch('/api/open-folder', { method: 'POST' }); } catch (e) { console.error(e); }
  }, []);

  const onPaidSuccess = useCallback(async () => {
    setPaidLoading(false);
    addToast({ type: 'success', title: 'Paid Task Submitted', message: 'Your video is being generated' });
    setTimeout(async () => {
      const r = await fetch('/api/latest-video');
      if (r.ok) { const d = await r.json(); setLatestVideo(d.video); }
    }, 4000);
    const r1 = await fetch('/api/history'); if (r1.ok) { const d = await r1.json(); setTaskHistory(d.tasks || []); }
    const r2 = await fetch('/api/cost-summary'); if (r2.ok) { const d = await r2.json(); setBudgetInfo(d.budget); }
  }, [addToast]);

  const estimateCost = useCallback(() => {
    const table: Record<string, Record<string, number>> = {
      mini: { '480p': 0.02, '720p': 0.04 },
      full: { '480p': 0.03, '720p': 0.06, '1080p': 0.10, '4K': 0.18 },
    };
    return (table[modelType]?.[resolution] || 0) * duration;
  }, [modelType, resolution, duration]);

  // PHASE5.1: charLimit is a RECOMMENDED range, not a hard limit.
  // promptWithinLimit gate is always true (warning only) — a long prompt
  // does NOT hard-block Dry Run or the Paid Zone. The gate just requires
  // the prompt to be non-empty.
  const recommendedCharLimit = modelType === 'mini' ? 1500 : 2000;
  const promptOverRecommended = prompt.length > recommendedCharLimit;

  // Derive reference counts from unified state
  const refGroups = groupReferencesByType(references);
  const refCount = refGroups.images.length + refGroups.audios.length + refGroups.videos.length;
  const hasAnyAudio = refGroups.audios.length > 0;
  const hasAnyVideo = refGroups.videos.length > 0;

  const allUrlsValid =
    refGroups.images.every(r => r.url.startsWith('https://')) &&
    refGroups.audios.every(r => r.url.startsWith('https://') && /\.(mp3|wav|m4a)(\?|$)/i.test(r.url)) &&
    refGroups.videos.every(r => r.url.startsWith('https://') && /\.(mp4|mov)(\?|$)/i.test(r.url));

  const gates: Gates = {
    safeModeOff: !safeMode, dryRunPassed: dryRunResult?.passed === true && !dryRunInvalidated,
    // PHASE5.1: Prompt length is a WARNING, not a hard gate. Always passes
    // as long as the prompt is non-empty. Long prompts show a warning but
    // do NOT block Dry Run or Paid Zone.
    promptWithinLimit: prompt.length > 0, urlsValid: allUrlsValid,
    storyboardAcknowledged: true, // Always true - storyboard is now just another image ref role
    audioRiskAcknowledged: !hasAnyAudio || refRiskAcknowledged,
    videoRiskAcknowledged: !hasAnyVideo || refRiskAcknowledged,
    budgetCheck: !budgetInfo || estimateCost() <= (budgetInfo.monthlyLimit - budgetInfo.spentThisMonth),
    maxCostCheck: !maxCostUsd || estimateCost() <= parseFloat(maxCostUsd), noDuplicate: true,
  };
  const allGatesPassed = Object.values(gates).every(Boolean);
  const paidZoneVisible = !safeMode && gates.dryRunPassed;
  const statusText = !dryRunResult ? 'READY' : dryRunInvalidated ? 'DRY RUN STALE' : dryRunResult.passed ? 'DRY RUN OK' : 'DRY RUN FAILED';
  const statusColor = statusText === 'READY' ? 'text-muted-foreground' : statusText === 'DRY RUN STALE' ? 'text-amber-400' : statusText === 'DRY RUN OK' ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 group">
                <Leaf className="w-7 h-7 text-emerald-500 transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse" />
                <h1 className="text-xl font-bold text-emerald-400">WSTV</h1>
                <span className="text-sm text-muted-foreground hidden sm:inline">Production Center</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">v5.0</Badge>
              <Badge variant="outline" className={`text-xs ${modelType === 'mini' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                <Cpu className="w-3 h-3 mr-1" />{modelType === 'mini' ? 'Mini' : 'Full'}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              {budgetInfo && (
                <div className="hidden md:flex flex-col items-end gap-1" title="Dry-run estimate only. No real charge.">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-muted-foreground">
                      Estimated: ${budgetInfo.spentThisMonth.toFixed(2)} / ${budgetInfo.monthlyLimit.toFixed(2)} budget
                    </span>
                    <div className="w-24"><Progress value={(budgetInfo.spentThisMonth / budgetInfo.monthlyLimit) * 100} className="h-1.5" /></div>
                  </div>
                  {safeMode && (
                    <span className="text-xs text-muted-foreground">Dry-run estimate only. No real charge.</span>
                  )}
                </div>
              )}
              <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground bg-card rounded px-2 py-1 border border-border">
                <Keyboard className="w-3 h-3" /> Ctrl+D
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-emerald-400">
                <History className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-emerald-500/20">
                {safeMode ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldOff className="w-5 h-5 text-amber-400" />}
                <Label className="text-sm font-medium cursor-pointer select-none" onClick={toggleSafeMode}>Safe</Label>
                <Switch checked={safeMode} onCheckedChange={toggleSafeMode} />
              </div>
            </div>
          </div>
          {safeMode && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-md px-3 py-1.5 transition-all">
              <Shield className="w-3.5 h-3.5" /> Safe Mode ON — DRY RUN only. No real paid generation.
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Main Tab Navigation — 6 tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            <TabsList className="bg-card border border-emerald-500/20 flex-wrap">
              <TabsTrigger value="generation" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs sm:text-sm">
                <Film className="w-4 h-4" />
                <span className="hidden sm:inline">Generate</span>
              </TabsTrigger>
              <TabsTrigger value="workflow" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs sm:text-sm">
                <Clapperboard className="w-4 h-4" />
                <span className="hidden sm:inline">Workflow</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs sm:text-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Cost</span>
              </TabsTrigger>
              <TabsTrigger value="postproduction" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs sm:text-sm">
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Post-Prod</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs sm:text-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs sm:text-sm">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Generation Tab */}
          <TabsContent value="generation" className="space-y-0">
            <div className="flex gap-6">
              <div className="flex-1 space-y-6 min-w-0">
                {/* Status Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${statusColor} border-current text-sm px-3 py-1`}>{statusText}</Badge>
                    {currentTaskId && <span className="text-xs text-muted-foreground">Task: {currentTaskId.substring(0, 8)}...</span>}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Cpu className="w-3 h-3" /><span>{modelType}</span>
                      <Monitor className="w-3 h-3 ml-1" /><span>{resolution}</span>
                      {refCount > 0 && <span className="text-muted-foreground ml-1">• {refCount} refs</span>}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Est. cost: <span className="text-emerald-400 font-medium">${estimateCost().toFixed(2)}</span>
                  </div>
                </div>

                {/* Workflow Progress */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Workflow:</span>
                  {[ 
                    { label: 'Prompt', done: prompt.length > 0 },
                    { label: 'Refs', done: refCount > 0 },
                    { label: 'Settings', done: true },
                    { label: 'Dry Run', done: dryRunResult?.passed === true },
                    { label: 'Paid', done: false },
                    { label: 'Preview', done: !!latestVideo },
                  ].map((s, i) => (
                    <span key={s.label} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${s.done ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      <span className={`text-xs ${s.done ? 'text-emerald-400' : 'text-muted-foreground'}`}>{s.label}</span>
                      {i < 5 && <span className="text-muted-foreground/60 mx-0.5">›</span>}
                    </span>
                  ))}
                </div>

                <GenerateSafetyStrip
                  safeMode={safeMode}
                  seedanceModelId={seedanceModelId}
                  resolution={resolution}
                  duration={duration}
                  generateAudio={audioMode !== 'none'}
                />

                <StepPrompt prompt={prompt} setPrompt={setPromptV} modelType={modelType} setModelType={setModelTypeV} />
                <StepConnector active completed={prompt.length > 0} />
                <StepReferences
                  references={references}
                  setReferences={setReferencesV}
                  riskAcknowledged={refRiskAcknowledged}
                  setRiskAcknowledged={setRefRiskAcknowledged}
                  generationMode={generationMode}
                  setGenerationMode={setGenerationModeV}
                />
                <StepConnector active completed={refCount > 0} />
                <StepOutput modelType={modelType} resolution={resolution} setResolution={setResolutionV}
                  duration={duration} setDuration={setDurationV} aspectRatio={aspectRatio} setAspectRatio={setAspectRatioV}
                  maxCostUsd={maxCostUsd} setMaxCostUsd={setMaxCostUsdV} outputFilename={outputFilename} setOutputFilename={setOutputFilename}
                  fps={fps} setFps={setFpsV} audioMode={audioMode} setAudioMode={setAudioModeV}
                  seedanceModelId={seedanceModelId} setSeedanceModelId={setSeedanceModelIdV}
                  generationMode={generationMode} setGenerationMode={setGenerationModeV} />
                <StepConnector active completed />
                <StepDryRun
                  dryRunResult={dryRunResult} dryRunInvalidated={dryRunInvalidated}
                  prompt={prompt} modelType={modelType} resolution={resolution} duration={duration} aspectRatio={aspectRatio}
                  references={references}
                  maxCostUsd={maxCostUsd} outputFilename={outputFilename}
                  currentTaskId={currentTaskId} safeMode={safeMode}
                  onResult={onDryRunResult}
                  onTaskId={setCurrentTaskId} onInvalidatedClear={onInvalidatedClear}
                  seedanceModelId={seedanceModelId}
                  generationMode={generationMode}
                />
                {/* ─── PHASE4: Seedance API Payload Preview + Examples + Lifecycle ─── */}
                <SeedancePayloadPreviewPanel
                  prompt={prompt}
                  seedanceModelId={seedanceModelId}
                  resolution={resolution}
                  duration={duration}
                  aspectRatio={aspectRatio}
                  references={references}
                  generationMode={generationMode}
                  audioMode={audioMode}
                />
                <StepConnector active completed={dryRunResult?.passed === true} />
                <StepPaid
                  visible={paidZoneVisible} safeMode={safeMode} gates={gates} allGatesPassed={allGatesPassed}
                  confirmationText={confirmationText} setConfirmationText={setConfirmationText}
                  paidLoading={paidLoading} currentTaskId={currentTaskId}
                  storyboardRiskAcknowledged={true}
                  audioRiskAcknowledged={refRiskAcknowledged}
                  videoRiskAcknowledged={refRiskAcknowledged}
                  estimatedCost={estimateCost()}
                  onPaidSuccess={onPaidSuccess}
                  paidUnlocked={paidUnlocked}
                  unlockInput={unlockInput}
                  setUnlockInput={setUnlockInput}
                  unlockError={unlockError}
                  onUnlockSubmit={handleUnlockSubmit}
                  onLock={handleLockPaidZone}
                />
                <StepConnector active completed={false} />
                <StepPreview latestVideo={latestVideo} onRefreshVideo={refreshVideo} onOpenFolder={openFolder}
                  dryRunPassed={dryRunResult?.passed && !dryRunInvalidated}
                  hasPaidTask={taskHistory.some(t => t.status === 'submitted' || t.status === 'processing')}
                  modelType={modelType} resolution={resolution} duration={duration} estimatedCost={estimateCost()} />
              </div>
              <Sidebar open={sidebarOpen} taskHistory={taskHistory} budgetInfo={budgetInfo} />
            </div>
          </TabsContent>

          {/* Workflow Tab — Presets, QA, Versions, References, Retry */}
          <TabsContent value="workflow">
            <div className="space-y-6">
              <div className="text-xs text-muted-foreground bg-muted/30 border border-emerald-500/30 rounded-md px-3 py-2 flex items-center gap-2">
                <Info className="w-3 h-3 shrink-0 text-emerald-500/70" />
                <span>Production planning tools — some sections are experimental. All data stays local.</span>
              </div>
              <ProductionWorkflow />
              <ReferenceManager references={references} setReferences={setReferencesV} />
            </div>
          </TabsContent>

          {/* Cost & Budget Tab */}
          <TabsContent value="budget">
            <div className="space-y-6">
              <CostDashboard />
              <ResourcePackBillingPanel
                seedanceModelId={seedanceModelId}
                resolution={resolution}
                duration={duration}
                references={{ videos: refGroups.videos }}
              />
            </div>
          </TabsContent>

          {/* Post-Production Tab */}
          <TabsContent value="postproduction">
            <PostProduction />
          </TabsContent>

          {/* Calendar & Learning Tab */}
          <TabsContent value="calendar">
            <div className="space-y-6">
              <div className="text-xs text-muted-foreground bg-muted/30 border border-emerald-500/30 rounded-md px-3 py-2 flex items-center gap-2">
                <Info className="w-3 h-3 shrink-0 text-emerald-500/70" />
                <span>Local planning calendar — no Google Calendar connection. All data stays in your local SQLite DB.</span>
              </div>
              <CalendarLearning />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <CostSettings initialBudget={budgetInfo} />
              <OfficialQuickstartReference />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-emerald-500/20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>WSTV Production Center • Safety-First Wildlife Video Toolkit</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{taskHistory.length} tasks</span>
              <span>Seedance 2.0</span>
              <div className="flex items-center gap-1">
                <Shield className={`w-3.5 h-3.5 ${safeMode ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span>{safeMode ? 'DRY RUN' : 'LIVE'}</span>
              </div>
              <span>v5.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Container */}
      <ToastContainer messages={toasts} onDismiss={dismissToast} />
    </div>
  );
}
