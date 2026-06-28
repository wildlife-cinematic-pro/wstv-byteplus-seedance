'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, DollarSign, Loader2, ShieldCheck, Lock, Unlock, KeyRound, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { GateProgress, StepNumber, CostDisplay } from './shared';
import type { Gates } from './types';

interface StepPaidProps {
  visible: boolean;
  safeMode: boolean;
  gates: Gates;
  allGatesPassed: boolean;
  confirmationText: string;
  setConfirmationText: (v: string) => void;
  paidLoading: boolean;
  currentTaskId: string | null;
  storyboardRiskAcknowledged: boolean;
  audioRiskAcknowledged: boolean;
  videoRiskAcknowledged: boolean;
  estimatedCost: number;
  onPaidSuccess: () => void;
  // ─── Local UI Lock (NOT real security) ───
  // paidUnlocked=false  → show "Advanced Paid Controls Locked" + unlock input
  // paidUnlocked=true   → show advanced controls, but Safe Mode + gates still apply
  paidUnlocked: boolean;
  unlockInput: string;
  setUnlockInput: (v: string) => void;
  unlockError: boolean;
  onUnlockSubmit: () => void;
  onLock: () => void;
}

const GATE_EXPLANATIONS: Record<string, string> = {
  'Safe Mode is OFF': 'Required: Safe Mode prevents all paid API calls',
  'Dry run passed (not stale)': 'A successful dry run validates your configuration without cost',
  'Prompt within character limit': 'Prompt is non-empty (length is a warning, not a hard limit — long prompts show a warning but do not block)',
  'All reference media URIs are API-ready': 'References must use official API-ready media URIs: HTTPS, asset://, or supported Base64 where allowed',
  'Storyboard risk acknowledged': 'You must acknowledge storyboard reference risks',
  'Audio reference risk acknowledged': 'You must acknowledge audio reference risks',
  'Video reference risk acknowledged': 'You must acknowledge video reference risks',
  'Budget check passed': 'Estimated cost must not exceed remaining monthly budget',
  'Max cost check passed': 'Estimated cost must not exceed your cost cap',
  'No duplicate submission': 'No identical task is currently being processed',
};

/** Gate item with mount animation via key-driven remount */
function GateItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div key={`${passed}`} className="animate-[gateFlash_0.4s_ease-out]">
      <div className="flex items-center gap-2">
        {passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
        <span className={`text-sm ${passed ? 'text-gray-300' : 'text-red-400'}`}>{label}</span>
      </div>
      <p className="text-xs text-muted-foreground ml-6 mt-0.5">{GATE_EXPLANATIONS[label] ?? ''}</p>
    </div>
  );
}

function CostBreakdownCard({ estimatedCost, duration }: { estimatedCost: number; duration: number }) {
  const costPerSec = duration > 0 ? estimatedCost / duration : 0;
  const cny = estimatedCost * 7.25;
  return (
    <div className="p-3 rounded-md bg-muted/30 border border-amber-500/20 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Cost Breakdown</span>
      </div>
      <div className="flex items-baseline gap-3">
        <CostDisplay usd={estimatedCost} cny={cny} size="lg" />
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>${costPerSec.toFixed(3)}/sec</span>
        <span>≈ ¥{cny.toFixed(2)} CNY</span>
      </div>
      <p className="text-xs text-amber-400 font-bold flex items-center gap-1">
        <DollarSign className="w-3.5 h-3.5" /> Simulation only — no real BytePlus request is available
      </p>
    </div>
  );
}

function ConfirmProgress({ text, target }: { text: string; target: string }) {
  const matched = text.length <= target.length
    ? target.slice(0, text.length) === text ? text.length : text.split('').filter((c, i) => c === target[i]).length
    : 0;
  const pct = Math.round((matched / target.length) * 100);
  const complete = text === target;
  return (
    <div className="mt-2 space-y-1">
      <div className="font-mono text-xs tracking-wider">
        {target.split('').map((ch, i) => (
          <span key={i} className={i < text.length && text[i] === ch ? 'text-emerald-400' : 'text-muted-foreground'}>{ch}</span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded bg-muted overflow-hidden">
          <div className={`h-full rounded transition-all duration-300 ${complete ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs ${complete ? 'text-emerald-400' : 'text-muted-foreground'}`}>{pct}%</span>
      </div>
    </div>
  );
}

function SubmitOverlay({ stage }: { stage: 'validating' | 'submitting' | 'done' }) {
  const labels = { validating: 'Validating...', submitting: 'Simulating...', done: 'Simulation complete!' };
  const icons = { validating: <Loader2 className="w-5 h-5 animate-spin" />, submitting: <Loader2 className="w-5 h-5 animate-spin" />, done: <CheckCircle2 className="w-5 h-5" /> };
  return (
    <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-2 z-10 backdrop-blur-sm transition-all">
      {icons[stage]}
      <span className={`text-sm font-medium ${stage === 'done' ? 'text-emerald-400' : 'text-amber-400'}`}>{labels[stage]}</span>
    </div>
  );
}

/** Countdown hook — 3-second delay before submit is enabled */
function useCountdown(enabled: boolean) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, 3 - elapsed);
      setRemaining(left);
    }, 250);
    // Initial tick via setTimeout to avoid synchronous setState in effect
    const initId = setTimeout(() => setRemaining(3), 0);
    return () => { clearInterval(id); clearTimeout(initId); };
  }, [enabled]);

  return remaining;
}

// Reusable input className for paid-zone — guarantees visible dark-theme text
const PAID_INPUT_CLASS = "bg-background border-emerald-500/30 text-gray-100 placeholder:text-muted-foreground/60 focus:border-emerald-400 focus:ring-emerald-400/30";

export function StepPaid({
  visible, safeMode, gates, allGatesPassed,
  confirmationText, setConfirmationText, paidLoading,
  currentTaskId, storyboardRiskAcknowledged,
  audioRiskAcknowledged, videoRiskAcknowledged,
  estimatedCost, onPaidSuccess,
  paidUnlocked, unlockInput, setUnlockInput, unlockError, onUnlockSubmit, onLock,
}: StepPaidProps) {
  const [submitStage, setSubmitStage] = useState<'idle' | 'validating' | 'submitting' | 'done'>('idle');
  const paidSubmitEnabled = allGatesPassed && confirmationText === 'SUBMIT_ONE_PAID_TASK';
  const duration = 6;
  const countdown = useCountdown(paidSubmitEnabled && submitStage === 'idle');

  const submitPaid = useCallback(async () => {
    if (!currentTaskId || confirmationText !== 'SUBMIT_ONE_PAID_TASK') return;
    setSubmitStage('validating');
    await new Promise(r => setTimeout(r, 800));
    setSubmitStage('submitting');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: currentTaskId, confirmation: confirmationText,
          storyboardRiskAcknowledged, audioRiskAcknowledged, videoRiskAcknowledged,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubmitStage('done');
          setTimeout(() => { setSubmitStage('idle'); setConfirmationText(''); onPaidSuccess(); }, 1200);
          return;
        }
      }
      setSubmitStage('idle');
    } catch (err) {
      console.error('Paid generation error:', err);
      setSubmitStage('idle');
    }
  }, [currentTaskId, confirmationText, storyboardRiskAcknowledged, audioRiskAcknowledged, videoRiskAcknowledged, onPaidSuccess, setConfirmationText]);

  // ═══════════════════════════════════════════════════════════════════
  // STATE 1: LOCKED (default)
  // Show ONLY the lock card. Do NOT show SUBMIT_ONE_PAID_TASK, the submit
  // button, the cost breakdown, the gate list, or the real-paid-request
  // warning. This is the default state on every page load.
  // ═══════════════════════════════════════════════════════════════════
  if (!paidUnlocked) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <StepNumber num={5} active completed={false} />
            <span className="text-gray-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Advanced Paid Controls Locked
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-md bg-muted/30 border border-border space-y-2">
            <p className="text-xs text-gray-400 leading-relaxed">
              Paid generation controls are hidden by default to prevent accidental submissions during Dry-Run / Planning workflow.
            </p>
            <p className="text-xs text-muted-foreground">
              Safe Mode is <span className="text-emerald-400 font-semibold">ON</span> · Dry-Run only · No real API calls
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" />
              Enter local unlock phrase
            </Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={unlockInput}
                onChange={(e) => setUnlockInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onUnlockSubmit(); }}
                placeholder="Unlock phrase"
                className={`${PAID_INPUT_CLASS} font-mono text-sm ${unlockError ? 'border-red-500/50 focus:border-red-500' : ''}`}
                style={{ color: '#e5e7eb' }}
                autoFocus={false}
              />
              <Button
                onClick={onUnlockSubmit}
                variant="outline"
                size="sm"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                Unlock
              </Button>
            </div>
            {unlockError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <XCircle className="w-3 h-3" />
                Incorrect unlock phrase. Try again.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              ⚠ This is a local UI lock only — not real security. All server-side safety checks remain in place.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATE 2: UNLOCKED but Safe Mode is ON
  // Show advanced controls area + Lock button + clear warning, but do NOT
  // show SUBMIT_ONE_PAID_TASK input or the submit button. The user must
  // turn Safe Mode OFF first.
  // ═══════════════════════════════════════════════════════════════════
  if (safeMode) {
    return (
      <Card className="bg-card border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <StepNumber num={5} active completed={false} />
            <span className="text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Advanced Paid Controls
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLock}
              className="ml-auto text-xs text-muted-foreground hover:text-gray-300 h-6 px-2"
              title="Re-hide the Paid Zone"
            >
              <Lock className="w-3 h-3 mr-1" />
              Lock Paid Controls
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clear Safe Mode warning */}
          <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/40 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-400">
                Safe Mode is ON. Paid submit remains disabled.
              </p>
              <p className="text-xs text-gray-400">
                To submit a paid task, you must: (1) turn Safe Mode OFF, (2) pass a dry run,
                (3) pass all 10 pre-submission gates, (4) type SUBMIT_ONE_PAID_TASK.
              </p>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Dry-Run Mode Active
            </Badge>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10">
              No Real Charges
            </Badge>
            <Badge variant="outline" className="text-xs border-border text-gray-400 bg-muted">
              Unlock phrase accepted
            </Badge>
          </div>

          {/* Show cost breakdown as info-only — but NOT the submit UI */}
          <CostBreakdownCard estimatedCost={estimatedCost} duration={duration} />

          <div className="p-3 rounded-md bg-muted/30 border border-border">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Why is the submit button hidden?</strong>
              <br />
              The unlock phrase only reveals this advanced controls area. It does NOT bypass
              Safe Mode, the dry-run requirement, or any of the 10 pre-submission gates.
              Once you turn Safe Mode OFF (top-right header toggle) AND pass a dry run AND
              pass all gates, the SUBMIT_ONE_PAID_TASK input and submit button will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATE 3: UNLOCKED + Safe Mode OFF, but dry run not passed OR gates not passed
  // Show the gate list (so the user can see what's missing), but do NOT
  // show SUBMIT_ONE_PAID_TASK input or the submit button.
  // ═══════════════════════════════════════════════════════════════════
  if (!allGatesPassed || !visible) {
    const gateItems = [
      { label: 'Safe Mode is OFF', passed: gates.safeModeOff },
      { label: 'Dry run passed (not stale)', passed: gates.dryRunPassed },
      { label: 'Prompt within character limit', passed: gates.promptWithinLimit },
      { label: 'All reference media URIs are API-ready', passed: gates.urlsValid },
      { label: 'Storyboard risk acknowledged', passed: gates.storyboardAcknowledged },
      { label: 'Audio reference risk acknowledged', passed: gates.audioRiskAcknowledged },
      { label: 'Video reference risk acknowledged', passed: gates.videoRiskAcknowledged },
      { label: 'Budget check passed', passed: gates.budgetCheck },
      { label: 'Max cost check passed', passed: gates.maxCostCheck },
      { label: 'No duplicate submission', passed: gates.noDuplicate },
    ];
    const passedCount = gateItems.filter(g => g.passed).length;

    return (
      <Card className="bg-card border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <StepNumber num={5} active completed={false} />
            <span className="text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Advanced Paid Controls — Gates Not Passed
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLock}
              className="ml-auto text-xs text-muted-foreground hover:text-gray-300 h-6 px-2"
              title="Re-hide the Paid Zone"
            >
              <Lock className="w-3 h-3 mr-1" />
              Lock Paid Controls
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CostBreakdownCard estimatedCost={estimatedCost} duration={duration} />

          <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/40 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-400">
                Not all gates have passed yet.
              </p>
              <p className="text-xs text-gray-400">
                Once all 10 gates below show green, the SUBMIT_ONE_PAID_TASK input will appear here.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Pre-submission Gates</Label>
            <GateProgress passed={passedCount} total={10} />
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {gateItems.map((gate, i) => <GateItem key={`${i}-${gate.passed}`} label={gate.label} passed={gate.passed} />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATE 4: UNLOCKED + Safe Mode OFF + dry run passed + ALL gates passed
  // NOW show SUBMIT_ONE_PAID_TASK input and the submit button.
  // The submit button is still disabled until the user types the exact
  // confirmation text AND the 3-second countdown completes.
  // ═══════════════════════════════════════════════════════════════════
  const gateItems = [
    { label: 'Safe Mode is OFF', passed: gates.safeModeOff },
    { label: 'Dry run passed (not stale)', passed: gates.dryRunPassed },
    { label: 'Prompt within character limit', passed: gates.promptWithinLimit },
    { label: 'All reference media URIs are API-ready', passed: gates.urlsValid },
    { label: 'Storyboard risk acknowledged', passed: gates.storyboardAcknowledged },
    { label: 'Audio reference risk acknowledged', passed: gates.audioRiskAcknowledged },
    { label: 'Video reference risk acknowledged', passed: gates.videoRiskAcknowledged },
    { label: 'Budget check passed', passed: gates.budgetCheck },
    { label: 'Max cost check passed', passed: gates.maxCostCheck },
    { label: 'No duplicate submission', passed: gates.noDuplicate },
  ];
  const passedCount = gateItems.filter(g => g.passed).length;

  return (
    <Card className="bg-card border-amber-500/30 relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <StepNumber num={5} active completed={allGatesPassed} />
          <span className="text-amber-400">Paid Zone — All Gates Passed</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLock}
            className="ml-auto text-xs text-muted-foreground hover:text-gray-300 h-6 px-2"
            title="Re-hide the Paid Zone"
          >
            <Lock className="w-3 h-3 mr-1" />
            Lock Paid Controls
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CostBreakdownCard estimatedCost={estimatedCost} duration={duration} />

        <div className="space-y-2">
          <Label className="text-sm text-gray-400">Pre-submission Gates</Label>
          <GateProgress passed={passedCount} total={10} />
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {gateItems.map((gate, i) => <GateItem key={`${i}-${gate.passed}`} label={gate.label} passed={gate.passed} />)}
          </div>
        </div>

        <Separator className="bg-emerald-500/10" />

        <div>
          <Label className="text-sm text-gray-400 mb-2 block">
            Type <code className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs font-mono">SUBMIT_ONE_PAID_TASK</code> to confirm
          </Label>
          <Input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="SUBMIT_ONE_PAID_TASK"
            className={`${PAID_INPUT_CLASS} font-mono`}
            style={{ color: '#e5e7eb' }}
          />
          {confirmationText.length > 0 && <ConfirmProgress text={confirmationText} target="SUBMIT_ONE_PAID_TASK" />}
        </div>

        <div className="relative">
          {submitStage !== 'idle' && <SubmitOverlay stage={submitStage} />}
          <Button onClick={submitPaid} disabled={!paidSubmitEnabled || paidLoading || countdown > 0}
            className={`w-full py-5 font-medium text-base transition-all duration-300 ${
              paidSubmitEnabled && countdown === 0 ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_16px_rgba(217,119,6,0.4)]' : 'bg-gray-700 text-muted-foreground cursor-not-allowed'
            }`} size="lg">
            {paidLoading || submitStage !== 'idle' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <DollarSign className="w-5 h-5 mr-2" />}
            {countdown > 0 ? `Wait ${countdown}s...` : submitStage === 'done' ? 'Simulation complete!' : 'Simulate Paid Task'}
          </Button>
        </div>

        {!paidSubmitEnabled && allGatesPassed && confirmationText !== 'SUBMIT_ONE_PAID_TASK' && (
          <p className="text-xs text-amber-400/70 text-center">
            Type the exact confirmation token to enable submission
          </p>
        )}
      </CardContent>
    </Card>
  );
}
