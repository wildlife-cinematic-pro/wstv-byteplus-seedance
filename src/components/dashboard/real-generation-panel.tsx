'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CostDisplay, StepNumber } from './shared';

const REAL_CONFIRMATION = 'CONFIRM_REAL_PAID_BYTEPLUS_GENERATION';
const STORAGE_KEY = 'wstv_seedance_active_task_v1';
const FINAL_STATUSES = ['succeeded', 'failed', 'cancelled', 'expired'];
const MISSING_API_KEY_MONITOR_MESSAGE = 'Auto monitor cannot start because ARK_API_KEY is missing. Add ARK_API_KEY to .env to enable BytePlus status checking.';

interface RealApiStatus {
  dryRun: boolean;
  enableRealApi: boolean;
  allowPaidCalls: boolean;
  keyConfigured: boolean;
  realApiAllowed: boolean;
  message: string;
}

interface ActiveSeedanceTask {
  localTaskId: string | null;
  providerTaskId: string;
  createdAt: string;
  model: string | null;
  ratio: string | null;
  duration: number | null;
  resolution: string | null;
  maxCostUsd: number | null;
  status: string;
  lastCheckedAt: string | null;
  pollCount: number;
  resultVideoUrl: string | null;
  localVideoUrl: string | null;
  lastFrameUrl: string | null;
  errorMessage: string | null;
}

interface RealGenerationPanelProps {
  currentTaskId: string | null;
  dryRunPassed: boolean;
  estimatedCost: number;
  estimatedTokens: number;
  maxCostUsd: string;
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

function isFinalStatus(status: string) {
  return FINAL_STATUSES.includes(status.toLowerCase());
}

function isMonitorableStatus(status: string) {
  return !isFinalStatus(status);
}

function isMissingApiKeyError(message: string | null | undefined) {
  if (!message) return false;
  const value = message.toLowerCase();
  return value.includes('missing_api_key') ||
    value.includes('server-side api key is missing') ||
    value.includes('ark_api_key') ||
    value.includes('api key is missing');
}

function elapsedText(createdAt: string) {
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor(elapsedMs / 60000));
  const seconds = Math.max(0, Math.floor((elapsedMs % 60000) / 1000));
  return `${minutes}m ${seconds}s`;
}

function etaText(createdAt: string) {
  const minutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (minutes >= 15) return 'Long-running task — check BytePlus console';
  if (minutes >= 8) return 'Taking longer than usual — keep polling';
  if (minutes >= 4) return 'May finish soon';
  if (minutes >= 1) return 'Likely generating';
  return 'Starting / queued';
}

function statusEstimateText(task: ActiveSeedanceTask | null) {
  if (!task) return 'No active task';
  if (task.errorMessage) return 'Status unknown — check failed';
  if (task.status === 'loaded') return 'Waiting for status check';
  return etaText(task.createdAt);
}

function costCapText(task: ActiveSeedanceTask) {
  if (task.maxCostUsd != null) return `$${task.maxCostUsd.toFixed(2)}`;
  if (!task.localTaskId && task.status === 'loaded') return 'not applicable for loaded task';
  return 'not set';
}

function suggestedSafeCap(estimatedCost: number) {
  if (!Number.isFinite(estimatedCost) || estimatedCost <= 1.5) return 1.5;
  return Math.ceil(estimatedCost * 1.2);
}

function timelineStep(status: string) {
  const value = status.toLowerCase();
  if (value === 'succeeded') return 4;
  if (['failed', 'cancelled', 'expired'].includes(value)) return 4;
  if (['running', 'processing', 'in_progress'].includes(value)) return 2;
  if (value === 'queued' || value === 'pending') return 1;
  return 0;
}

function normalizeTaskFromSubmit(data: {
  task?: {
    id?: string;
    providerTaskId?: string;
    createdAt?: string;
    model?: string;
    ratio?: string;
    duration?: number;
    resolution?: string;
    maxCostUsd?: number | null;
  };
}): ActiveSeedanceTask | null {
  const providerTaskId = data.task?.providerTaskId;
  if (!providerTaskId) return null;
  return {
    localTaskId: data.task?.id ?? null,
    providerTaskId,
    createdAt: data.task?.createdAt ?? new Date().toISOString(),
    model: data.task?.model ?? null,
    ratio: data.task?.ratio ?? null,
    duration: data.task?.duration ?? null,
    resolution: data.task?.resolution ?? null,
    maxCostUsd: data.task?.maxCostUsd ?? null,
    status: 'submitted',
    lastCheckedAt: null,
    pollCount: 0,
    resultVideoUrl: null,
    localVideoUrl: null,
    lastFrameUrl: null,
    errorMessage: null,
  };
}

function normalizeTaskFromStatus(current: ActiveSeedanceTask, data: {
  task?: {
    localTaskId?: string | null;
    providerTaskId?: string;
    status?: string;
    createdAt?: string | null;
    model?: string | null;
    ratio?: string | null;
    duration?: number | null;
    resolution?: string | null;
    maxCostUsd?: number | null;
    lastCheckedAt?: string;
    pollCount?: number | null;
    resultVideoUrl?: string | null;
    localVideoUrl?: string | null;
    lastFrameUrl?: string | null;
    errorMessage?: string | null;
  };
}): ActiveSeedanceTask {
  return {
    ...current,
    localTaskId: data.task?.localTaskId ?? current.localTaskId,
    providerTaskId: data.task?.providerTaskId ?? current.providerTaskId,
    status: data.task?.status ?? current.status,
    createdAt: data.task?.createdAt ?? current.createdAt,
    model: data.task?.model ?? current.model,
    ratio: data.task?.ratio ?? current.ratio,
    duration: data.task?.duration ?? current.duration,
    resolution: data.task?.resolution ?? current.resolution,
    maxCostUsd: data.task?.maxCostUsd ?? current.maxCostUsd,
    lastCheckedAt: data.task?.lastCheckedAt ?? new Date().toISOString(),
    pollCount: data.task?.pollCount ?? current.pollCount + 1,
    resultVideoUrl: data.task?.resultVideoUrl ?? current.resultVideoUrl,
    localVideoUrl: data.task?.localVideoUrl ?? current.localVideoUrl,
    lastFrameUrl: data.task?.lastFrameUrl ?? current.lastFrameUrl,
    errorMessage: data.task?.errorMessage ?? null,
  };
}

export function RealGenerationPanel({
  currentTaskId,
  dryRunPassed,
  estimatedCost,
  estimatedTokens,
  maxCostUsd,
}: RealGenerationPanelProps) {
  const [status, setStatus] = useState<RealApiStatus | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [monitorNotice, setMonitorNotice] = useState<string | null>(null);
  const [autoMonitor, setAutoMonitor] = useState(false);
  const [activeTask, setActiveTask] = useState<ActiveSeedanceTask | null>(null);
  const [pastedTaskId, setPastedTaskId] = useState('');
  const autoStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTask(JSON.parse(stored) as ActiveSeedanceTask);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTask) localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTask));
    else localStorage.removeItem(STORAGE_KEY);
  }, [activeTask]);

  const refreshStatus = useCallback(async () => {
    const response = await fetch('/api/real-generate');
    if (response.ok) setStatus(await response.json());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStatus().catch(() => setStatus(null));
  }, [refreshStatus]);

  const maxCostCap = Number(maxCostUsd);
  const maxCostValid = Number.isFinite(maxCostCap) && maxCostCap > 0 && maxCostCap >= estimatedCost;
  const suggestedMaxCostUsd = suggestedSafeCap(estimatedCost);
  const activePaidTaskExists = Boolean(activeTask && !isFinalStatus(activeTask.status));
  const submitEnabled = Boolean(
    status?.realApiAllowed &&
    dryRunPassed &&
    currentTaskId &&
    confirmation === REAL_CONFIRMATION &&
    !loading &&
    !activePaidTaskExists &&
    maxCostValid
  );

  const checkStatusNow = useCallback(async (reason = 'manual') => {
    if (!activeTask?.providerTaskId) {
      const notice = 'Load or submit a task before enabling Auto Monitor.';
      setMonitorNotice(notice);
      setMessage(notice);
      return;
    }
    setChecking(true);
    setMessage(null);
    try {
      const localParam = activeTask.localTaskId ? `?localTaskId=${encodeURIComponent(activeTask.localTaskId)}` : '';
      const response = await fetch(`/api/seedance/tasks/${encodeURIComponent(activeTask.providerTaskId)}${localParam}`);
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string; task?: unknown } | null;
      if (!response.ok || !data?.success) {
        const errorMessage = data?.error ?? 'Status check failed';
        const missingApiKey = isMissingApiKeyError(errorMessage);
        setActiveTask(current => current ? {
          ...current,
          lastCheckedAt: new Date().toISOString(),
          pollCount: current.pollCount + 1,
          errorMessage,
        } : current);
        if (reason === 'auto' && missingApiKey) {
          setAutoMonitor(false);
          autoStartedAtRef.current = null;
          setMonitorNotice(MISSING_API_KEY_MONITOR_MESSAGE);
          setMessage(MISSING_API_KEY_MONITOR_MESSAGE);
        } else {
          setMonitorNotice(errorMessage);
          setMessage(errorMessage);
        }
        return;
      }
      setActiveTask(current => current ? normalizeTaskFromStatus(current, data as Parameters<typeof normalizeTaskFromStatus>[1]) : current);
      setMonitorNotice(null);
      setMessage(reason === 'auto' ? 'Auto status monitor checked once.' : 'Status checked. No paid task was created.');
    } catch {
      const errorMessage = 'Network timeout or malformed status response.';
      setActiveTask(current => current ? {
        ...current,
        lastCheckedAt: new Date().toISOString(),
        pollCount: current.pollCount + 1,
        errorMessage,
      } : current);
      setMonitorNotice(errorMessage);
      setMessage(errorMessage);
    } finally {
      setChecking(false);
    }
  }, [activeTask]);

  useEffect(() => {
    if (!autoMonitor || !activeTask || !isMonitorableStatus(activeTask.status)) return;
    if (autoStartedAtRef.current == null) autoStartedAtRef.current = Date.now();
    const id = setInterval(() => {
      if (autoStartedAtRef.current && Date.now() - autoStartedAtRef.current > 15 * 60 * 1000) {
        setAutoMonitor(false);
        setMessage('Auto monitor stopped after 15 minutes. Click Check Status Now to continue.');
        return;
      }
      checkStatusNow('auto');
    }, 10_000);
    return () => clearInterval(id);
  }, [activeTask, autoMonitor, checkStatusNow]);

  useEffect(() => {
    if (activeTask && isFinalStatus(activeTask.status) && autoMonitor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoMonitor(false);
      setMessage('Auto monitor stopped because the task reached a final status.');
    }
  }, [activeTask, autoMonitor]);

  const submitRealGeneration = useCallback(async () => {
    if (!currentTaskId || confirmation !== REAL_CONFIRMATION || activePaidTaskExists) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/real-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: currentTaskId, confirmation }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string; task?: unknown } | null;
      if (data?.success) {
        const nextTask = normalizeTaskFromSubmit(data as Parameters<typeof normalizeTaskFromSubmit>[0]);
        setActiveTask(nextTask);
        setConfirmation('');
        setMessage(nextTask ? `Submitted real BytePlus task ${nextTask.providerTaskId}` : 'Real task submitted.');
      } else {
        setMessage(data?.error ?? 'Real BytePlus submission was blocked');
      }
      await refreshStatus();
    } catch {
      setMessage('Real BytePlus submission failed before completion');
    } finally {
      setLoading(false);
    }
  }, [activePaidTaskExists, confirmation, currentTaskId, refreshStatus]);

  const loadExistingTaskId = useCallback(() => {
    const providerTaskId = pastedTaskId.trim();
    if (!providerTaskId) {
      setMessage('Paste an existing BytePlus task id before loading.');
      return;
    }

    setActiveTask({
      localTaskId: null,
      providerTaskId,
      createdAt: new Date().toISOString(),
      model: null,
      ratio: null,
      duration: null,
      resolution: null,
      maxCostUsd: null,
      status: 'loaded',
      lastCheckedAt: null,
      pollCount: 0,
      resultVideoUrl: null,
      localVideoUrl: null,
      lastFrameUrl: null,
      errorMessage: null,
    });
    setAutoMonitor(false);
    autoStartedAtRef.current = null;
    setPastedTaskId('');
    setMonitorNotice(null);
    setMessage('Loaded existing task id for status checking only. No paid task was created.');
  }, [pastedTaskId]);

  const currentTimelineStep = timelineStep(activeTask?.status ?? 'submitted');
  const timeline = ['Submitted', 'Queued', 'Generating', 'Finalizing', activeTask?.status === 'failed' ? 'Failed' : 'Completed'];
  const statusText = useMemo(() => statusEstimateText(activeTask), [activeTask]);
  const autoMonitorDisabled = !activeTask || isFinalStatus(activeTask.status);
  const handleAutoMonitorChange = useCallback((checked: boolean) => {
    if (!checked) {
      autoStartedAtRef.current = null;
      setAutoMonitor(false);
      setMonitorNotice(null);
      return;
    }

    if (!activeTask) {
      setAutoMonitor(false);
      const notice = 'Load or submit a task before enabling Auto Monitor.';
      setMonitorNotice(notice);
      setMessage(notice);
      return;
    }

    if (isFinalStatus(activeTask.status)) {
      setAutoMonitor(false);
      const notice = 'Auto monitor is not needed because this task is already final.';
      setMonitorNotice(notice);
      setMessage(notice);
      return;
    }

    if (status?.keyConfigured === false || (status?.keyConfigured !== true && isMissingApiKeyError(activeTask.errorMessage))) {
      autoStartedAtRef.current = null;
      setAutoMonitor(false);
      setMonitorNotice(MISSING_API_KEY_MONITOR_MESSAGE);
      setMessage(MISSING_API_KEY_MONITOR_MESSAGE);
      return;
    }

    autoStartedAtRef.current = Date.now();
    setMonitorNotice(null);
    setMessage('Auto monitor started. Status checks retrieve an existing task only.');
    setAutoMonitor(true);
  }, [activeTask, status?.keyConfigured]);

  return (
    <div className="space-y-3">
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
            <strong className="text-red-200">Danger:</strong> Real Paid Submit creates one paid Seedance task. Status checking does not submit a new generation task. Cost is created only when you press Real Paid Submit.
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
              <div className="text-muted-foreground mt-1">maxCostUsd is a maximum cost cap for this one paid generation, not a setup fee.</div>
            </div>
            <div className="rounded bg-muted/30 border border-red-500/20 p-3">
              <div className="text-muted-foreground">Estimated tokens</div>
              <div className="text-gray-200 font-mono">{estimatedTokens.toLocaleString()}</div>
              <div className="text-muted-foreground mt-1">Final billing requires provider usage.completion_tokens.</div>
            </div>
          </div>

          {activePaidTaskExists && (
            <p className="text-xs text-amber-300">A paid Seedance task is already active. Clear task state after it reaches a final status if you need to submit a new one.</p>
          )}
          {!maxCostValid && (
            <p className="text-xs text-amber-300">Set maxCostUsd to at least ${estimatedCost.toFixed(2)} before Real Paid Submit. Suggested safe cap: ${suggestedMaxCostUsd.toFixed(2)}.</p>
          )}

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
            disabled={!submitEnabled}
            className="w-full bg-red-700 hover:bg-red-800 text-white disabled:bg-gray-700 disabled:text-muted-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
            Submit One REAL Paid BytePlus Task
          </Button>

          <p className="text-xs text-muted-foreground">{status?.message ?? 'Checking server-side real API safety status...'}</p>
          {message && <p className="text-xs text-amber-300">{message}</p>}
        </CardContent>
      </Card>

      <Card className="bg-card border-emerald-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-emerald-400">Seedance Generation Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Status checking does not submit a new generation task. Cost is created only when you press Real Paid Submit.</p>

          <div className="flex items-center justify-between rounded-md bg-muted/30 border border-border px-3 py-2">
            <span className="text-xs text-gray-300">Auto Status Monitor: {autoMonitor ? 'ON' : 'OFF'}</span>
            <Switch checked={autoMonitor} onCheckedChange={handleAutoMonitorChange} disabled={autoMonitorDisabled} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Auto Monitor only retrieves status for an existing task. It does not create a new paid generation. It requires ARK_API_KEY to check BytePlus.</p>
            {!activeTask && <p className="text-xs text-amber-300">Load or submit a task before enabling Auto Monitor.</p>}
            {monitorNotice && <p className="text-xs text-amber-300">{monitorNotice}</p>}
          </div>

          {activeTask ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-muted/30 p-2"><span className="text-muted-foreground">Task ID:</span> <span className="font-mono text-gray-200 break-all">{activeTask.providerTaskId}</span></div>
                <div className="rounded bg-muted/30 p-2"><span className="text-muted-foreground">Status:</span> <span className="text-emerald-300">{activeTask.status}</span></div>
                <div className="rounded bg-muted/30 p-2"><span className="text-muted-foreground">Elapsed:</span> {elapsedText(activeTask.createdAt)}</div>
                <div className="rounded bg-muted/30 p-2"><span className="text-muted-foreground">Last checked:</span> {activeTask.lastCheckedAt ? new Date(activeTask.lastCheckedAt).toLocaleString() : 'Never'}</div>
                <div className="rounded bg-muted/30 p-2"><span className="text-muted-foreground">Poll count:</span> {activeTask.pollCount}</div>
                <div className="rounded bg-muted/30 p-2"><span className="text-muted-foreground">Cost cap:</span> {costCapText(activeTask)}</div>
              </div>

              <div className="text-xs text-amber-300">{statusText}</div>

              <div className="grid grid-cols-5 gap-1 text-xs">
                {timeline.map((label, index) => (
                  <div key={label} className={`rounded border px-2 py-1 text-center ${index <= currentTimelineStep ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-border bg-muted/20 text-muted-foreground'}`}>
                    {label}
                  </div>
                ))}
              </div>

              {activeTask.resultVideoUrl && (
                <div className="rounded bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
                  <p className="text-amber-300 font-medium">Provider result URL may expire. Save the video immediately.</p>
                  <a href={activeTask.resultVideoUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline break-all inline-flex items-center gap-1 mt-1">
                    Result video <ExternalLink className="w-3 h-3" />
                  </a>
                  {activeTask.localVideoUrl && <p className="text-muted-foreground mt-1">Local preview URL: {activeTask.localVideoUrl}</p>}
                </div>
              )}

              {activeTask.lastFrameUrl && (
                <a href={activeTask.lastFrameUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-300 hover:underline inline-flex items-center gap-1">
                  Last frame URL <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {activeTask.errorMessage && <p className="text-xs text-red-300">{activeTask.errorMessage}</p>}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => checkStatusNow()} disabled={checking}>
                  {checking ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                  Check Status Now
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setActiveTask(null); setAutoMonitor(false); setMonitorNotice(null); autoStartedAtRef.current = null; }} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear task state
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">No active Seedance task saved in this browser. Real Paid Submit will save task state here for manual status checks.</p>
              <div className="space-y-2">
                <Label htmlFor="existing-byteplus-task-id" className="text-xs text-gray-300">
                  Paste existing BytePlus Task ID
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="existing-byteplus-task-id"
                    value={pastedTaskId}
                    onChange={event => setPastedTaskId(event.target.value)}
                    placeholder="task id from BytePlus console or logs"
                    className="bg-background font-mono text-gray-100"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadExistingTaskId}
                    disabled={!pastedTaskId.trim()}
                    className="sm:w-36"
                  >
                    Load Task ID
                  </Button>
                </div>
              </div>
              <p className="text-xs text-amber-300">Loading an existing task ID only enables status checking. It does not create a new paid generation.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
