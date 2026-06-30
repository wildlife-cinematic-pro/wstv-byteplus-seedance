// FILE 2: src/components/dashboard/cost-settings.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Save, RefreshCw, AlertTriangle, Info, Plus, Trash2, 
  ShieldCheck, Wallet, CreditCard, DollarSign, Calendar as CalendarIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ManualActualCostEntry {
  id: string;
  actualCostUsd: number;
  actualTokensUsed: number;
  provider: string;
  generationDate: string;
  notes: string;
}

interface CostSettingsProps {
  /**
   * Server-side initial budget value (read from DB via page.tsx → client.tsx).
   * If provided, this is used as the initial input value instead of falling
   * back to localStorage. This guarantees the Settings tab shows the same
   * value as the top header on first paint.
   */
  initialBudget?: {
    monthlyLimit: number;
    spentThisMonth: number;
    currency: string;
    alertThreshold: number;
  } | null;
}

export function CostSettings({ initialBudget }: CostSettingsProps = {}) {
  // ─── Monthly Budget State ───
  // Canonical Prisma field is `monthlyLimit`. We keep the local state name in
  // sync with the schema to avoid confusion. Legacy localStorage key
  // `wstv_monthly_budget_usd` is still read for backward compatibility, but
  // new writes use `wstv_monthly_limit`.
  const [monthlyLimit, setMonthlyLimit] = useState<number>(
    initialBudget?.monthlyLimit ?? 50
  );
  const [exchangeRateUsdJpy, setExchangeRateUsdJpy] = useState<number>(149.5);

  // ─── Seedance Plan State ───
  const [provider, setProvider] = useState('Seedance / BytePlus / Dreamina');
  const [planName, setPlanName] = useState('Seedance Light Plan');
  const [purchaseDate, setPurchaseDate] = useState('2026-06-16');
  const [planCostUsd, setPlanCostUsd] = useState<number>(30.10);
  const [includedTokens, setIncludedTokens] = useState<number>(7000000);
  const [validityDays, setValidityDays] = useState<number>(90);
  const [expiryDate, setExpiryDate] = useState('2026-09-14');
  const [remainingTokens, setRemainingTokens] = useState<number>(7000000);
  const [planStatus, setPlanStatus] = useState('Active');
  const [planNotes, setPlanNotes] = useState('Manual subscription tracker. Does not connect to real API.');

  // ─── Manual Actual Cost State ───
  const [actualCostUsd, setActualCostUsd] = useState<number>(0);
  const [actualTokensUsed, setActualTokensUsed] = useState<number>(0);
  const [manualProvider, setManualProvider] = useState('');
  const [generationDate, setGenerationDate] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualEntries, setManualEntries] = useState<ManualActualCostEntry[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ─── Load from localStorage (legacy + canonical keys) ───
  // Server-side initialBudget always wins on first paint; localStorage is
  // only consulted as a fallback so the input doesn't flicker if the user
  // previously typed a value but the DB save failed.
  useEffect(() => {
    try {
      const legacyBudget = localStorage.getItem('wstv_monthly_budget_usd');
      const canonicalBudget = localStorage.getItem('wstv_monthly_limit');
      const stored = canonicalBudget ?? legacyBudget;
      if (stored && initialBudget == null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMonthlyLimit(Number(stored) || 50);
      }

      const rate = localStorage.getItem('wstv_exchange_rate_usd_jpy');
      if (rate) setExchangeRateUsdJpy(Number(rate) || 149.5);

      const p_provider = localStorage.getItem('wstv_plan_provider');
      if (p_provider) setProvider(p_provider);
      
      const p_name = localStorage.getItem('wstv_plan_name');
      if (p_name) setPlanName(p_name);

      const p_pdate = localStorage.getItem('wstv_plan_purchase_date');
      if (p_pdate) setPurchaseDate(p_pdate);

      const p_cost = localStorage.getItem('wstv_plan_cost_usd');
      if (p_cost) setPlanCostUsd(Number(p_cost) || 0);

      const p_tokens = localStorage.getItem('wstv_plan_included_tokens');
      if (p_tokens) setIncludedTokens(Number(p_tokens) || 0);

      const p_vdays = localStorage.getItem('wstv_plan_validity_days');
      if (p_vdays) setValidityDays(Number(p_vdays) || 0);

      const p_edate = localStorage.getItem('wstv_plan_expiry_date');
      if (p_edate) setExpiryDate(p_edate);

      const p_rtokens = localStorage.getItem('wstv_plan_remaining_tokens');
      if (p_rtokens) setRemainingTokens(Number(p_rtokens) || 0);

      const p_status = localStorage.getItem('wstv_plan_status');
      if (p_status) setPlanStatus(p_status);

      const entries = localStorage.getItem('wstv_manual_actual_cost_entries');
      if (entries) {
        const parsed = JSON.parse(entries);
        if (Array.isArray(parsed)) {
          setManualEntries(parsed.map((e: any) => ({
            id: e?.id || Math.random().toString(36).slice(2),
            actualCostUsd: Number(e?.actualCostUsd || 0),
            actualTokensUsed: Number(e?.actualTokensUsed || 0),
            provider: e?.provider || '',
            generationDate: e?.generationDate || '',
            notes: e?.notes || ''
          })));
        }
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ─── Save Handlers ───
  // Saves the monthly limit to (1) localStorage, (2) DB via POST /api/cost-summary.
  // The POST response contains the actual persisted row, so we forward it to
  // the parent DashboardClient via a CustomEvent with `detail`. This lets the
  // top-right header update INSTANTLY without a follow-up GET and without a
  // full dev-server restart.
  const handleSaveBudget = async () => {
    // Write to BOTH the canonical and legacy localStorage keys so any older
    // code that still reads `wstv_monthly_budget_usd` keeps working.
    localStorage.setItem('wstv_monthly_limit', String(monthlyLimit));
    localStorage.setItem('wstv_monthly_budget_usd', String(monthlyLimit));
    localStorage.setItem('wstv_exchange_rate_usd_jpy', String(exchangeRateUsdJpy));

    try {
      const res = await fetch('/api/cost-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ monthlyLimit })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Budget save failed:', err);
        showToast(`Failed to save budget: ${err?.error ?? res.statusText}`);
        return;
      }

      const data = await res.json();
      const savedLimit = data?.budget?.monthlyLimit ?? monthlyLimit;

      // Keep the input field in sync with what actually landed in the DB.
      setMonthlyLimit(savedLimit);

      // Tell the parent dashboard to update its header IMMEDIATELY using the
      // value returned by the API. A second CustomEvent without `detail` is
      // also dispatched as a fallback signal for any listener that doesn't
      // read the detail payload.
      window.dispatchEvent(
        new CustomEvent('wstv-budget-updated', {
          detail: { monthlyLimit: savedLimit }
        })
      );
      showToast(`Budget saved: $${savedLimit.toFixed(2)} / month`);
    } catch (e) {
      console.error('Budget save network error:', e);
      showToast('Failed to save budget settings');
    }
  };

  const handleSavePlan = () => {
    localStorage.setItem('wstv_plan_provider', provider);
    localStorage.setItem('wstv_plan_name', planName);
    localStorage.setItem('wstv_plan_purchase_date', purchaseDate);
    localStorage.setItem('wstv_plan_cost_usd', String(planCostUsd));
    localStorage.setItem('wstv_plan_included_tokens', String(includedTokens));
    localStorage.setItem('wstv_plan_validity_days', String(validityDays));
    localStorage.setItem('wstv_plan_expiry_date', expiryDate);
    localStorage.setItem('wstv_plan_remaining_tokens', String(remainingTokens));
    localStorage.setItem('wstv_plan_status', planStatus);
    window.dispatchEvent(new CustomEvent('wstv-budget-updated'));
    showToast('Plan settings saved');
  };

  const handleAddManualCost = () => {
    if (actualCostUsd <= 0 && actualTokensUsed <= 0) {
      showToast('Please enter cost or tokens');
      return;
    }
    const newEntry: ManualActualCostEntry = {
      id: `manual-${Date.now()}`,
      actualCostUsd,
      actualTokensUsed,
      provider: manualProvider || provider,
      generationDate: generationDate || new Date().toISOString().split('T')[0],
      notes: manualNotes,
    };
    const updated = [...(manualEntries ?? []), newEntry];
    setManualEntries(updated);
    localStorage.setItem('wstv_manual_actual_cost_entries', JSON.stringify(updated));

    if (actualTokensUsed > 0) {
      const newRemaining = Math.max(0, remainingTokens - actualTokensUsed);
      setRemainingTokens(newRemaining);
      localStorage.setItem('wstv_plan_remaining_tokens', String(newRemaining));
    }

    setActualCostUsd(0);
    setActualTokensUsed(0);
    setManualProvider('');
    setGenerationDate('');
    setManualNotes('');
    window.dispatchEvent(new CustomEvent('wstv-budget-updated'));
    showToast('Manual actual cost added');
  };

  const handleRemoveManualCost = (id: string) => {
    const updated = (manualEntries ?? []).filter(e => e.id !== id);
    setManualEntries(updated);
    localStorage.setItem('wstv_manual_actual_cost_entries', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wstv-budget-updated'));
    showToast('Manual cost removed');
  };

  const monthlyBudgetJpy = (monthlyLimit * exchangeRateUsdJpy).toFixed(2);

  const inputClassName = "bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 focus:ring-emerald-400/30";
  const selectClassName = "bg-[oklch(0.10_0.02_155)] border border-emerald-500/30 text-gray-100 rounded-md px-3 py-2 focus:border-emerald-400 focus:outline-none";

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-sm px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
          {toastMsg}
        </div>
      )}

      {/* D. Clear Explanation Box */}
      <Card className="bg-emerald-500/5 border-emerald-500/30">
        <CardContent className="pt-6 space-y-2 text-sm text-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-emerald-400">Safe Mode & Cost Tracking Guide</span>
          </div>
          <p><strong className="text-emerald-400">Budget:</strong> Your monthly planning limit.</p>
          <p><strong className="text-emerald-400">Estimated Spend:</strong> Dry-run/planned cost only. Not real money.</p>
          <p><strong className="text-emerald-400">Actual Spend:</strong> Manually entered real usage.</p>
          <p><strong className="text-emerald-400">Plan Cost:</strong> Subscription/credit purchase, separate from usage estimate.</p>
          <p><strong className="text-emerald-400">Safe Mode:</strong> No real API call and no automatic real charge.</p>
        </CardContent>
      </Card>

      {/* A. Monthly Budget Settings */}
      <Card className="bg-[oklch(0.18_0.03_155)] border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-emerald-400 text-lg">Monthly Budget — Planning Limit</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Monthly Budget (USD)</Label>
              <Input 
                type="number" 
                value={monthlyLimit} 
                onChange={e => setMonthlyLimit(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Exchange Rate (USD → JPY)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={exchangeRateUsdJpy} 
                onChange={e => setExchangeRateUsdJpy(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">Monthly Budget (JPY)</Label>
            <div className="bg-[oklch(0.09_0.015_155)] border border-emerald-500/20 text-gray-200 rounded-md p-2.5 text-sm font-mono">
              ¥{monthlyBudgetJpy}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Info className="w-3 h-3" /> Dry-run estimate only. No real charge.
          </div>
          <Button onClick={handleSaveBudget} className="bg-emerald-600 hover:bg-emerald-700" size="sm">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Budget Settings
          </Button>
        </CardContent>
      </Card>

      {/* B. Seedance Plan Settings */}
      <Card className="bg-[oklch(0.18_0.03_155)] border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-emerald-400 text-lg">Seedance / BytePlus Plan Tracker</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Provider</Label>
              <select 
                className={`w-full h-10 ${selectClassName}`}
                value={provider} 
                onChange={e => setProvider(e.target.value)}
              >
                <option>Seedance / BytePlus / Dreamina</option>
                <option>Seedance</option>
                <option>BytePlus</option>
                <option>Dreamina</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Plan Name</Label>
              <Input 
                value={planName} 
                onChange={e => setPlanName(e.target.value)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Purchase Date</Label>
              <Input 
                type="date" 
                value={purchaseDate} 
                onChange={e => setPurchaseDate(e.target.value)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Expiry Date</Label>
              <Input 
                type="date" 
                value={expiryDate} 
                onChange={e => setExpiryDate(e.target.value)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Plan Cost (USD)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={planCostUsd} 
                onChange={e => setPlanCostUsd(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Validity (Days)</Label>
              <Input 
                type="number" 
                value={validityDays} 
                onChange={e => setValidityDays(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Included Tokens</Label>
              <Input 
                type="number" 
                value={includedTokens} 
                onChange={e => setIncludedTokens(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Remaining Tokens (Manual Adjust)</Label>
              <Input 
                type="number" 
                value={remainingTokens} 
                onChange={e => setRemainingTokens(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Status</Label>
              <select 
                className={`w-full h-10 ${selectClassName}`}
                value={planStatus} 
                onChange={e => setPlanStatus(e.target.value)}
              >
                <option>Active</option>
                <option>Expired</option>
                <option>Paused</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">Notes</Label>
            <Input 
              value={planNotes} 
              onChange={e => setPlanNotes(e.target.value)} 
              className={inputClassName}
              style={{ color: '#e5e7eb' }}
            />
          </div>
          <Button onClick={handleSavePlan} className="bg-emerald-600 hover:bg-emerald-700" size="sm">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Plan Settings
          </Button>
        </CardContent>
      </Card>

      {/* C. Manual Actual Cost Entry */}
      <Card className="bg-[oklch(0.18_0.03_155)] border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-emerald-400 text-lg">Manual Actual Cost Entry</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">For manual browser generations only. Do not use for dry-run estimates.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Actual Cost (USD)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={actualCostUsd} 
                onChange={e => setActualCostUsd(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Actual Tokens Used</Label>
              <Input 
                type="number" 
                value={actualTokensUsed} 
                onChange={e => setActualTokensUsed(Number(e.target.value) || 0)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Provider</Label>
              <Input 
                value={manualProvider} 
                onChange={e => setManualProvider(e.target.value)} 
                placeholder="e.g., Seedance Browser" 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">Generation Date</Label>
              <Input 
                type="date" 
                value={generationDate} 
                onChange={e => setGenerationDate(e.target.value)} 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-gray-400 text-xs">Notes</Label>
              <Input 
                value={manualNotes} 
                onChange={e => setManualNotes(e.target.value)} 
                placeholder="e.g., Manual generation for Lion Rescue video" 
                className={inputClassName}
                style={{ color: '#e5e7eb' }}
              />
            </div>
          </div>
          <Button onClick={handleAddManualCost} className="bg-emerald-600 hover:bg-emerald-700" size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Actual Cost
          </Button>

          {(manualEntries ?? []).length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-gray-400 text-xs">Manual Cost History</Label>
              {(manualEntries ?? []).map(entry => (
                <div key={entry.id} className="flex items-center justify-between bg-[oklch(0.13_0.02_155)] border border-emerald-500/10 p-3 rounded-md">
                  <div className="text-xs text-gray-300">
                    <span className="text-emerald-400 font-medium">${entry.actualCostUsd.toFixed(2)}</span> / {entry.actualTokensUsed.toLocaleString()} tokens
                    <span className="text-gray-500 ml-2">({entry.generationDate})</span>
                    <p className="text-gray-500 mt-1">{entry.notes}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveManualCost(entry.id)} className="text-gray-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}