'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type RealApiStatus = {
  dryRun: boolean;
  enableRealApi: boolean;
  allowPaidCalls: boolean;
  keyConfigured: boolean;
  realApiAllowed: boolean;
  message: string;
};

type ActiveTask = {
  id: string;
  status: string;
  createdAt: string;
  lastCheckedAt?: string | null;
  pollCount?: number;
  localVideoUrl?: string | null;
  error?: string | null;
};

export function RealGenerationPanel({
  currentTaskId,
  dryRunPassed,
  estimatedCost,
  estimatedTokens,
  maxCostUsd,
}: {
  currentTaskId: string | null;
  dryRunPassed: boolean;
  estimatedCost: number;
  estimatedTokens: number;
  maxCostUsd: string;
}) {
  const [status, setStatus] = useState<RealApiStatus | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    const response = await fetch('/api/real-generate');
    if (response.ok) setStatus(await response.json() as RealApiStatus);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshStatus().catch(() => setStatus(null));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshStatus]);

  const submit = useCallback(async () => {
    if (!currentTaskId || !dryRunPassed || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const confirmationResponse = await fetch(`/api/real-generate?taskId=${encodeURIComponent(currentTaskId)}`);
      const confirmation = await confirmationResponse.json().catch(() => null) as { confirmationNonce?: string; error?: string } | null;
      if (!confirmationResponse.ok || !confirmation?.confirmationNonce) {
        setMessage(confirmation?.error ?? 'Paid confirmation is unavailable.');
        return;
      }
      const response = await fetch('/api/real-generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: currentTaskId, confirmationNonce: confirmation.confirmationNonce }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string; task?: { id: string; status: string; createdAt: string } } | null;
      if (response.ok && data?.success && data.task) {
        setActiveTask({ id: data.task.id, status: data.task.status, createdAt: data.task.createdAt });
        setMessage('Paid task submitted. The server retains provider identifiers and URLs.');
      } else {
        setMessage(data?.error ?? 'Paid submission was blocked.');
      }
    } catch {
      setMessage('Paid submission failed before a confirmed result. Do not retry automatically.');
    } finally {
      setBusy(false);
      refreshStatus().catch(() => undefined);
    }
  }, [busy, currentTaskId, dryRunPassed, refreshStatus]);

  const checkStatus = useCallback(async () => {
    if (!activeTask || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/real-task-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: activeTask.id }),
      });
      const data = await response.json().catch(() => null) as {
        success?: boolean; error?: string;
        task?: { id: string; status: string; lastCheckedAt?: string | null; pollCount?: number; localVideoUrl?: string | null };
      } | null;
      if (response.ok && data?.success && data.task) {
        setActiveTask(current => current ? { ...current, ...data.task } : current);
        setMessage('Status checked once. No task identifiers or signed provider URLs were returned.');
      } else {
        setMessage(data?.error ?? 'Status check failed.');
      }
    } catch {
      setMessage('Status check failed.');
    } finally {
      setBusy(false);
    }
  }, [activeTask, busy]);

  const validMaxCost = Number.isFinite(Number(maxCostUsd)) && Number(maxCostUsd) >= estimatedCost && Number(maxCostUsd) > 0;
  const canSubmit = Boolean(status?.realApiAllowed && currentTaskId && dryRunPassed && validMaxCost && !busy && !activeTask);

  return (
    <Card className="border-red-500/30 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-300"><ShieldAlert className="h-5 w-5" />Real paid generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Dry run: {status?.dryRun ? 'ON' : 'OFF'}</Badge>
          <Badge variant="outline">Paid calls: {status?.realApiAllowed ? 'enabled' : 'disabled'}</Badge>
        </div>
        <p className="text-muted-foreground">{status?.message ?? 'Checking server-side paid-generation safeguards…'}</p>
        <p className="text-xs text-muted-foreground">Estimate: ${estimatedCost.toFixed(4)} · {estimatedTokens.toLocaleString()} tokens. A short-lived server-signed confirmation is requested only at submission time.</p>
        <Button onClick={submit} disabled={!canSubmit} className="bg-red-700 hover:bg-red-800">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
          Submit one real paid task
        </Button>
        {activeTask ? (
          <div className="space-y-2 rounded border border-border p-3 text-xs">
            <p>Status: <span className="font-medium">{activeTask.status}</span></p>
            <p>Checks: {activeTask.pollCount ?? 0}</p>
            {activeTask.localVideoUrl ? <a className="text-emerald-400 underline" href={activeTask.localVideoUrl}>Open locally saved video</a> : null}
            <Button size="sm" variant="outline" onClick={checkStatus} disabled={busy}>Check status once</Button>
          </div>
        ) : null}
        {message ? <p className="text-xs text-amber-300">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
