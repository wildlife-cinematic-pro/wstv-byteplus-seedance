'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Wallet, Clock, TrendingUp, Zap, Film, Video,
  Calculator, Settings, BarChart3,
  AlertTriangle, CheckCircle, XCircle, Edit3, Save, RefreshCw,
  Info, Activity, Gauge, Layers, Plus, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WSTV_PRESETS, calculateTokens, calculateCostUsd } from '@/lib/pricing';
import type {
  BudgetSnapshotData, PricingModelData, SubscriptionPlanData,
  SubscriptionPurchaseData, UsageRecordData, ExchangeRateData,
  DashboardSettingsData
} from '@/components/dashboard/types';

// ─── Native replacement: Simple Progress Bar ───
function SimpleProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`bg-muted rounded-full overflow-hidden ${className || 'h-2'}`}>
      <div
        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─── Native replacement: Simple Select ───
function SimpleSelect({ value, onChange, options, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`bg-background border border-emerald-500/20 rounded-md text-sm text-gray-200 px-3 py-1.5 focus:outline-none focus:border-emerald-500/50 ${className || ''}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Native replacement: Simple Divider ───
function SimpleDivider({ className }: { className?: string }) {
  return <hr className={`border-0 border-t border-emerald-500/30 my-4 ${className || ''}`} />;
}

// ─── Budget badge helper ───
function BudgetBadgeDisplay({ badge }: { badge: 'green' | 'yellow' | 'red' }) {
  const config = {
    green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/30', label: 'Healthy' },
    yellow: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', glow: 'shadow-amber-500/30', label: 'Caution' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', glow: 'shadow-red-500/30', label: 'Critical' },
  };
  const c = config[badge];
  return (
    <Badge className={`${c.bg} ${c.text} ${c.border} shadow-lg ${c.glow} px-3 py-1 text-sm font-semibold`}>
      {badge === 'green' ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : badge === 'yellow' ? <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
      {c.label}
    </Badge>
  );
}

// ─── Status badge helper ───
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'planned': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
    'dry-run': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    'generated-manually': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'cancelled': { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  };
  const c = map[status] || map['planned'];
  return <Badge className={`${c.bg} ${c.text} ${c.border} text-xs`}>{status}</Badge>;
}

// ─── Section Card Wrapper ───
function SectionCard({ title, description, icon: Icon, children }: {
  title: string; description?: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-emerald-400" />
          <CardTitle className="text-emerald-400 text-lg">{title}</CardTitle>
        </div>
        {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COST DASHBOARD — No Radix components inside
// ═══════════════════════════════════════════════════

function CostDashboard() {
  // ─── Tab state (replaces Radix Tabs) ───
  const [activeCostTab, setActiveCostTab] = useState('budget');
  const costTabs = [
    { value: 'budget', label: 'Budget', icon: Wallet },
    { value: 'calculator', label: 'Calculator', icon: Calculator },
    { value: 'usage', label: 'Usage', icon: Clock },
    { value: 'pricing', label: 'Pricing & Plans', icon: Layers },
    { value: 'compare', label: 'Compare Plans', icon: Layers },
    { value: 'charts', label: 'Charts', icon: BarChart3 },
  ];

  // ─── Data state ───
  const [budget, setBudget] = useState<BudgetSnapshotData | null>(null);
  const [pricingModels, setPricingModels] = useState<PricingModelData[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanData[]>([]);
  const [purchases, setPurchases] = useState<SubscriptionPurchaseData[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecordData[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateData[]>([]);
  const [settings, setSettings] = useState<DashboardSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Calculator state ───
  const [calcModel, setCalcModel] = useState<string>('');
  const [calcWidth, setCalcWidth] = useState(720);
  const [calcHeight, setCalcHeight] = useState(1280);
  const [calcFps, setCalcFps] = useState(24);
  const [calcDuration, setCalcDuration] = useState(10);
  const [calcVideoCount, setCalcVideoCount] = useState(1);
  const [calcMode, setCalcMode] = useState('text-to-video');
  const [calcPricingMode, setCalcPricingMode] = useState('token-based');
  const [calcRate, setCalcRate] = useState(0.007);
  const [calcIntelligentMode, setCalcIntelligentMode] = useState(false);
  const [calcResult, setCalcResult] = useState<Record<string, unknown> | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // ─── Other UI state ───
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [actualEntryRecordId, setActualEntryRecordId] = useState('');
  const [actualTokens, setActualTokens] = useState('');
  const [actualCostUsd, setActualCostUsd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newPlanData, setNewPlanData] = useState({ name: '', priceUsd: '', tokenAllowance: '', validityDays: '90', description: '' });

  // ─── 3-Plan Comparison state ───
  // Three editable plan slots. Plan 1 defaults to the active subscription
  // (Light Plan / $30.10 / 7M tokens) when budget data loads. Plans 2 & 3
  // start empty so the user can fill in alternatives they are considering.
  // Values are NOT hardcoded as official prices — they are manually editable.
  const [cmpPlans, setCmpPlans] = useState([
    { planName: 'Light Plan',    planCostUsd: 30.10, includedTokens: 7_000_000, validityDays: 90, expiryDate: '2026-09-14', notes: 'Current active plan (manual entry)' },
    { planName: 'Plan 2 (edit)', planCostUsd: 0,     includedTokens: 0,         validityDays: 90, expiryDate: '',           notes: '' },
    { planName: 'Plan 3 (edit)', planCostUsd: 0,     includedTokens: 0,         validityDays: 90, expiryDate: '',           notes: '' },
  ]);
  const [cmpUsageVideos, setCmpUsageVideos] = useState<number>(30);     // target videos per month
  const [cmpUsageDuration, setCmpUsageDuration] = useState<number>(15); // 10, 12, 15
  const [cmpUsageResolution, setCmpUsageResolution] = useState<string>('720p'); // 720p, 1080p, 4K

  // ─── Manual Actual Cost Entry (full form) ───
  // Lets the user record a manual browser generation with all relevant fields.
  // Saved via POST /api/usage-records, immediately appears in Usage History.
  const [manualEntry, setManualEntry] = useState({
    projectTitle: '',
    animalStoryName: '',
    modelName: 'Seedance 2.0',
    modelId: 'dreamina-seedance-2-0-260128',
    mode: 'text-to-video',
    resolution: '720p', // 720p / 1080p / 4K — drives width/height
    fps: 24,
    durationSeconds: 15,
    estimatedTokens: '',
    estimatedCostUsd: '',
    actualTokens: '',
    actualCostUsd: '',
    generationDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    notes: '',
    status: 'generated-manually',
  });
  const [manualSaving, setManualSaving] = useState(false);

  // ─── Fetch all data ───
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const safeFetch = async (url: string) => {
        try { const r = await fetch(url); return r.ok ? await r.json() : null; }
        catch { return null; }
      };
      const [budgetData, pricingData, plansData, purchasesData, usageData, ratesData, settingsData] = await Promise.all([
        safeFetch('/api/budget-snapshot'),
        safeFetch('/api/pricing'),
        safeFetch('/api/subscriptions/plans'),
        safeFetch('/api/subscriptions/purchases'),
        safeFetch('/api/usage-records'),
        safeFetch('/api/exchange-rates'),
        safeFetch('/api/dashboard-settings'),
      ]);
      if (budgetData) setBudget(budgetData);
      if (pricingData) setPricingModels(pricingData);
      if (plansData) setPlans(plansData);
      if (purchasesData) setPurchases(purchasesData);
      if (usageData) setUsageRecords(usageData);
      if (ratesData) setExchangeRates(ratesData);
      if (settingsData) setSettings(settingsData);
    } catch (err) {
      console.error('[CostDashboard] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // ─── Derived values ───
  const usdJpyRate = exchangeRates.find(r => r.fromCurrency === 'USD' && r.toCurrency === 'JPY')?.rate ?? 149.5;
  const activePurchase = purchases.find(p => p.status === 'active');
  const filteredUsageRecords = statusFilter === 'all'
    ? usageRecords
    : usageRecords.filter(r => r.status === statusFilter);

  // ─── Apply preset to calculator ───
  const applyPreset = useCallback((preset: typeof WSTV_PRESETS[number]) => {
    setCalcModel(preset.modelId);
    setCalcWidth(preset.width);
    setCalcHeight(preset.height);
    setCalcFps(preset.fps);
    setCalcDuration(preset.duration);
    setCalcRate(preset.ratePerKTokens);
    setCalcResult(null);
  }, []);

  // ─── Calculate cost ───
  const handleCalculate = useCallback(async () => {
    setCalcLoading(true);
    try {
      const res = await fetch('/api/cost-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: calcWidth, height: calcHeight, fps: calcFps,
          durationSeconds: calcDuration, videoCount: calcVideoCount,
          modelId: calcModel, ratePerKTokens: calcRate,
          exchangeRate: usdJpyRate, intelligentMode: calcIntelligentMode,
          tokenAllowance: budget?.tokenAllowance,
          tokensUsed: budget?.tokensUsed,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const estimatedTokens = data.estimatedTokens as number;
        const estimatedCostUsd = data.estimatedCostUsd as number;
        const remainingTokensAfter = budget ? Math.max(0, budget.tokensRemaining - estimatedTokens) : 0;
        const remainingUsdAfter = budget ? remainingTokensAfter * (budget.priceUsd / budget.tokenAllowance) : 0;
        const tokensPerVideo = data.tokensPerVideo as number;
        const maxMoreVideos = tokensPerVideo > 0 && budget ? Math.floor(budget.tokensRemaining / tokensPerVideo) : 0;
        const usedPct = budget ? ((budget.tokensUsed + estimatedTokens) / budget.tokenAllowance) * 100 : 0;
        const budgetBadge: 'green' | 'yellow' | 'red' = usedPct >= 90 ? 'red' : usedPct >= 70 ? 'yellow' : 'green';
        setCalcResult({
          ...data,
          remainingTokensAfter,
          remainingUsdAfter,
          maxMoreVideos,
          budgetBadge,
        });
      }
    } catch (err) {
      console.error('[CostCalculator]', err);
    } finally {
      setCalcLoading(false);
    }
  }, [calcWidth, calcHeight, calcFps, calcDuration, calcVideoCount, calcModel, calcRate, usdJpyRate, calcIntelligentMode, budget]);

  // ─── Save expiry date override ───
  const handleSaveExpiry = useCallback(async () => {
    if (!activePurchase || !newExpiryDate) return;
    try {
      const res = await fetch(`/api/subscriptions/purchases/${activePurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryDate: newExpiryDate, manualExpiryOverride: true }),
      });
      if (res.ok) { setEditingExpiry(false); fetchAllData(); }
    } catch (err) { console.error('[SaveExpiry]', err); }
  }, [activePurchase, newExpiryDate, fetchAllData]);

  // ─── Save actual cost entry ───
  const handleSaveActualCost = useCallback(async () => {
    if (!actualEntryRecordId) return;
    try {
      const res = await fetch(`/api/usage-records/${actualEntryRecordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualTokens: actualTokens ? parseInt(actualTokens) : undefined,
          actualCostUsd: actualCostUsd ? parseFloat(actualCostUsd) : undefined,
        }),
      });
      if (res.ok) { setActualEntryRecordId(''); setActualTokens(''); setActualCostUsd(''); fetchAllData(); }
    } catch (err) { console.error('[SaveActualCost]', err); }
  }, [actualEntryRecordId, actualTokens, actualCostUsd, fetchAllData]);

  // ─── Save full manual entry (creates a new UsageRecord) ───
  // Maps the resolution string to width/height for 9:16 vertical:
  //   720p  → 720 × 1280
  //   1080p → 1080 × 1920
  //   4K    → 2160 × 3840
  // After successful save, clears the form and refreshes Usage History.
  const handleSaveManualEntry = useCallback(async () => {
    if (!manualEntry.projectTitle.trim()) {
      alert('Project title is required');
      return;
    }
    setManualSaving(true);
    try {
      const resToWH: Record<string, { w: number; h: number }> = {
        '720p':  { w: 720,  h: 1280 },
        '1080p': { w: 1080, h: 1920 },
        '4K':    { w: 2160, h: 3840 },
      };
      const wh = resToWH[manualEntry.resolution] ?? resToWH['720p'];
      // Auto-compute estimated tokens if user left it blank but provided actual tokens
      const estTokens = manualEntry.estimatedTokens
        ? parseInt(manualEntry.estimatedTokens)
        : (manualEntry.actualTokens ? parseInt(manualEntry.actualTokens) : calculateTokens(wh.w, wh.h, manualEntry.fps, manualEntry.durationSeconds, 1));
      const estCost = manualEntry.estimatedCostUsd
        ? parseFloat(manualEntry.estimatedCostUsd)
        : (manualEntry.actualCostUsd ? parseFloat(manualEntry.actualCostUsd) : 0);

      const res = await fetch('/api/usage-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: manualEntry.projectTitle,
          animalStoryName: manualEntry.animalStoryName || null,
          modelId: manualEntry.modelId,
          modelName: manualEntry.modelName,
          mode: manualEntry.mode,
          width: wh.w,
          height: wh.h,
          fps: manualEntry.fps,
          durationSeconds: manualEntry.durationSeconds,
          videoCount: 1,
          pricingMode: 'token-based',
          ratePerKTokens: 0,
          estimatedTokens: estTokens,
          estimatedCostUsd: estCost,
          actualTokens: manualEntry.actualTokens ? parseInt(manualEntry.actualTokens) : null,
          actualCostUsd: manualEntry.actualCostUsd ? parseFloat(manualEntry.actualCostUsd) : null,
          status: manualEntry.status,
          notes: manualEntry.notes || `Manual actual cost — user-entered after browser generation. Resolution: ${manualEntry.resolution}.`,
          generatedAt: manualEntry.generationDate ? new Date(manualEntry.generationDate).toISOString() : null,
        }),
      });
      if (res.ok) {
        // Clear form
        setManualEntry({
          projectTitle: '',
          animalStoryName: '',
          modelName: manualEntry.modelName,
          modelId: manualEntry.modelId,
          mode: manualEntry.mode,
          resolution: manualEntry.resolution,
          fps: manualEntry.fps,
          durationSeconds: manualEntry.durationSeconds,
          estimatedTokens: '',
          estimatedCostUsd: '',
          actualTokens: '',
          actualCostUsd: '',
          generationDate: new Date().toISOString().split('T')[0],
          notes: '',
          status: 'generated-manually',
        });
        fetchAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to save: ${err?.error ?? res.statusText}`);
      }
    } catch (err) {
      console.error('[SaveManualEntry]', err);
      alert('Network error while saving manual entry');
    } finally {
      setManualSaving(false);
    }
  }, [manualEntry, fetchAllData]);

  // ─── Update pricing model ───
  const handleUpdatePricing = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/pricing/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { setEditingPricingId(null); fetchAllData(); }
    } catch (err) { console.error('[UpdatePricing]', err); }
  }, [fetchAllData]);

  // ─── Create new plan ───
  const handleCreatePlan = useCallback(async () => {
    try {
      const res = await fetch('/api/subscriptions/plans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlanData.name, priceUsd: parseFloat(newPlanData.priceUsd),
          tokenAllowance: parseInt(newPlanData.tokenAllowance), validityDays: parseInt(newPlanData.validityDays),
          description: newPlanData.description || null,
        }),
      });
      if (res.ok) {
        setNewPlanOpen(false);
        setNewPlanData({ name: '', priceUsd: '', tokenAllowance: '', validityDays: '90', description: '' });
        fetchAllData();
      }
    } catch (err) { console.error('[CreatePlan]', err); }
  }, [newPlanData, fetchAllData]);

  // ─── Chart data ───
  const tokenUsageChartData = usageRecords
    .filter(r => r.status === 'generated-manually' || r.status === 'dry-run')
    .sort((a, b) => new Date(a.generatedAt || a.createdAt).getTime() - new Date(b.generatedAt || b.createdAt).getTime())
    .map(r => ({ date: new Date(r.generatedAt || r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tokens: r.actualTokens ?? r.estimatedTokens, cost: r.actualCostUsd ?? r.estimatedCostUsd }));

  const usdSpentChartData = usageRecords
    .filter(r => r.status === 'generated-manually' || r.status === 'dry-run')
    .sort((a, b) => new Date(a.generatedAt || a.createdAt).getTime() - new Date(b.generatedAt || b.createdAt).getTime())
    .reduce<{ date: string; cumulative: number }[]>((acc, r) => {
      const cost = r.actualCostUsd ?? r.estimatedCostUsd;
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      acc.push({ date: new Date(r.generatedAt || r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cumulative: Math.round((prev + cost) * 100) / 100 });
      return acc;
    }, []);

  const videoCountByModel = usageRecords.filter(r => r.status !== 'cancelled').reduce<Record<string, number>>((acc, r) => { acc[r.modelName] = (acc[r.modelName] || 0) + r.videoCount; return acc; }, {});
  const videoCountChartData = Object.entries(videoCountByModel).map(([name, count]) => ({ name, count }));
  const barColors = ['#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="ml-3 text-gray-400">Loading cost dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Tab Navigation (native buttons, no Radix Tabs) ── */}
      <div className="bg-muted/30 border border-emerald-500/20 rounded-lg p-1 flex flex-wrap gap-1">
        {costTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeCostTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveCostTab(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: Budget ═══ */}
      {activeCostTab === 'budget' && (
        <div className="space-y-6">
          {budget && (
            <SectionCard title="Today's Budget Snapshot" description={budget.today} icon={Wallet}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Budget Status</span>
                  <BudgetBadgeDisplay badge={budget.budgetBadge} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Tokens</span>
                  <p className="text-lg font-semibold text-emerald-400">
                    {budget.tokensRemaining.toLocaleString()} <span className="text-muted-foreground text-sm">/ {budget.tokenAllowance.toLocaleString()}</span>
                  </p>
                  <SimpleProgress value={(budget.tokensUsed / budget.tokenAllowance) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">USD Remaining</span>
                  <p className="text-lg font-semibold text-emerald-400">${budget.usdRemaining.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">of ${budget.priceUsd.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Days Until Expiry</span>
                  <p className="text-lg font-semibold text-emerald-400">{budget.daysUntilExpiry}</p>
                  <p className="text-xs text-muted-foreground">{budget.elapsedPct.toFixed(0)}% elapsed</p>
                </div>
              </div>
              <SimpleDivider />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Daily Safe Budget</span>
                  <p className="text-emerald-400 font-medium">{budget.safeDailyTokenBudget.toLocaleString()} tokens</p>
                  <p className="text-xs text-muted-foreground">${budget.safeDailyUsdBudget.toFixed(4)} / day</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Current Pace</span>
                  <p className="text-gray-300 font-medium">{budget.dailyTokenPace.toLocaleString()} tokens/day</p>
                  <p className="text-xs text-muted-foreground">${budget.monthlyUsdPace.toFixed(2)} / month</p>
                </div>
                {budget.paceWarning && (
                  <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400 font-medium text-sm">Pace Warning</span>
                    </div>
                    <p className="text-xs text-amber-400/70 mt-1">Current usage pace exceeds remaining budget. Consider reducing daily generation.</p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {activePurchase && budget && (
            <SectionCard title="Active Plan" description="Current subscription details" icon={Zap}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Plan Name</span>
                  <p className="text-emerald-400 font-semibold">{activePurchase.planName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Price / Tokens</span>
                  <p className="text-gray-200">${activePurchase.priceUsd.toFixed(2)} / {activePurchase.tokenAllowance.toLocaleString()} tokens</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Purchase Date</span>
                  <p className="text-gray-300">{new Date(activePurchase.purchaseDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Expiry Date</span>
                  {editingExpiry ? (
                    <div className="flex items-center gap-2">
                      <Input type="date" value={newExpiryDate} onChange={e => setNewExpiryDate(e.target.value)} className="h-8 text-sm bg-background border-emerald-500/30" />
                      <Button size="sm" onClick={handleSaveExpiry} className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700"><Save className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingExpiry(false)} className="h-7 px-2 text-gray-400">Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-gray-300">{new Date(activePurchase.expiryDate).toLocaleDateString()}</p>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingExpiry(true); setNewExpiryDate(new Date(activePurchase.expiryDate).toISOString().split('T')[0]); }} className="h-6 px-1.5 text-emerald-400 hover:text-emerald-300">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      {activePurchase.manualExpiryOverride && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Manual Override</Badge>}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tokens used: {activePurchase.tokensUsed.toLocaleString()}</span>
                  <span>{((activePurchase.tokensUsed / activePurchase.tokenAllowance) * 100).toFixed(1)}%</span>
                </div>
                <SimpleProgress value={(activePurchase.tokensUsed / activePurchase.tokenAllowance) * 100} className="h-3" />
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Info className="w-3 h-3" /> Allow manual expiry-date override because provider timezone may differ
              </p>
            </SectionCard>
          )}

          {budget && (
            <SectionCard title="Remaining Video Capacity" description="Estimated videos remaining by resolution × duration (9:16 vertical)" icon={Film}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground italic">
                    Formula: remaining videos = remainingTokens ÷ tokensPerVideo · tokensPerVideo = (width × height × 24fps × duration) ÷ 1024
                  </p>
                  <Badge variant="outline" className="text-xs border-border text-gray-400 bg-muted">
                    Estimate only / manual tracker
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { res: '720p',  dur: 10, cap: budget.estimatedCapacity720p10s,  color: 'emerald' },
                    { res: '720p',  dur: 12, cap: budget.estimatedCapacity720p12s,  color: 'emerald' },
                    { res: '720p',  dur: 15, cap: budget.estimatedCapacity720p15s,  color: 'emerald' },
                    { res: '1080p', dur: 10, cap: budget.estimatedCapacity1080p10s, color: 'emerald' },
                    { res: '1080p', dur: 12, cap: budget.estimatedCapacity1080p12s, color: 'amber' },
                    { res: '1080p', dur: 15, cap: budget.estimatedCapacity1080p15s, color: 'amber' },
                    { res: '4K',    dur: 10, cap: budget.estimatedCapacity4k10s,    color: 'amber' },
                    { res: '4K',    dur: 12, cap: budget.estimatedCapacity4k12s,    color: 'red' },
                    { res: '4K',    dur: 15, cap: budget.estimatedCapacity4k15s,    color: 'red' },
                  ].map(item => (
                    <div
                      key={`${item.res}-${item.dur}s`}
                      className={`bg-muted/30 rounded-lg p-3 border ${
                        item.color === 'emerald' ? 'border-emerald-500/20'
                        : item.color === 'amber' ? 'border-amber-500/20'
                        : 'border-red-500/20'
                      }`}
                    >
                      {/* Header: resolution · duration + EST badge */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-300 font-semibold">
                          {item.dur}s · {item.res}
                        </p>
                        {item.cap.isEstimated && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-amber-500/40 text-amber-400 bg-amber-500/10">
                            EST
                          </Badge>
                        )}
                      </div>

                      {/* Big number: videos remaining */}
                      <div className="text-center mb-2">
                        <p className={`text-2xl font-bold ${
                          item.color === 'emerald' ? 'text-emerald-400'
                          : item.color === 'amber' ? 'text-amber-400'
                          : 'text-red-400'
                        }`}>
                          {item.cap.videosRemaining.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">videos remaining</p>
                      </div>

                      {/* Token + cost breakdown */}
                      <div className="space-y-1 text-xs font-mono border-t border-border pt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">tokens/video</span>
                          <span className="text-gray-300">{item.cap.tokensPerVideo.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">USD/video</span>
                          <span className="text-emerald-400">${item.cap.costUsdPerVideo.toFixed(4)}</span>
                        </div>
                        {item.cap.costJpyPerVideo != null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">JPY/video</span>
                            <span className="text-gray-300">¥{item.cap.costJpyPerVideo.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Rate source + pricing note */}
                      <div className="mt-2 pt-2 border-t border-border space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          <span className="text-muted-foreground">rate:</span> {item.cap.rateSource}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-muted-foreground">note:</span> {item.cap.pricingNote}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 rounded-md bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs text-amber-400/80 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    4K pricing is estimated / configurable — verify or edit 4K rates in Pricing & Plans tab. No real API connection.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ═══ TAB: Calculator ═══ */}
      {activeCostTab === 'calculator' && (
        <div className="space-y-6">
          <SectionCard title="Cost Calculator" description="Estimate token consumption and cost" icon={Calculator}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Model</Label>
                <SimpleSelect
                  value={calcModel}
                  onChange={v => {
                    setCalcModel(v);
                    const pm = pricingModels.find(p => p.modelId === v);
                    if (pm) setCalcRate(pm.rate720p);
                  }}
                  placeholder="Select model"
                  options={pricingModels.filter(p => p.status === 'active').map(p => ({ value: p.modelId, label: `${p.name} (${p.modelId})` }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Width</Label>
                <Input type="number" value={calcWidth} onChange={e => setCalcWidth(parseInt(e.target.value) || 0)} className="bg-background border-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Height</Label>
                <Input type="number" value={calcHeight} onChange={e => setCalcHeight(parseInt(e.target.value) || 0)} className="bg-background border-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">FPS</Label>
                <SimpleSelect
                  value={calcFps.toString()}
                  onChange={v => setCalcFps(parseInt(v))}
                  options={[12, 16, 24, 25, 30].map(f => ({ value: f.toString(), label: `${f} fps` }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Duration (seconds)</Label>
                <Input type="number" value={calcDuration} onChange={e => setCalcDuration(parseInt(e.target.value) || 0)} className="bg-background border-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Video Count</Label>
                <Input type="number" min={1} value={calcVideoCount} onChange={e => setCalcVideoCount(parseInt(e.target.value) || 1)} className="bg-background border-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Mode</Label>
                <SimpleSelect
                  value={calcMode}
                  onChange={setCalcMode}
                  options={['text-to-video', 'first-frame', 'first-and-last-frame', 'reference', 'extension'].map(m => ({ value: m, label: m }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Pricing Mode</Label>
                <SimpleSelect
                  value={calcPricingMode}
                  onChange={setCalcPricingMode}
                  options={['token-based', 'per-video', 'manual'].map(m => ({ value: m, label: m }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Rate per 1K Tokens (USD)</Label>
                <Input type="number" step="0.0001" value={calcRate} onChange={e => setCalcRate(parseFloat(e.target.value) || 0)} className="bg-background border-emerald-500/20" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcIntelligentMode}
                  onChange={e => setCalcIntelligentMode(e.target.checked)}
                  className="w-4 h-4 rounded border-emerald-500/30 bg-background text-emerald-500 focus:ring-emerald-500/30"
                />
                <Label className="text-xs text-gray-400 cursor-pointer">Intelligent Mode</Label>
              </label>
              {calcIntelligentMode && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Intelligent mode may alter actual ratio/duration</span>
                </div>
              )}
            </div>
            <Button onClick={handleCalculate} disabled={calcLoading} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              {calcLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
              Calculate
            </Button>
          </SectionCard>

          {calcResult && (
            <SectionCard title="Calculation Results" icon={Gauge}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Estimated Tokens</span>
                  <p className="text-emerald-400 text-xl font-bold">{(calcResult.estimatedTokens as number)?.toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Estimated USD</span>
                  <p className="text-emerald-400 text-xl font-bold">${(calcResult.estimatedCostUsd as number)?.toFixed(4)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Estimated JPY</span>
                  <p className="text-emerald-400 text-xl font-bold">¥{(calcResult.estimatedCostJpy as number)?.toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Remaining Tokens After</span>
                  <p className="text-gray-200 text-xl font-bold">{(calcResult.remainingTokensAfter as number)?.toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Max More Videos</span>
                  <p className="text-gray-200 text-xl font-bold">{calcResult.maxMoreVideos as number}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-xs text-muted-foreground">Budget Badge</span>
                  <BudgetBadgeDisplay badge={calcResult.budgetBadge as 'green' | 'yellow' | 'red'} />
                </div>
              </div>
              {calcResult.warningText && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {calcResult.warningText as string}
                  </p>
                </div>
              )}
            </SectionCard>
          )}

          <SectionCard title="WSTV Presets" description="Quick-apply common configurations" icon={Video}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {WSTV_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="bg-muted/30 rounded-lg p-4 border border-emerald-500/30 hover:border-emerald-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{preset.icon}</span>
                    <span className="text-emerald-400 font-semibold group-hover:text-emerald-300">{preset.name}</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>Aspect: {preset.aspectRatio}</p>
                    <p>Resolution: {preset.width}×{preset.height}</p>
                    <p>Duration: {preset.duration}s @ {preset.fps}fps</p>
                    <p>Model: {preset.modelName}</p>
                    <p>Rate: ${preset.ratePerKTokens}/1K tokens</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{preset.description}</p>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TAB: Usage ═══ */}
      {activeCostTab === 'usage' && (
        <div className="space-y-6">
          {/* ─── Full-featured Manual Actual Cost Entry ─── */}
          <SectionCard title="Manual Actual Cost Entry" description="Record a manual browser generation with full details" icon={DollarSign}>
            <div className="p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 mb-4">
              <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
                <Info className="w-3 h-3 shrink-0" />
                Manual actual cost — user-entered after browser generation. Saved to local DB and appears in Usage History below. No real API connection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Project title */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Project title *</Label>
                <Input
                  value={manualEntry.projectTitle}
                  onChange={e => setManualEntry({ ...manualEntry, projectTitle: e.target.value })}
                  placeholder="e.g., WSTV Wildlife Reel #3"
                  className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Animal/Story */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Animal / Story</Label>
                <Input
                  value={manualEntry.animalStoryName}
                  onChange={e => setManualEntry({ ...manualEntry, animalStoryName: e.target.value })}
                  placeholder="e.g., Lion Hunt Sequence"
                  className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Model */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Model</Label>
                <Input
                  value={manualEntry.modelName}
                  onChange={e => setManualEntry({ ...manualEntry, modelName: e.target.value })}
                  className="bg-background border-emerald-500/30 text-gray-100 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Mode */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mode</Label>
                <SimpleSelect
                  value={manualEntry.mode}
                  onChange={v => setManualEntry({ ...manualEntry, mode: v })}
                  options={[
                    { value: 'text-to-video', label: 'text-to-video' },
                    { value: 'first-frame', label: 'first-frame' },
                    { value: 'first-and-last-frame', label: 'first-and-last-frame' },
                    { value: 'reference', label: 'reference' },
                    { value: 'extension', label: 'extension' },
                  ]}
                />
              </div>
              {/* Resolution */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Resolution (9:16)</Label>
                <SimpleSelect
                  value={manualEntry.resolution}
                  onChange={v => setManualEntry({ ...manualEntry, resolution: v })}
                  options={[
                    { value: '720p',  label: '720p  (720×1280)' },
                    { value: '1080p', label: '1080p (1080×1920)' },
                    { value: '4K',    label: '4K    (2160×3840) — estimated' },
                  ]}
                />
              </div>
              {/* FPS */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">FPS</Label>
                <SimpleSelect
                  value={manualEntry.fps.toString()}
                  onChange={v => setManualEntry({ ...manualEntry, fps: parseInt(v) })}
                  options={[12, 16, 24, 25, 30].map(f => ({ value: f.toString(), label: `${f} fps` }))}
                />
              </div>
              {/* Duration */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Duration (seconds)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={manualEntry.durationSeconds}
                  onChange={e => setManualEntry({ ...manualEntry, durationSeconds: parseInt(e.target.value) || 15 })}
                  className="bg-background border-emerald-500/30 text-gray-100 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Estimated tokens */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Estimated tokens</Label>
                <Input
                  type="number"
                  value={manualEntry.estimatedTokens}
                  onChange={e => setManualEntry({ ...manualEntry, estimatedTokens: e.target.value })}
                  placeholder="auto if blank"
                  className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Estimated cost USD */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Estimated cost (USD)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={manualEntry.estimatedCostUsd}
                  onChange={e => setManualEntry({ ...manualEntry, estimatedCostUsd: e.target.value })}
                  placeholder="auto if blank"
                  className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Actual tokens */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Actual tokens</Label>
                <Input
                  type="number"
                  value={manualEntry.actualTokens}
                  onChange={e => setManualEntry({ ...manualEntry, actualTokens: e.target.value })}
                  placeholder="from provider bill"
                  className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Actual cost USD */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Actual cost (USD)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={manualEntry.actualCostUsd}
                  onChange={e => setManualEntry({ ...manualEntry, actualCostUsd: e.target.value })}
                  placeholder="from provider bill"
                  className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Generation date */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Generation date</Label>
                <Input
                  type="date"
                  value={manualEntry.generationDate}
                  onChange={e => setManualEntry({ ...manualEntry, generationDate: e.target.value })}
                  className="bg-background border-emerald-500/30 text-gray-100 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
              {/* Status */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <SimpleSelect
                  value={manualEntry.status}
                  onChange={v => setManualEntry({ ...manualEntry, status: v })}
                  options={[
                    { value: 'generated-manually', label: 'generated-manually' },
                    { value: 'planned', label: 'planned' },
                    { value: 'dry-run', label: 'dry-run' },
                    { value: 'cancelled', label: 'cancelled' },
                  ]}
                />
              </div>
              {/* Notes */}
              <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input
                  value={manualEntry.notes}
                  onChange={e => setManualEntry({ ...manualEntry, notes: e.target.value })}
                  placeholder="Optional notes (e.g., generated via Dreamina browser, 3 retries)"
                  className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                  style={{ color: '#e5e7eb' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <p className="text-xs text-muted-foreground">
                * Required. Estimated tokens auto-computes from resolution × fps × duration if left blank.
              </p>
              <Button
                onClick={handleSaveManualEntry}
                disabled={manualSaving || !manualEntry.projectTitle.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                size="sm"
              >
                {manualSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                {manualSaving ? 'Saving...' : 'Save Manual Entry'}
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Usage History" description="Record of all video generation usage" icon={Activity}>
            <div className="flex items-center gap-2 mb-4">
              <Label className="text-gray-400 text-xs">Filter by status:</Label>
              <SimpleSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'planned', label: 'Planned' },
                  { value: 'dry-run', label: 'Dry Run' },
                  { value: 'generated-manually', label: 'Generated' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                className="w-40 h-8 text-xs"
              />
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-emerald-500/30">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-emerald-500/30">
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2">Date</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2">Project</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden lg:table-cell">Animal/Story</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden md:table-cell">Model</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden md:table-cell">Mode</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden lg:table-cell">Res</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden lg:table-cell">FPS</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden md:table-cell">Dur</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2">Est.Tokens</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2">Est.Cost</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden lg:table-cell">Act.Tokens</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden lg:table-cell">Act.Cost</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden xl:table-cell">Diff</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2">Status</th>
                    <th className="text-muted-foreground text-xs font-medium px-3 py-2 hidden xl:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsageRecords.length === 0 ? (
                    <tr><td colSpan={15} className="text-center text-muted-foreground py-8 text-xs">No usage records found</td></tr>
                  ) : (
                    filteredUsageRecords.map(record => {
                      // Prefer generatedAt (the actual generation date) over
                      // createdAt (the row-insert date). Falls back gracefully.
                      const dateStr = record.generatedAt || record.createdAt;
                      const diffTokens = (record.actualTokens != null && record.estimatedTokens != null)
                        ? record.actualTokens - record.estimatedTokens
                        : null;
                      const diffCost = (record.actualCostUsd != null && record.estimatedCostUsd != null)
                        ? record.actualCostUsd - record.estimatedCostUsd
                        : null;
                      return (
                        <tr key={record.id} className="border-b border-emerald-500/5 hover:bg-emerald-500/5">
                          <td className="text-xs text-gray-400 px-3 py-1.5">{new Date(dateStr).toLocaleDateString()}</td>
                          <td className="text-xs text-gray-300 px-3 py-1.5">{record.projectTitle || '—'}</td>
                          <td className="text-xs text-gray-400 px-3 py-1.5 hidden lg:table-cell">{record.animalStoryName || '—'}</td>
                          <td className="text-xs text-gray-300 px-3 py-1.5 hidden md:table-cell">{record.modelName}</td>
                          <td className="text-xs text-gray-400 px-3 py-1.5 hidden md:table-cell">{record.mode}</td>
                          <td className="text-xs text-gray-400 px-3 py-1.5 hidden lg:table-cell">{record.width}×{record.height}</td>
                          <td className="text-xs text-gray-400 px-3 py-1.5 hidden lg:table-cell">{record.fps}</td>
                          <td className="text-xs text-gray-400 px-3 py-1.5 hidden md:table-cell">{record.durationSeconds}s</td>
                          <td className="text-xs text-emerald-400 font-mono px-3 py-1.5">{record.estimatedTokens.toLocaleString()}</td>
                          <td className="text-xs text-emerald-400 font-mono px-3 py-1.5">${record.estimatedCostUsd.toFixed(4)}</td>
                          <td className="text-xs text-gray-300 font-mono px-3 py-1.5 hidden lg:table-cell">{record.actualTokens?.toLocaleString() ?? '—'}</td>
                          <td className="text-xs text-gray-300 font-mono px-3 py-1.5 hidden lg:table-cell">{record.actualCostUsd != null ? `$${record.actualCostUsd.toFixed(4)}` : '—'}</td>
                          <td className="text-xs font-mono px-3 py-1.5 hidden xl:table-cell">
                            {diffTokens != null ? (
                              <span className={diffTokens > 0 ? 'text-amber-400' : diffTokens < 0 ? 'text-emerald-400' : 'text-gray-400'}>
                                {diffTokens > 0 ? '+' : ''}{diffTokens.toLocaleString()}
                              </span>
                            ) : '—'}
                            {diffCost != null && (
                              <div className={`text-xs ${diffCost > 0 ? 'text-amber-400' : diffCost < 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                {diffCost > 0 ? '+' : ''}${diffCost.toFixed(4)}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-1.5"><StatusBadge status={record.status} /></td>
                          <td className="text-xs text-muted-foreground max-w-24 truncate px-3 py-1.5 hidden xl:table-cell">{record.notes || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Manual Actual Cost Entry" description="Enter actual billed costs from provider" icon={DollarSign}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Usage Record</Label>
                <SimpleSelect
                  value={actualEntryRecordId}
                  onChange={id => {
                    setActualEntryRecordId(id);
                    const rec = usageRecords.find(r => r.id === id);
                    if (rec) {
                      setActualTokens(rec.actualTokens?.toString() ?? '');
                      setActualCostUsd(rec.actualCostUsd?.toString() ?? '');
                    }
                  }}
                  placeholder="Select record..."
                  options={usageRecords.map(r => ({
                    value: r.id,
                    label: `${new Date(r.generatedAt || r.createdAt).toLocaleDateString()} — ${r.modelName} (${r.estimatedTokens.toLocaleString()} est.)`,
                  }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Actual Tokens</Label>
                <Input type="number" value={actualTokens} onChange={e => setActualTokens(e.target.value)} placeholder="Enter actual tokens" className="bg-background border-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Actual Cost (USD)</Label>
                <Input type="number" step="0.0001" value={actualCostUsd} onChange={e => setActualCostUsd(e.target.value)} placeholder="Enter actual USD" className="bg-background border-emerald-500/20" />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                {actualEntryRecordId && (() => {
                  const rec = usageRecords.find(r => r.id === actualEntryRecordId);
                  if (!rec) return null;
                  const diffTokens = actualTokens ? parseInt(actualTokens) - rec.estimatedTokens : 0;
                  const diffCost = actualCostUsd ? parseFloat(actualCostUsd) - rec.estimatedCostUsd : 0;
                  return (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Difference: <span className={diffTokens > 0 ? 'text-amber-400' : 'text-emerald-400'}>{diffTokens > 0 ? '+' : ''}{diffTokens.toLocaleString()} tokens</span>
                        {' / '}
                        <span className={diffCost > 0 ? 'text-amber-400' : 'text-emerald-400'}>{diffCost > 0 ? '+' : ''}{diffCost.toFixed(4)} USD</span>
                      </p>
                      <Button onClick={handleSaveActualCost} className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm">
                        <Save className="w-3.5 h-3.5 mr-1.5" /> Save Actual Cost
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TAB: Pricing & Plans ═══ */}
      {activeCostTab === 'pricing' && (
        <div className="space-y-6">
          <SectionCard title="Pricing Models" description="Manage model rates and pricing" icon={Layers}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricingModels.map(pm => (
                <div key={pm.id} className="bg-muted/30 rounded-lg p-4 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-emerald-400 font-semibold">{pm.name}</p>
                      <p className="text-xs text-muted-foreground">{pm.modelId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${pm.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : pm.status === 'testing' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'} text-xs`}>
                        {pm.status}
                      </Badge>
                      {editingPricingId === pm.id ? (
                        <Button size="sm" onClick={() => setEditingPricingId(null)} className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle className="w-3 h-3 mr-1" />Done
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setEditingPricingId(pm.id)} className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: '480p', field: 'rate480p', value: pm.rate480p, enabled: pm.supports480p },
                      { label: '720p', field: 'rate720p', value: pm.rate720p, enabled: pm.supports720p },
                      { label: '1080p', field: 'rate1080p', value: pm.rate1080p, enabled: pm.supports1080p },
                      { label: '4K', field: 'rate4k', value: pm.rate4k, enabled: pm.supports4k },
                    ].map(rate => (
                      <div key={rate.label} className="flex items-center justify-between bg-background rounded px-2 py-1.5">
                        <span className={`text-muted-foreground ${!rate.enabled ? 'line-through opacity-50' : ''}`}>{rate.label}</span>
                        {editingPricingId === pm.id ? (
                          <Input
                            type="number" step="0.0001" defaultValue={rate.value}
                            className="w-20 h-6 text-xs bg-background border-border"
                            onBlur={e => handleUpdatePricing(pm.id, { [rate.field]: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className="text-emerald-400 font-mono">${rate.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Provider: {pm.provider} • {pm.pricingMode}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Subscription Plans" description="Manage subscription plans and pricing" icon={Wallet}>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setNewPlanOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-sm" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Plan
              </Button>
            </div>
            {newPlanOpen && (
              <div className="bg-muted/30 rounded-lg p-4 border border-emerald-500/20 mb-4">
                <p className="text-emerald-400 text-sm font-semibold mb-3">New Plan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Input placeholder="Plan name" value={newPlanData.name} onChange={e => setNewPlanData(d => ({ ...d, name: e.target.value }))} className="bg-background border-emerald-500/20 h-8 text-sm" />
                  <Input type="number" placeholder="Price (USD)" value={newPlanData.priceUsd} onChange={e => setNewPlanData(d => ({ ...d, priceUsd: e.target.value }))} className="bg-background border-emerald-500/20 h-8 text-sm" />
                  <Input type="number" placeholder="Token allowance" value={newPlanData.tokenAllowance} onChange={e => setNewPlanData(d => ({ ...d, tokenAllowance: e.target.value }))} className="bg-background border-emerald-500/20 h-8 text-sm" />
                  <Input type="number" placeholder="Validity days" value={newPlanData.validityDays} onChange={e => setNewPlanData(d => ({ ...d, validityDays: e.target.value }))} className="bg-background border-emerald-500/20 h-8 text-sm" />
                  <div className="flex gap-2">
                    <Button onClick={handleCreatePlan} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs flex-1">Create</Button>
                    <Button variant="ghost" onClick={() => setNewPlanOpen(false)} className="h-8 text-xs text-gray-400">Cancel</Button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="bg-muted/30 rounded-lg p-4 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-emerald-400 font-semibold">{plan.name}</p>
                      <Badge className={`${plan.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'} text-xs`}>
                        {plan.status}
                      </Badge>
                    </div>
                    {editingPlanId === plan.id ? (
                      <Button size="sm" onClick={() => setEditingPlanId(null)} className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle className="w-3 h-3 mr-1" />Done
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setEditingPlanId(plan.id)} className="h-6 px-2 text-xs text-emerald-400">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {editingPlanId === plan.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground w-14">Price:</Label>
                        <Input type="number" step="0.01" defaultValue={plan.priceUsd} className="h-7 text-xs bg-background border-emerald-500/20 flex-1" onBlur={e => {
                          fetch(`/api/subscriptions/plans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...plan, priceUsd: parseFloat(e.target.value) || plan.priceUsd }) }).then(() => fetchAllData());
                        }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground w-14">Tokens:</Label>
                        <Input type="number" defaultValue={plan.tokenAllowance} className="h-7 text-xs bg-background border-emerald-500/20 flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground w-14">Days:</Label>
                        <Input type="number" defaultValue={plan.validityDays} className="h-7 text-xs bg-background border-emerald-500/20 flex-1" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>Price: <span className="text-emerald-400 font-semibold">${plan.priceUsd.toFixed(2)}</span></p>
                      <p>Tokens: <span className="text-gray-200">{plan.tokenAllowance.toLocaleString()}</span></p>
                      <p>Validity: <span className="text-gray-200">{plan.validityDays} days</span></p>
                      <p>Provider: {plan.provider}</p>
                      {plan.description && <p className="text-muted-foreground italic">{plan.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TAB: Compare Plans ═══ */}
      {activeCostTab === 'compare' && (
        <div className="space-y-6">
          <SectionCard title="3-Plan Comparison Calculator" description="Compare 3 plans side-by-side and find the cheapest for your usage" icon={Layers}>
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/90">
                <strong>Manual plan comparison — edit plan values.</strong>
                {' '}Prices below are user-editable and are NOT verified official provider pricing.
                Default Plan 1 mirrors your current active subscription (Light Plan / $30.10 / 7M tokens).
                Plans 2 & 3 are empty — fill them in with alternatives you are considering.
              </p>
            </div>

            {/* Usage selector */}
            <div className="p-3 rounded-md bg-muted/30 border border-emerald-500/20 mb-4">
              <p className="text-sm text-gray-300 font-medium mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Your Target Usage
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Target videos / month</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cmpUsageVideos}
                    onChange={e => setCmpUsageVideos(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400"
                    style={{ color: '#e5e7eb' }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Duration per video</Label>
                  <SimpleSelect
                    value={cmpUsageDuration.toString()}
                    onChange={v => setCmpUsageDuration(parseInt(v))}
                    options={[
                      { value: '10', label: '10 seconds' },
                      { value: '12', label: '12 seconds' },
                      { value: '15', label: '15 seconds' },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Resolution</Label>
                  <SimpleSelect
                    value={cmpUsageResolution}
                    onChange={setCmpUsageResolution}
                    options={[
                      { value: '720p',  label: '720p  (9:16 vertical)' },
                      { value: '1080p', label: '1080p (9:16 vertical)' },
                      { value: '4K',    label: '4K    (9:16 vertical) — estimated' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* 3 editable plan columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {cmpPlans.map((plan, idx) => {
                // Compute derived metrics for this plan
                const tokensPerVideo = (() => {
                  const dur = cmpUsageDuration;
                  if (cmpUsageResolution === '720p')  return calculateTokens(720,  1280, 24, dur, 1);
                  if (cmpUsageResolution === '1080p') return calculateTokens(1080, 1920, 24, dur, 1);
                  return calculateTokens(2160, 3840, 24, dur, 1); // 4K
                })();
                const usdPerMillionTokens = plan.includedTokens > 0 ? (plan.planCostUsd / plan.includedTokens) * 1_000_000 : 0;
                const usdPerVideo = plan.includedTokens > 0 ? (plan.planCostUsd / plan.includedTokens) * tokensPerVideo : 0;
                const videosInPlan = plan.includedTokens > 0 && tokensPerVideo > 0 ? Math.floor(plan.includedTokens / tokensPerVideo) : 0;
                const dailyTokenAllowance = plan.validityDays > 0 ? plan.includedTokens / plan.validityDays : 0;
                const neededTokens = cmpUsageVideos * tokensPerVideo;
                const overBudget = plan.includedTokens > 0 && neededTokens > plan.includedTokens;
                const remainingUnusedTokens = Math.max(0, plan.includedTokens - neededTokens);

                return (
                  <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Plan {idx + 1}</span>
                      {idx === 0 && (
                        <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                    <Input
                      value={plan.planName}
                      onChange={e => {
                        const next = [...cmpPlans];
                        next[idx] = { ...plan, planName: e.target.value };
                        setCmpPlans(next);
                      }}
                      placeholder={`Plan ${idx + 1} name`}
                      className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-sm font-medium"
                      style={{ color: '#e5e7eb' }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Cost (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={plan.planCostUsd}
                          onChange={e => {
                            const next = [...cmpPlans];
                            next[idx] = { ...plan, planCostUsd: parseFloat(e.target.value) || 0 };
                            setCmpPlans(next);
                          }}
                          className="bg-background border-emerald-500/30 text-gray-100 focus:border-emerald-400 text-xs h-8"
                          style={{ color: '#e5e7eb' }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tokens</Label>
                        <Input
                          type="number"
                          value={plan.includedTokens}
                          onChange={e => {
                            const next = [...cmpPlans];
                            next[idx] = { ...plan, includedTokens: parseInt(e.target.value) || 0 };
                            setCmpPlans(next);
                          }}
                          className="bg-background border-emerald-500/30 text-gray-100 focus:border-emerald-400 text-xs h-8"
                          style={{ color: '#e5e7eb' }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Validity (days)</Label>
                        <Input
                          type="number"
                          value={plan.validityDays}
                          onChange={e => {
                            const next = [...cmpPlans];
                            next[idx] = { ...plan, validityDays: parseInt(e.target.value) || 0 };
                            setCmpPlans(next);
                          }}
                          className="bg-background border-emerald-500/30 text-gray-100 focus:border-emerald-400 text-xs h-8"
                          style={{ color: '#e5e7eb' }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Expiry date</Label>
                        <Input
                          type="date"
                          value={plan.expiryDate}
                          onChange={e => {
                            const next = [...cmpPlans];
                            next[idx] = { ...plan, expiryDate: e.target.value };
                            setCmpPlans(next);
                          }}
                          className="bg-background border-emerald-500/30 text-gray-100 focus:border-emerald-400 text-xs h-8"
                          style={{ color: '#e5e7eb' }}
                        />
                      </div>
                    </div>
                    <Input
                      value={plan.notes}
                      onChange={e => {
                        const next = [...cmpPlans];
                        next[idx] = { ...plan, notes: e.target.value };
                        setCmpPlans(next);
                      }}
                      placeholder="Notes (optional)"
                      className="bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 text-xs h-8"
                      style={{ color: '#e5e7eb' }}
                    />

                    {/* Derived metrics */}
                    <SimpleDivider className="my-2" />
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD / 1M tokens</span>
                        <span className="text-gray-200 font-mono">${usdPerMillionTokens.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD / 15s 720p video</span>
                        <span className="text-gray-200 font-mono">
                          ${plan.includedTokens > 0
                            ? ((plan.planCostUsd / plan.includedTokens) * calculateTokens(720, 1280, 24, 15, 1)).toFixed(4)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD / 15s 1080p video</span>
                        <span className="text-gray-200 font-mono">
                          ${plan.includedTokens > 0
                            ? ((plan.planCostUsd / plan.includedTokens) * calculateTokens(1080, 1920, 24, 15, 1)).toFixed(4)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD / 15s 4K video</span>
                        <span className="text-gray-200 font-mono">
                          ${plan.includedTokens > 0
                            ? ((plan.planCostUsd / plan.includedTokens) * calculateTokens(2160, 3840, 24, 15, 1)).toFixed(4)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Videos in plan ({cmpUsageResolution} · {cmpUsageDuration}s)</span>
                        <span className="text-emerald-400 font-mono font-semibold">{videosInPlan.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily token allowance</span>
                        <span className="text-gray-200 font-mono">{Math.round(dailyTokenAllowance).toLocaleString()}</span>
                      </div>
                    </div>

                    {overBudget && (
                      <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">
                          Over budget: your target needs {neededTokens.toLocaleString()} tokens but this plan only has {plan.includedTokens.toLocaleString()}.
                        </p>
                      </div>
                    )}
                    {!overBudget && plan.includedTokens > 0 && (
                      <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-xs text-emerald-400">
                          Remaining unused tokens after target: {remainingUnusedTokens.toLocaleString()} ({((remainingUnusedTokens / plan.includedTokens) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Cheapest plan recommendation */}
          {(() => {
            const tokensPerVideo = (() => {
              const dur = cmpUsageDuration;
              if (cmpUsageResolution === '720p')  return calculateTokens(720,  1280, 24, dur, 1);
              if (cmpUsageResolution === '1080p') return calculateTokens(1080, 1920, 24, dur, 1);
              return calculateTokens(2160, 3840, 24, dur, 1);
            })();
            const neededTokens = cmpUsageVideos * tokensPerVideo;

            // Only consider plans that have enough tokens for the target usage
            const qualifyingPlans = cmpPlans
              .map((plan, idx) => ({
                idx,
                plan,
                enoughTokens: plan.includedTokens > 0 && plan.includedTokens >= neededTokens,
                costPerVideo: plan.includedTokens > 0
                  ? (plan.planCostUsd / plan.includedTokens) * tokensPerVideo
                  : Infinity,
                totalCostForTarget: plan.includedTokens > 0
                  ? (plan.planCostUsd / plan.includedTokens) * neededTokens
                  : Infinity,
              }))
              .filter(x => x.enoughTokens);

            const cheapest = qualifyingPlans.length > 0
              ? qualifyingPlans.reduce((min, p) => p.totalCostForTarget < min.totalCostForTarget ? p : min)
              : null;

            const allPlansTooSmall = cmpPlans.every(p => p.includedTokens > 0 && p.includedTokens < neededTokens);

            return (
              <SectionCard title="Cheapest Plan Recommendation" description={`Based on ${cmpUsageVideos} videos/month at ${cmpUsageResolution} · ${cmpUsageDuration}s`} icon={CheckCircle}>
                {cheapest ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/40">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">
                          Cheapest: {cheapest.plan.planName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Plan cost</p>
                          <p className="text-gray-200 font-mono">${cheapest.plan.planCostUsd.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost per video</p>
                          <p className="text-gray-200 font-mono">${cheapest.costPerVideo.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total cost for {cmpUsageVideos} videos</p>
                          <p className="text-emerald-400 font-mono font-semibold">${cheapest.totalCostForTarget.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining unused tokens</p>
                          <p className="text-gray-200 font-mono">
                            {(cheapest.plan.includedTokens - neededTokens).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-md bg-muted/30 border border-emerald-500/30">
                      <p className="text-xs text-gray-400">
                        <strong className="text-gray-300">Why is this cheapest?</strong> Among plans with enough tokens for your target usage
                        ({neededTokens.toLocaleString()} tokens = {cmpUsageVideos} × {tokensPerVideo.toLocaleString()}),
                        this plan has the lowest effective cost per video at ${cheapest.costPerVideo.toFixed(4)}/video,
                        yielding a total of ${cheapest.totalCostForTarget.toFixed(2)} for {cmpUsageVideos} videos.
                      </p>
                    </div>
                  </div>
                ) : allPlansTooSmall ? (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/40">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-semibold">Over-budget warning</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Your target usage needs <strong>{neededTokens.toLocaleString()} tokens</strong> per month
                      ({cmpUsageVideos} videos × {tokensPerVideo.toLocaleString()} tokens/video).
                      None of the 3 plans have enough tokens. Either reduce your target, increase a plan's token allowance, or chain multiple plans.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/40">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-400 font-semibold">Fill in all 3 plans</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Enter token allowances and costs for all 3 plans above to see the cheapest-plan recommendation.
                      Plans with 0 tokens are excluded from the calculation.
                    </p>
                  </div>
                )}
              </SectionCard>
            );
          })()}
        </div>
      )}

      {/* ═══ TAB: Charts ═══ */}
      {activeCostTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Token Usage Over Time" icon={TrendingUp}>
              <div className="space-y-3">
                {tokenUsageChartData.length > 0 ? tokenUsageChartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{d.date}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-emerald-500/60 rounded transition-all" style={{ width: `${budget ? Math.min(100, (d.tokens / budget.tokenAllowance) * 100) : 0}%` }} />
                    </div>
                    <span className="text-xs text-emerald-400 w-20 text-right">{(d.tokens as number).toLocaleString()}</span>
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No usage data yet</div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="USD Spent Over Time" icon={DollarSign}>
              <div className="space-y-3">
                {usdSpentChartData.length > 0 ? usdSpentChartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{d.date}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-amber-500/60 rounded transition-all" style={{ width: `${budget ? Math.min(100, (d.cumulative / budget.priceUsd) * 100) : 0}%` }} />
                    </div>
                    <span className="text-xs text-amber-400 w-20 text-right">${(d.cumulative as number).toFixed(2)}</span>
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No usage data yet</div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Remaining Tokens" icon={Gauge}>
              <div className="flex flex-col items-center justify-center py-4">
                {budget && budget.tokenAllowance > 0 ? (
                  <>
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#34d399" strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - budget.tokensRemaining / budget.tokenAllowance)}`}
                          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-400">{Math.round((budget.tokensRemaining / budget.tokenAllowance) * 100)}%</span>
                        <span className="text-xs text-muted-foreground">remaining</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3">
                      <div className="text-center">
                        <span className="text-xs text-red-400 font-medium">{budget.tokensUsed.toLocaleString()}</span>
                        <p className="text-xs text-muted-foreground">Used</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-emerald-400 font-medium">{budget.tokensRemaining.toLocaleString()}</span>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No active budget</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Video Count by Model" icon={BarChart3}>
              <div className="space-y-3">
                {videoCountChartData.length > 0 ? videoCountChartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{d.name}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div className="h-full rounded transition-all" style={{ width: `${Math.min(100, (d.count / Math.max(...videoCountChartData.map(x => x.count))) * 100)}%`, backgroundColor: barColors[i % barColors.length] }} />
                    </div>
                    <span className="text-xs text-gray-300 w-8 text-right">{d.count}</span>
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No usage data yet</div>
                )}
              </div>
            </SectionCard>
          </div>

          {budget && (
            <SectionCard title="Projected Videos Remaining Until Expiry" description={`Based on daily safe budget of ${budget.safeDailyTokenBudget.toLocaleString()} tokens/day`} icon={Clock}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: '10s videos', current: budget.estimatedVideosRemaining10s, perDay: budget.safeDailyTokenBudget > 0 ? Math.floor(budget.safeDailyTokenBudget / calculateTokens(720, 1280, 24, 10, 1)) : 0 },
                  { label: '12s videos', current: budget.estimatedVideosRemaining12s, perDay: budget.safeDailyTokenBudget > 0 ? Math.floor(budget.safeDailyTokenBudget / calculateTokens(720, 1280, 24, 12, 1)) : 0 },
                  { label: '15s 720p', current: budget.estimatedVideosRemaining15s, perDay: budget.safeDailyTokenBudget > 0 ? Math.floor(budget.safeDailyTokenBudget / calculateTokens(720, 1280, 24, 15, 1)) : 0 },
                  { label: '15s 1080p', current: budget.estimatedVideosRemaining15s1080, perDay: budget.safeDailyTokenBudget > 0 ? Math.floor(budget.safeDailyTokenBudget / calculateTokens(1080, 1920, 24, 15, 1)) : 0 },
                ].map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-lg p-4 border border-emerald-500/30 text-center">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-emerald-400">{item.current}</p>
                    <p className="text-xs text-muted-foreground mt-1">remaining now</p>
                    <SimpleDivider className="my-2" />
                    <p className="text-sm text-amber-400 font-medium">{item.perDay}</p>
                    <p className="text-xs text-muted-foreground">per day safe budget</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

// Single default export with error boundary wrapper
export default function CostDashboardSafe() {
  return <CostDashboard />;
}
