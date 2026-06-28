'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw, ChevronDown, ChevronRight, Type, Cpu, ImageIcon, DollarSign, Film, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GateProgress, CostDisplay, StepShell, StepChip } from './shared';
import type { DryRunResult, ModelType, Gates, ReferenceEntry } from './types';
import { groupReferencesByType } from './types';

interface StepDryRunProps {
  dryRunResult: DryRunResult | null;
  dryRunInvalidated: boolean;
  prompt: string;
  modelType: ModelType;
  resolution: string;
  duration: number;
  aspectRatio: string;
  references: ReferenceEntry[];
  maxCostUsd: string;
  outputFilename: string;
  currentTaskId: string | null;
  safeMode: boolean;
  onResult: (result: DryRunResult) => void;
  onTaskId: (id: string) => void;
  onInvalidatedClear: () => void;
  // ─── PHASE4: Official Seedance model ID + generation mode ───
  seedanceModelId?: string;
  generationMode?: 'reference_mode' | 'frame_mode';
}

const PROGRESS_STEPS = ['Validating prompt...', 'Checking model...', 'Validating references...', 'Calculating cost...', 'Running budget check...', 'Complete!'];

const SUMMARY_ICONS: Record<string, React.ReactNode> = {
  Characters: <Type className="w-3 h-3" />,
  Model: <Cpu className="w-3 h-3" />,
  Duration: <Film className="w-3 h-3" />,
  Resolution: <Film className="w-3 h-3" />,
  'Aspect Ratio': <Film className="w-3 h-3" />,
  'Ref. Images': <ImageIcon className="w-3 h-3" />,
  'Ref. Audio': <Music className="w-3 h-3" />,
  'Ref. Video': <Video className="w-3 h-3" />,
};

const LOG_CATEGORIES = [
  { header: 'Prompt Validation', icon: '📝', color: 'border-l-blue-400', match: (l: string) => /[Pp]rompt|[Cc]haracter|[Ll]ength|[Ss]tructure/.test(l) },
  { header: 'Model & Settings', icon: '🔧', color: 'border-l-purple-400', match: (l: string) => /[Mm]odel|[Rr]esolution|[Aa]spect|[Dd]uration|[Ff]ps/.test(l) },
  { header: 'Reference Validation', icon: '🖼️', color: 'border-l-amber-400', match: (l: string) => /[Rr]ef(erence)?|[Ii]mage|[Aa]udio|[Vv]ideo|[Uu][Rr][Ll]/.test(l) },
  { header: 'Cost & Budget', icon: '💰', color: 'border-l-emerald-400', match: (l: string) => /[Cc]ost|[Bb]udget|[Pp]rice|[Uu][Ss][Dd]|[Cc][Nn][Yy]/.test(l) },
];

/* ── Sub-components ── */

function DryRunProgressBar({ step }: { step: number }) {
  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-emerald-500/20">
      {PROGRESS_STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          {i < step ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            : i === step ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            : <div className="w-4 h-4 rounded-full border border-border shrink-0" />}
          <span className={`text-xs ${i <= step ? 'text-gray-200' : 'text-muted-foreground'}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function EnhancedSummaryGrid({ result, modelType }: { result: DryRunResult; modelType: ModelType }) {
  // PHASE5.1: charLimit is a RECOMMENDED range, not a hard limit.
  const recommendedCharLimit = result.characterLimit || (modelType === 'mini' ? 1500 : 2000);
  const charPct = Math.min(100, (result.characterCount / recommendedCharLimit) * 100);
  const items = [
    { l: 'Characters', v: `${result.characterCount}/${recommendedCharLimit}`, icon: SUMMARY_ICONS['Characters'], bar: charPct, warn: charPct > 80 },
    { l: 'Model', v: result.model, icon: SUMMARY_ICONS['Model'] },
    { l: 'Duration', v: `${result.duration}s (${result.frameCount || result.duration * 24}f @${result.frameCount ? Math.round(result.frameCount / result.duration) : 24}fps)`, icon: SUMMARY_ICONS['Duration'] },
    { l: 'Resolution', v: result.resolution, icon: SUMMARY_ICONS['Resolution'] },
    { l: 'Aspect Ratio', v: result.aspectRatio, icon: SUMMARY_ICONS['Aspect Ratio'] },
    { l: 'Ref. Images', v: `${result.referenceImageCount}/9`, icon: SUMMARY_ICONS['Ref. Images'], warn: result.referenceImageCount > 7 },
    { l: 'Ref. Audio', v: `${result.referenceAudioCount}/3`, icon: SUMMARY_ICONS['Ref. Audio'], warn: result.referenceAudioCount > 2 },
    { l: 'Ref. Video', v: `${result.referenceVideoCount}/3`, icon: SUMMARY_ICONS['Ref. Video'], warn: result.referenceVideoCount > 2 },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map(item => (
        <div key={item.l} className="p-2 rounded bg-muted/40">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {item.icon} {item.l}
          </div>
          <div className={`text-sm font-medium mt-0.5 ${item.warn ? 'text-amber-400' : 'text-gray-200'}`}>{item.v}</div>
          {item.bar !== undefined && (
            <Progress value={item.bar} className={`h-1 mt-1 ${item.warn ? '[&>div]:bg-amber-400' : '[&>div]:bg-emerald-500'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function CostBreakdownSection({ result }: { result: DryRunResult }) {
  const durationSec = Math.max(result.duration, 1);

  return (
    <div className="p-3 rounded-lg bg-muted/40 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Official Token Estimate</span>
        <span className="text-xs text-muted-foreground italic">Dry-run estimate only. No real charge.</span>
      </div>

      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex items-center justify-between py-1 border-b border-gray-800/50">
          <span className="text-gray-400">Estimated tokens</span>
          <span className="text-emerald-400">{(result.estimatedTokens ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-gray-800/50">
          <span className="text-gray-400">Rate</span>
          <span className="text-gray-300">${(result.modelRateUsdPerMillionTokens ?? 0).toFixed(1)}/M tokens</span>
        </div>
        <div className="flex items-center justify-between py-1.5 border-t border-border">
          <span className="text-gray-300 font-semibold">Estimated cost</span>
          <span className="text-emerald-400 font-bold text-sm">${result.estimatedCost.toFixed(4)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-800">
        <CostDisplay usd={result.estimatedCost} cny={result.estimatedCostCny} size="sm" showLabel />
        <span className="text-xs text-muted-foreground">
          {result.pricingMode ?? 'official_token_estimate_only'} · actual billing requires usage.completion_tokens
        </span>
      </div>
    </div>
  );
}

function ReferenceSummary({ result }: { result: DryRunResult }) {
  const totalRefs = result.referenceImageCount + result.referenceAudioCount + result.referenceVideoCount;
  const overLimit = totalRefs > 5;
  return (
    <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg bg-muted/40 text-xs">
      <span className="text-gray-400">References:</span>
      <span className="text-gray-200">📸 {result.referenceImageCount}/9 images</span>
      <span className="text-gray-200">🎵 {result.referenceAudioCount}/3 audio</span>
      <span className="text-gray-200">🎬 {result.referenceVideoCount}/3 video</span>
      {result.totalReferenceDuration > 0 && <span className="text-gray-400">Duration: {result.totalReferenceDuration}s</span>}
      {overLimit && (
        <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" /> Over recommended limit
        </Badge>
      )}
    </div>
  );
}

function CategorizedLog({ log }: { log: string[] }) {
  const uncategorized = log.filter(entry => !LOG_CATEGORIES.some(cat => cat.match(entry.replace(/^[✅❌⚠️ℹ️]\s*/, ''))));
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {LOG_CATEGORIES.map(cat => {
        const items = log.filter(entry => cat.match(entry.replace(/^[✅❌⚠️ℹ️]\s*/, '')));
        if (items.length === 0) return null;
        return (
          <div key={cat.header} className={`border-l-2 ${cat.color} pl-3`}>
            <div className="text-xs font-medium text-gray-400 mb-1">{cat.icon} {cat.header}</div>
            {items.map((entry, i) => {
              const icon = entry.startsWith('✅') ? '✅' : entry.startsWith('❌') ? '❌' : entry.startsWith('⚠️') ? '⚠️' : 'ℹ️';
              return <div key={i} className="text-xs text-gray-300 font-mono">{icon} {entry.replace(/^[✅❌⚠️ℹ️]\s*/, '')}</div>;
            })}
          </div>
        );
      })}
      {uncategorized.length > 0 && (
        <div className="border-l-2 border-l-gray-500 pl-3">
          <div className="text-xs font-medium text-gray-400 mb-1">Other</div>
          {uncategorized.map((entry, i) => {
            const icon = entry.startsWith('✅') ? '✅' : entry.startsWith('❌') ? '❌' : entry.startsWith('⚠️') ? '⚠️' : 'ℹ️';
            return <div key={i} className="text-xs text-gray-300 font-mono">{icon} {entry.replace(/^[✅❌⚠️ℹ️]\s*/, '')}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function GatePreview({ result, safeMode }: { result: DryRunResult; safeMode: boolean }) {
  // PHASE5.1: "Prompt Length Warning" is always pass=true (warning only, not a hard gate).
  // A long prompt does NOT hard-block Dry Run.
  const promptOverRecommended = result.characterCount > (result.characterLimit || 2000);
  const gateItems = [
    { label: 'Safe Mode Off', pass: !safeMode },
    { label: 'Dry Run Passed', pass: result.passed },
    { label: 'Prompt Length Warning', pass: true, warning: promptOverRecommended },
    { label: 'Media URIs Valid', pass: result.errors.every(e => !e.toLowerCase().includes('uri') && !e.toLowerCase().includes('url')) },
    { label: 'Budget OK', pass: !result.errors.some(e => e.toLowerCase().includes('budget')) },
    { label: 'Cost Cap', pass: !result.errors.some(e => e.toLowerCase().includes('cost cap')) },
    { label: 'No Duplicate', pass: true },
    { label: 'Risk Acknowledged', pass: !result.errors.some(e => e.toLowerCase().includes('risk')) },
  ];
  const passed = gateItems.filter(g => g.pass).length;
  return (
    <div className="p-3 rounded-lg bg-muted/40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">Gate Preview</span>
        <GateProgress passed={passed} total={gateItems.length} className="w-32" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        {gateItems.map(g => (
          <div key={g.label} className="flex items-center gap-1.5 text-xs">
            {g.pass ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
            <span className={g.pass ? 'text-gray-400' : 'text-red-300'}>{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

export function StepDryRun({
  dryRunResult, dryRunInvalidated, prompt,
  modelType, resolution, duration, aspectRatio,
  references,
  maxCostUsd, outputFilename,
  currentTaskId, safeMode,
  onResult, onTaskId, onInvalidatedClear,
  seedanceModelId, generationMode,
}: StepDryRunProps) {
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(-1);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading) {
      setProgressStep(0);
      let step = 0;
      const advance = () => {
        step++;
        setProgressStep(step);
        if (step < PROGRESS_STEPS.length - 1) {
          timerRef.current = setTimeout(advance, 200);
        }
      };
      timerRef.current = setTimeout(advance, 200);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    } else {
      setProgressStep(-1);
    }
  }, [loading]);

  const runDryRun = useCallback(async () => {
    setLoading(true);
    try {
      // Group references for the new API format
      const refGroups = groupReferencesByType(references);

      // Map to legacy fields for task creation backward compatibility
      const masterImageUrl = refGroups.images.find(r => r.role === 'main_identity')?.url || '';
      const storyboardImageUrl = refGroups.images.find(r => r.role === 'first_frame')?.url || '';
      const audioUrls = refGroups.audios.map(r => r.url);
      const videoUrls = refGroups.videos.map(r => r.url);

      let taskId = currentTaskId;
      if (!taskId) {
        const createRes = await fetch('/api/tasks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt, modelType, modelId: modelType, resolution, duration, aspectRatio,
            masterImageUrl: masterImageUrl || undefined,
            storyboardImageUrl: storyboardImageUrl || undefined,
            audioUrl1: audioUrls[0] || undefined,
            audioUrl2: audioUrls[1] || undefined,
            audioUrl3: audioUrls[2] || undefined,
            videoUrl1: videoUrls[0] || undefined,
            videoUrl2: videoUrls[1] || undefined,
            videoUrl3: videoUrls[2] || undefined,
            maxCostUsd: maxCostUsd ? parseFloat(maxCostUsd) : undefined,
            outputFilename: outputFilename || undefined,
          }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          taskId = typeof data.task?.id === 'string' ? data.task.id : null;
          if (taskId) onTaskId(taskId);
        }
      } else {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt, modelType, modelId: modelType, resolution, duration, aspectRatio,
            masterImageUrl: masterImageUrl || null,
            storyboardImageUrl: storyboardImageUrl || null,
            audioUrl1: audioUrls[0] || null,
            audioUrl2: audioUrls[1] || null,
            audioUrl3: audioUrls[2] || null,
            videoUrl1: videoUrls[0] || null,
            videoUrl2: videoUrls[1] || null,
            videoUrl3: videoUrls[2] || null,
            maxCostUsd: maxCostUsd ? parseFloat(maxCostUsd) : null,
            outputFilename: outputFilename || null,
          }),
        });
      }

      // Send dry-run request with new references format
      const res = await fetch('/api/dry-run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, modelType, modelId: modelType, resolution, duration, aspectRatio,
          references: refGroups,
          maxCostUsd: maxCostUsd ? parseFloat(maxCostUsd) : undefined,
          taskId,
          // ─── PHASE4: Official Seedance validation fields ───
          seedanceModelId: seedanceModelId || 'dreamina-seedance-2-0-260128',
          generationMode: generationMode || 'reference_mode',
        }),
      });
      if (res.ok) { const data = await res.json(); onResult(data); onInvalidatedClear(); }
    } catch (err) {
      console.error('Dry run error:', err);
      onResult({
        // PHASE5.1: characterLimit is a RECOMMENDED range, not a hard limit.
        passed: false, characterCount: prompt.length, characterLimit: modelType === 'mini' ? 1500 : 2000,
        model: modelType === 'full' ? 'Seedance 2.0 Standard' : 'Seedance 2.0 Mini', modelId: modelType,
        duration, frameCount: duration * 24, resolution, aspectRatio,
        referenceImageCount: 0, referenceAudioCount: 0, referenceVideoCount: 0, totalReferenceDuration: 0,
        estimatedCost: 0, estimatedCostCny: 0,
        validationLog: ['❌ Network error — server may be restarting. Please try again.'],
        errors: ['Network request failed. The server may be temporarily unavailable. Please retry.'],
        timestamp: new Date().toISOString(),
      });
    }
    finally { setLoading(false); }
  }, [currentTaskId, prompt, modelType, resolution, duration, aspectRatio, references, maxCostUsd, outputFilename, onResult, onTaskId, onInvalidatedClear, seedanceModelId, generationMode]);

  const passed = dryRunResult?.passed === true && !dryRunInvalidated;
  const borderOk = dryRunResult?.passed ? (dryRunInvalidated ? 'oklch(0.75 0.15 80)' : 'oklch(0.55 0.15 155)') : 'oklch(0.577 0.245 27.325)';
  const bgOk = dryRunResult?.passed ? (dryRunInvalidated ? 'oklch(0.15 0.03 80 / 30%)' : 'oklch(0.15 0.03 155 / 30%)') : 'oklch(0.15 0.05 27 / 30%)';
  const headerColor = dryRunResult?.passed ? (dryRunInvalidated ? 'text-amber-400' : 'text-emerald-400') : 'text-red-400';

  return (
    <StepShell
      num={4}
      title="Dry Run"
      value="dryrun"
      active
      completed={passed}
      defaultOpen={false}
      headerBadge={
        dryRunInvalidated && dryRunResult ? (
          <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" /> STALE
          </Badge>
        ) : undefined
      }
      summary={
        loading
          ? (
            <StepChip tone="muted">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Running Dry Run...
            </StepChip>
          )
          : dryRunResult
          ? <StepChip tone={passed ? 'emerald' : 'red'}>{passed ? '✓ Passed' : '✗ Failed'}</StepChip>
          : <StepChip tone="muted">Not run</StepChip>
      }
    >
        <p className="text-sm text-gray-400">Validates your configuration locally — no paid API request is made.</p>
        <Button onClick={runDryRun} disabled={loading || prompt.trim().length === 0}
          data-dry-run-btn
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(5,150,105,0.3)]" size="lg">
          {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
          {loading ? 'Running Dry Run...' : 'Run Dry Run'}
        </Button>

        {loading && <DryRunProgressBar step={progressStep} />}

        {dryRunResult && (
          <div className="rounded-lg border-2 p-5 transition-all space-y-4" style={{ borderColor: borderOk, backgroundColor: bgOk }}>
            {/* Pass/Fail Header */}
            <div className="flex items-center gap-3">
              {dryRunResult.passed
                ? (dryRunInvalidated ? <AlertTriangle className="w-8 h-8 text-amber-400" /> : <CheckCircle2 className="w-8 h-8 text-emerald-400" />)
                : <XCircle className="w-8 h-8 text-red-400" />}
              <div>
                <h3 className={`text-lg font-bold ${headerColor}`}>
                  {dryRunResult.passed ? (dryRunInvalidated ? 'DRY RUN PASSED (STALE)' : 'DRY RUN PASSED') : 'DRY RUN FAILED'}
                </h3>
                {dryRunResult.timestamp && <p className="text-xs text-muted-foreground">{new Date(dryRunResult.timestamp).toLocaleString()}</p>}
              </div>
            </div>

            <EnhancedSummaryGrid result={dryRunResult} modelType={modelType} />
            <CostBreakdownSection result={dryRunResult} />
            <ReferenceSummary result={dryRunResult} />

            {/* Errors */}
            {dryRunResult.errors.length > 0 && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                <h4 className="text-sm font-medium text-red-400 mb-2">Errors</h4>
                <ul className="space-y-1">{dryRunResult.errors.map((err, i) => <li key={i} className="text-xs text-red-300">• {err}</li>)}</ul>
              </div>
            )}

            {/* Validation Log */}
            <div className="p-3 rounded bg-muted/40">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Validation Log</h4>
              <CategorizedLog log={dryRunResult.validationLog} />
            </div>

            <GatePreview result={dryRunResult} safeMode={safeMode} />

            {/* Technical Details */}
            <Collapsible open={showTechDetails} onOpenChange={setShowTechDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-300">
                  {showTechDetails ? <ChevronDown className="w-3.5 h-3.5 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 mr-1" />}
                  Technical Details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 rounded bg-muted/50 text-xs font-mono text-muted-foreground space-y-1">
                  <div>POST /api/v3/contents/generations/tasks</div>
                  <div>model_id: {dryRunResult.modelId}</div>
                  <div>dry_run_version: 2.0</div>
                  <div>validation_engine: local</div>
                  <div>api_call_made: false</div>
                  <div>schema_validation: {dryRunResult.passed ? 'PASSED' : 'FAILED'}</div>
                  <div>task_ref: {currentTaskId || 'N/A'}</div>
                  <div>safe_mode: {safeMode ? 'ON' : 'OFF'}</div>
                  <div>invalidated: {dryRunInvalidated ? 'YES' : 'NO'}</div>
                  <div>ref_images: {dryRunResult.referenceImageCount}/9</div>
                  <div>ref_videos: {dryRunResult.referenceVideoCount}/3</div>
                  <div>ref_audios: {dryRunResult.referenceAudioCount}/3</div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
    </StepShell>
  );
}
