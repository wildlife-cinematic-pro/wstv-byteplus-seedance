'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageIcon, Play, Loader2, CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, ChevronRight, Copy, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StepShell, StepChip, CostDisplay } from './shared';
import {
  SEEDREAM_MODEL_LABEL,
  SEEDREAM_SIZE_LABELS,
  SEEDREAM_OUTPUT_FORMATS,
  SEEDREAM_OPTIMIZE_MODES,
  MAX_REFERENCE_IMAGES,
  PROMPT_WORD_WARNING_THRESHOLD,
  deriveSeedreamMode,
  resolveSeedreamSize,
  validateCustomSizePixels,
  countPromptWords,
  type SeedreamSizeLabel,
  type SeedreamOutputFormat,
  type SeedreamOptimizeMode,
} from '@/lib/seedream-image-validation';
import { estimateSeedreamImageCost, type SeedreamCostEstimate } from '@/lib/seedream-image-pricing';

interface ImageAssetOption {
  id: string;
  role: string;
  label: string | null;
}

interface DryRunResponse {
  dryRun: boolean;
  providerCalled: boolean;
  paidCallMade: boolean;
  task: {
    id: string;
    status: string;
    mode: string;
    modelId: string;
    size: string;
    width: number;
    height: number;
    outputFormat: string;
    watermark: boolean;
    optimizeMode: string;
    referenceImageCount: number;
    createdAt: string;
  };
  preview: Record<string, unknown>;
  cost: SeedreamCostEstimate;
  warnings: string[];
}

const MODE_LABELS: Record<string, string> = {
  text_to_image: 'Text → Image',
  single_reference: 'Single Reference',
  multi_reference: 'Multi Reference',
};

export function SeedreamImageDryRunPanel() {
  const [assets, setAssets] = useState<ImageAssetOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<SeedreamSizeLabel>('1K');
  const [customWidth, setCustomWidth] = useState('1280');
  const [customHeight, setCustomHeight] = useState('960');
  const [outputFormat, setOutputFormat] = useState<SeedreamOutputFormat>('png');
  const [watermark, setWatermark] = useState(false);
  const [optimizeMode, setOptimizeMode] = useState<SeedreamOptimizeMode>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DryRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reference-assets?assetType=image')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !Array.isArray(d?.assets)) return;
        setAssets(d.assets.map((a: { id: string; role: string; label: string | null }) => ({ id: a.id, role: a.role, label: a.label })));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAsset = useCallback((id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= MAX_REFERENCE_IMAGES) return prev;
      return [...prev, id];
    });
  }, []);

  const mode = deriveSeedreamMode(selected.length);
  const wordCount = countPromptWords(prompt);
  const wordWarning = wordCount > PROMPT_WORD_WARNING_THRESHOLD;

  const parsedCustomWidth = Number.parseInt(customWidth, 10);
  const parsedCustomHeight = Number.parseInt(customHeight, 10);
  const customSizeCheck = size === 'custom' ? validateCustomSizePixels(parsedCustomWidth, parsedCustomHeight) : { valid: true as const };

  const liveCost = useMemo(() => {
    if (size === 'custom' && !customSizeCheck.valid) return null;
    const resolved = resolveSeedreamSize(size, size === 'custom' ? parsedCustomWidth : undefined, size === 'custom' ? parsedCustomHeight : undefined);
    return estimateSeedreamImageCost({
      referenceImageCount: selected.length,
      outputPixelCount: resolved.width * resolved.height,
      pricingBasis: resolved.pricingBasis,
    });
  }, [size, parsedCustomWidth, parsedCustomHeight, selected.length, customSizeCheck.valid]);

  const canSubmit = prompt.trim().length > 0 && !loading && (size !== 'custom' || customSizeCheck.valid);

  const runDryRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        referenceAssetIds: selected,
        size,
        outputFormat,
        watermark,
        optimizeMode,
      };
      if (size === 'custom') {
        body.customWidth = parsedCustomWidth;
        body.customHeight = parsedCustomHeight;
      }
      const res = await fetch('/api/image/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setResult(data);
      } else {
        setError(data?.error || 'Image dry-run failed');
        setResult(null);
      }
    } catch {
      setError('Network error — please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [prompt, selected, size, outputFormat, watermark, optimizeMode, parsedCustomWidth, parsedCustomHeight]);

  const copyPreview = useCallback(() => {
    if (!result) return;
    navigator.clipboard?.writeText(JSON.stringify(result.preview, null, 2)).catch(() => {});
  }, [result]);

  return (
    <StepShell icon={<ImageIcon className="w-5 h-5" />} title="Seedream Image Dry-Run" section="generate" bodyClassName="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StepChip tone="amber">DRY-RUN ONLY</StepChip>
        <StepChip tone="amber">
          <Ban className="w-3 h-3 mr-1" /> NO PROVIDER CALL
        </StepChip>
        <StepChip tone="muted">Model: {SEEDREAM_MODEL_LABEL}</StepChip>
      </div>

      {/* Model (locked) */}
      <div className="p-2.5 rounded-lg bg-muted/40 border border-emerald-500/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Model (locked)</span>
        <span className="text-sm font-medium text-gray-200">{SEEDREAM_MODEL_LABEL}</span>
      </div>

      {/* Prompt */}
      <div className="space-y-1.5">
        <Label className="text-sm text-gray-300">Prompt</Label>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the image, or interactive editing instructions for the reference images..."
          className="min-h-24 bg-muted/40 border-emerald-500/20"
        />
        <div className="flex items-center justify-between text-xs">
          <span className={wordWarning ? 'text-amber-400' : 'text-muted-foreground'}>{wordCount} words</span>
          {wordWarning && (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Over {PROMPT_WORD_WARNING_THRESHOLD}-word guideline — warning only
            </span>
          )}
        </div>
      </div>

      {/* Reference image selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-300">Reference Images</Label>
          <Badge variant="outline" className="text-xs border-border text-gray-400">
            {selected.length}/{MAX_REFERENCE_IMAGES}
          </Badge>
        </div>
        {assets.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved image reference assets. Text-to-image will be used.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1">
            {assets.map(asset => (
              <label
                key={asset.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/60 text-xs cursor-pointer hover:border-emerald-500/40"
              >
                <Checkbox checked={selected.includes(asset.id)} onCheckedChange={() => toggleAsset(asset.id)} />
                <span className="truncate text-gray-300">{asset.label || asset.role}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3 shrink-0" />
          Derived mode: <StepChip tone="muted">{MODE_LABELS[mode]}</StepChip>
        </div>
      </div>

      {/* Size */}
      <div className="space-y-1.5">
        <Label className="text-sm text-gray-300">Size</Label>
        <div className="flex gap-2">
          {SEEDREAM_SIZE_LABELS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                size === s ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-border bg-muted/30 text-gray-400 hover:border-border'
              }`}
            >
              {s === 'custom' ? 'Custom' : s}
            </button>
          ))}
        </div>
        {size === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Width (px)</Label>
              <Input value={customWidth} onChange={e => setCustomWidth(e.target.value)} inputMode="numeric" className="h-8 text-xs bg-muted/40 border-emerald-500/20" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Height (px)</Label>
              <Input value={customHeight} onChange={e => setCustomHeight(e.target.value)} inputMode="numeric" className="h-8 text-xs bg-muted/40 border-emerald-500/20" />
            </div>
            {!customSizeCheck.valid && (
              <p className="col-span-2 text-xs text-red-400 flex items-center gap-1">
                <XCircle className="w-3 h-3 shrink-0" /> {customSizeCheck.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Output format / watermark / optimize mode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-300">Output Format</Label>
          <div className="flex gap-2">
            {SEEDREAM_OUTPUT_FORMATS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setOutputFormat(f)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium uppercase transition-colors ${
                  outputFormat === f ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-border bg-muted/30 text-gray-400 hover:border-border'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-300">Prompt Optimization</Label>
          <div className="flex gap-2">
            {SEEDREAM_OPTIMIZE_MODES.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setOptimizeMode(m)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium capitalize transition-colors ${
                  optimizeMode === m ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-border bg-muted/30 text-gray-400 hover:border-border'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-300">Watermark</Label>
          <div className="flex items-center gap-2 h-8">
            <Switch checked={watermark} onCheckedChange={setWatermark} />
            <span className="text-xs text-muted-foreground">{watermark ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>

      {/* Live estimated cost */}
      <div className="p-3 rounded-lg bg-muted/40 border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estimated Cost</span>
          <StepChip tone="amber">$0 ACTUAL SPEND</StepChip>
        </div>
        {liveCost ? <CostDisplay usd={liveCost.estimatedTotalCostUsd} cny={liveCost.estimatedTotalCostUsd * 7.25} size="sm" /> : <span className="text-xs text-red-400">Invalid size</span>}
      </div>

      <Button
        onClick={runDryRun}
        disabled={!canSubmit}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-5"
        size="lg"
      >
        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
        {loading ? 'Running Image Dry-Run...' : 'Run Image Dry-Run'}
      </Button>

      {error && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-emerald-400">DRY-RUN COMPLETE</h3>
              <p className="text-xs text-muted-foreground">Task {result.task.id.slice(0, 10)}... · {result.task.status}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded bg-muted/40"><p className="text-muted-foreground">Mode</p><p className="text-gray-200">{MODE_LABELS[result.task.mode]}</p></div>
            <div className="p-2 rounded bg-muted/40"><p className="text-muted-foreground">Size</p><p className="text-gray-200">{result.task.size} ({result.task.width}×{result.task.height})</p></div>
            <div className="p-2 rounded bg-muted/40"><p className="text-muted-foreground">Format</p><p className="text-gray-200 uppercase">{result.task.outputFormat}</p></div>
            <div className="p-2 rounded bg-muted/40"><p className="text-muted-foreground">References</p><p className="text-gray-200">{result.task.referenceImageCount}/{MAX_REFERENCE_IMAGES}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StepChip tone={result.dryRun ? 'emerald' : 'red'}>dryRun: {String(result.dryRun)}</StepChip>
            <StepChip tone={!result.providerCalled ? 'emerald' : 'red'}>providerCalled: {String(result.providerCalled)}</StepChip>
            <StepChip tone={!result.paidCallMade ? 'emerald' : 'red'}>paidCallMade: {String(result.paidCallMade)}</StepChip>
          </div>
          {result.warnings.length > 0 && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              {result.warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {w}</p>
              ))}
            </div>
          )}
          <div className="p-2.5 rounded bg-muted/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Cost estimate ({result.cost.pricingBasis})</span>
            <CostDisplay usd={result.cost.estimatedTotalCostUsd} cny={result.cost.estimatedTotalCostUsd * 7.25} size="sm" />
          </div>
          <Collapsible open={showPreview} onOpenChange={setShowPreview}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground hover:text-emerald-400">
                <span className="text-xs font-medium">Sanitized Request Preview (JSON)</span>
                {showPreview ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="relative">
                <pre className="p-3 rounded-md bg-muted/60 border border-border text-xs font-mono text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
{JSON.stringify(result.preview, null, 2)}
                </pre>
                <Button variant="ghost" size="sm" onClick={copyPreview} className="absolute top-2 right-2 h-6 px-2 text-xs text-muted-foreground hover:text-emerald-400">
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 italic">Preview only — never sent over the network. No provider call was made.</p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </StepShell>
  );
}
