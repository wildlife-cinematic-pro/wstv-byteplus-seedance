'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Braces,
  CheckCircle2,
  CircleDollarSign,
  FlaskConical,
  Leaf,
  Loader2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { StepPrompt } from '@/components/dashboard/step-prompt';
import { StepReferences } from '@/components/dashboard/step-references';
import {
  groupReferencesByType,
  remapReferenceRolesForMode,
  type DryRunResult,
  type GenerationMode,
  type ModelType,
  type ReferenceEntry,
} from '@/components/dashboard/types';

interface Phase2InitialData {
  safeMode: boolean;
  budget: {
    monthlyLimit: number;
    spentThisMonth: number;
    currency: string;
  };
}

const STANDARD_MODEL_ID = 'dreamina-seedance-2-0-260128';
const MINI_MODEL_ID = 'dreamina-seedance-2-0-mini-260615';

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function Phase2GenerateDashboard({ initialData }: { initialData: Phase2InitialData }) {
  const [prompt, setPrompt] = useState('');
  const [modelType, setModelType] = useState<ModelType>('full');
  const [generationMode, setGenerationModeState] = useState<GenerationMode>('reference_mode');
  const [references, setReferences] = useState<ReferenceEntry[]>([]);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [resolution, setResolution] = useState('720p');
  const [duration, setDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [maxCostUsd, setMaxCostUsd] = useState(5);
  const [activeInspector, setActiveInspector] = useState<'request' | 'validation'>('request');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const seedanceModelId = modelType === 'mini' ? MINI_MODEL_ID : STANDARD_MODEL_ID;
  const groupedReferences = useMemo(() => groupReferencesByType(references), [references]);
  const remainingBudget = Math.max(0, initialData.budget.monthlyLimit - initialData.budget.spentThisMonth);

  const requestPayload = useMemo(() => ({
    prompt,
    modelType,
    modelId: seedanceModelId,
    seedanceModelId,
    generationMode,
    resolution,
    duration,
    aspectRatio,
    maxCostUsd,
    references: groupedReferences,
  }), [prompt, modelType, seedanceModelId, generationMode, resolution, duration, aspectRatio, maxCostUsd, groupedReferences]);

  const setGenerationMode = (next: GenerationMode) => {
    setGenerationModeState(next);
    setReferences(current => remapReferenceRolesForMode(current, next));
    setResult(null);
    setRequestError(null);
  };

  const runDryRun = async () => {
    setRunning(true);
    setRequestError(null);
    setResult(null);
    try {
      const response = await fetch('/api/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setRequestError(payload?.error || `Dry-run request failed (${response.status})`);
        return;
      }
      setResult(payload as DryRunResult);
      setActiveInspector('validation');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to run dry-run validation');
    } finally {
      setRunning(false);
    }
  };

  const referenceCount = groupedReferences.images.length + groupedReferences.videos.length + groupedReferences.audios.length;

  return (
    <div className="min-h-screen bg-[#090d0c] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-[#090d0c]/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1580px] flex-wrap items-center gap-3">
          <Link
            href="/phase1"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-800 px-3 text-sm text-slate-300 transition hover:border-emerald-500/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Overview
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">ASTV / Generate</p>
              <h1 className="truncate font-semibold text-slate-100">Generation Playground</h1>
            </div>
          </div>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 text-sm text-emerald-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Safe Mode {initialData.safeMode ? 'ON' : 'server state'} · DRY RUN · paid calls blocked
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1580px] px-4 py-6 md:px-6">
        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Phase 2 status">
          <div className="rounded-xl border border-slate-900 bg-[#0d1210] p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-600">Mode</p>
            <p className="mt-2 text-lg font-semibold">{generationMode === 'frame_mode' ? 'Frame Mode' : 'Reference Mode'}</p>
            <p className="mt-1 text-xs text-slate-500">Existing typed ASTV generation mode</p>
          </div>
          <div className="rounded-xl border border-slate-900 bg-[#0d1210] p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-600">References</p>
            <p className="mt-2 text-lg font-semibold">{referenceCount}</p>
            <p className="mt-1 text-xs text-slate-500">{groupedReferences.images.length}/9 image · {groupedReferences.videos.length}/3 video · {groupedReferences.audios.length}/3 audio</p>
          </div>
          <div className="rounded-xl border border-slate-900 bg-[#0d1210] p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-600">Budget remaining</p>
            <p className="mt-2 text-lg font-semibold">{money(remainingBudget, initialData.budget.currency)}</p>
            <p className="mt-1 text-xs text-slate-500">Recorded budget snapshot</p>
          </div>
          <div className="rounded-xl border border-slate-900 bg-[#0d1210] p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-600">Execution</p>
            <p className="mt-2 text-lg font-semibold text-emerald-200">Validation only</p>
            <p className="mt-1 text-xs text-slate-500">No provider action is exposed here</p>
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="min-w-0 space-y-4" aria-label="Generation inputs">
            <div className="rounded-2xl border border-slate-900 bg-[#0d1210] p-1 shadow-sm">
              <StepPrompt
                prompt={prompt}
                setPrompt={setPrompt}
                modelType={modelType}
                setModelType={(next) => {
                  setModelType(next);
                  setResult(null);
                }}
              />
            </div>

            <div className="rounded-2xl border border-slate-900 bg-[#0d1210] p-1 shadow-sm">
              <StepReferences
                references={references}
                setReferences={(updater) => {
                  setReferences(updater);
                  setResult(null);
                }}
                riskAcknowledged={riskAcknowledged}
                setRiskAcknowledged={setRiskAcknowledged}
                generationMode={generationMode}
                setGenerationMode={setGenerationMode}
              />
            </div>

            <section className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5" aria-labelledby="settings-heading">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">Step 3</p>
                  <h2 id="settings-heading" className="mt-1 text-xl font-semibold">Planning settings</h2>
                </div>
                <span className="rounded-full border border-slate-800 px-2.5 py-1 text-xs text-slate-500">Estimate inputs</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-2 text-sm text-slate-400">
                  <span>Resolution</span>
                  <select value={resolution} onChange={e => { setResolution(e.target.value); setResult(null); }} className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100">
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    {modelType === 'full' && <option value="1080p">1080p</option>}
                    {modelType === 'full' && <option value="4k">4k</option>}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-400">
                  <span>Duration</span>
                  <select value={duration} onChange={e => { setDuration(Number(e.target.value)); setResult(null); }} className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100">
                    <option value={10}>10 seconds</option>
                    <option value={12}>12 seconds</option>
                    <option value={15}>15 seconds</option>
                    <option value={-1}>Auto duration</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-400">
                  <span>Aspect ratio</span>
                  <select value={aspectRatio} onChange={e => { setAspectRatio(e.target.value); setResult(null); }} className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100">
                    <option value="9:16">9:16 vertical</option>
                    <option value="16:9">16:9 landscape</option>
                    <option value="1:1">1:1 square</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-400">
                  <span>Max planned cost (USD)</span>
                  <input type="number" min="0" step="0.01" value={maxCostUsd} onChange={e => { setMaxCostUsd(Number(e.target.value)); setResult(null); }} className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-100" />
                </label>
              </div>
            </section>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24" aria-label="Generation inspector">
            <section className="rounded-2xl border border-emerald-500/20 bg-[#0d1210] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">Phase 2</p>
                  <h2 className="mt-1 text-xl font-semibold">Dry-run gate</h2>
                </div>
                <FlaskConical className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Runs the existing authenticated ASTV dry-run endpoint. It validates payload, references, budget and estimates without exposing a provider execution control.
              </p>
              <button
                type="button"
                onClick={runDryRun}
                disabled={running}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                {running ? 'Validating…' : 'Run safe dry run'}
              </button>
              {requestError && (
                <div role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
                  {requestError}
                </div>
              )}
              {result && (
                <div role="status" className={`mt-3 rounded-lg border p-3 text-sm ${result.passed ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' : 'border-amber-500/30 bg-amber-500/5 text-amber-200'}`}>
                  <div className="flex items-center gap-2 font-semibold">
                    {result.passed ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
                    {result.passed ? 'Dry run passed' : 'Revision required'}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <span>Tokens</span><span className="text-right">{result.estimatedTokens?.toLocaleString() ?? '—'}</span>
                    <span>Estimated cost</span><span className="text-right">{result.pricingEstimateOnly === false ? '—' : money(result.estimatedCost)}</span>
                    <span>Images</span><span className="text-right">{result.referenceImageCount}</span>
                    <span>Video</span><span className="text-right">{result.referenceVideoCount}</span>
                    <span>Audio</span><span className="text-right">{result.referenceAudioCount}</span>
                  </div>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-900 bg-[#0d1210]">
              <div className="flex border-b border-slate-900" role="tablist" aria-label="Inspector">
                <button
                  role="tab"
                  aria-selected={activeInspector === 'request'}
                  onClick={() => setActiveInspector('request')}
                  className={`min-h-11 flex-1 px-3 text-sm ${activeInspector === 'request' ? 'bg-emerald-500/10 text-emerald-200' : 'text-slate-500'}`}
                >
                  <Braces className="mr-1.5 inline h-4 w-4" aria-hidden="true" />Request
                </button>
                <button
                  role="tab"
                  aria-selected={activeInspector === 'validation'}
                  onClick={() => setActiveInspector('validation')}
                  className={`min-h-11 flex-1 px-3 text-sm ${activeInspector === 'validation' ? 'bg-emerald-500/10 text-emerald-200' : 'text-slate-500'}`}
                >
                  <CheckCircle2 className="mr-1.5 inline h-4 w-4" aria-hidden="true" />Validation
                </button>
              </div>
              {activeInspector === 'request' ? (
                <div role="tabpanel" className="max-h-[460px] overflow-auto p-4" tabIndex={0} aria-label="Dry-run request preview">
                  <p className="mb-3 text-xs leading-5 text-slate-500">Internal ASTV request preview. No credential or provider key is included.</p>
                  <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{JSON.stringify({ ...requestPayload, prompt: prompt || '[prompt not entered]' }, null, 2)}</pre>
                </div>
              ) : (
                <div role="tabpanel" className="max-h-[460px] overflow-auto p-4" tabIndex={0} aria-label="Dry-run validation log">
                  {!result ? (
                    <p className="text-sm leading-6 text-slate-500">Run the safe dry run to populate server validation evidence.</p>
                  ) : (
                    <div className="space-y-2">
                      {result.validationLog.map((line, index) => (
                        <p key={`${line}-${index}`} className="text-xs leading-5 text-slate-300">{line}</p>
                      ))}
                      {result.errors.length > 0 && (
                        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Blocking issues</p>
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-red-200">
                            {result.errors.map(error => <li key={error}>{error}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <h2 className="font-semibold">Execution boundary</h2>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Safe Mode</dt><dd>{initialData.safeMode ? 'ON · server-owned' : 'server state'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Provider button</dt><dd>Not rendered</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Cost provenance</dt><dd>Estimate only</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Existing Generate</dt><dd><Link href="/" className="text-emerald-300 underline underline-offset-4">Still available</Link></dd></div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
