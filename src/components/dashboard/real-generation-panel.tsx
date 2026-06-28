'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CostDisplay, StepNumber } from './shared';

const REAL_CONFIRMATION = 'CONFIRM_REAL_PAID_BYTEPLUS_GENERATION';

interface RealApiStatus {
  dryRun: boolean;
  enableRealApi: boolean;
  allowPaidCalls: boolean;
  keyConfigured: boolean;
  realApiAllowed: boolean;
  message: string;
}

interface RealGenerationPanelProps {
  currentTaskId: string | null;
  dryRunPassed: boolean;
  estimatedCost: number;
  estimatedTokens: number;
}

function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs ${ok ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}
    >
      {label}: {ok ? 'OK' : 'BLOCKED'}
    </Badge>
  );
}

export function RealGenerationPanel({
  currentTaskId,
  dryRunPassed,
  estimatedCost,
  estimatedTokens,
}: RealGenerationPanelProps) {
  const [status, setStatus] = useState<RealApiStatus | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const response = await fetch('/api/real-generate');
    if (response.ok) {
      setStatus(await response.json());
    }
  }, []);

  useEffect(() => {
    refreshStatus().catch(() => setStatus(null));
  }, [refreshStatus]);

  const submitRealGeneration = useCallback(async () => {
    if (!currentTaskId || confirmation !== REAL_CONFIRMATION) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/real-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: currentTaskId, confirmation }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string; task?: { providerTaskId?: string } } | null;
      setMessage(data?.success
        ? `Submitted real BytePlus task ${data.task?.providerTaskId ?? ''}`.trim()
        : data?.error ?? 'Real BytePlus submission was blocked');
      await refreshStatus();
    } catch {
      setMessage('Real BytePlus submission failed before completion');
    } finally {
      setLoading(false);
    }
  }, [confirmation, currentTaskId, refreshStatus]);

  const enabled = Boolean(
    status?.realApiAllowed &&
    dryRunPassed &&
    currentTaskId &&
    confirmation === REAL_CONFIRMATION &&
    !loading
  );

  return (
    <Card className="bg-card border-red-500/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg text-red-400">
          <StepNumber num={6} active completed={false} />
          <ShieldAlert className="w-4 h-4" />
          Run REAL BytePlus Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-xs text-red-300 leading-relaxed">
          <strong className="text-red-200">Danger:</strong> this section can submit one real paid BytePlus ModelArk task only when the server-side flags allow it. It never exposes the API key to the browser.
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label="DRY_RUN=false" ok={status ? !status.dryRun : false} />
          <StatusBadge label="ENABLE_REAL_API=true" ok={Boolean(status?.enableRealApi)} />
          <StatusBadge label="ALLOW_PAID_CALLS=true" ok={Boolean(status?.allowPaidCalls)} />
          <StatusBadge label="Server key" ok={Boolean(status?.keyConfigured)} />
          <StatusBadge label="Dry run" ok={dryRunPassed} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-muted/30 border border-red-500/20 p-3">
            <div className="text-muted-foreground">Estimated cost before submit</div>
            <CostDisplay usd={estimatedCost} cny={estimatedCost * 7.25} size="sm" />
          </div>
          <div className="rounded bg-muted/30 border border-red-500/20 p-3">
            <div className="text-muted-foreground">Estimated tokens</div>
            <div className="text-gray-200 font-mono">{estimatedTokens.toLocaleString()}</div>
            <div className="text-muted-foreground mt-1">Final billing requires provider usage.completion_tokens.</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Type <code className="text-red-300 bg-red-500/10 px-1 py-0.5 rounded">{REAL_CONFIRMATION}</code>
          </Label>
          <Input
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            placeholder={REAL_CONFIRMATION}
            className="bg-background border-red-500/30 text-gray-100 font-mono"
          />
        </div>

        <Button
          onClick={submitRealGeneration}
          disabled={!enabled}
          className="w-full bg-red-700 hover:bg-red-800 text-white disabled:bg-gray-700 disabled:text-muted-foreground"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
          Submit One REAL Paid BytePlus Task
        </Button>

        <p className="text-xs text-muted-foreground">
          {status?.message ?? 'Checking server-side real API safety status...'}
        </p>
        {message && <p className="text-xs text-amber-300">{message}</p>}
      </CardContent>
    </Card>
  );
}
