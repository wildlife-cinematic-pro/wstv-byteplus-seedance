'use client';

import { DollarSign, Clock, Monitor, FileVideo, Zap, Film, Info, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CostDisplay, StepShell, StepChip } from './shared';
import type { ModelType } from './types';
import {
  SEEDANCE_MODEL_IDS,
  MODEL_METADATA,
  MODEL_RESOLUTION_RULES,
  VALID_DURATION_MIN,
  VALID_DURATION_MAX,
  VALID_RATIOS,
  isValidSeedanceDuration,
  normalizeSeedanceResolution,
  type GenerationMode,
} from '@/lib/seedance-validation';
import { estimateSeedancePlanningCost } from '@/lib/seedance-pricing';

function getPixelDims(res: string) {
  const normalized = normalizeSeedanceResolution(res);
  const map: Record<string, string> = { '480p': '854×480', '720p': '1280×720', '1080p': '1920×1080', '4k': '3840×2160' };
  return map[normalized] || res;
}

const PRESETS = [
  { name: 'Social Reel', icon: '🎬', resolution: '720p', duration: 15, aspectRatio: '9:16' },
  { name: 'Cinematic', icon: '🌅', resolution: '1080p', duration: 10, aspectRatio: '16:9' },
  { name: 'Detail Shot', icon: '🔬', resolution: '4k', duration: 6, aspectRatio: '1:1' },
  { name: 'Quick Preview', icon: '⚡', resolution: '480p', duration: 4, aspectRatio: '9:16' },
  { name: 'Story Clip', icon: '📱', resolution: '720p', duration: 6, aspectRatio: '9:16' },
];

const AUDIO_MODES = [
  { value: 'none', label: 'No Audio', desc: 'Video only — no audio generated' },
  { value: 'auto', label: 'Auto Audio', desc: 'Seedance generates ambient audio (generate_audio=true)' },
  { value: 'reference', label: 'Reference Audio', desc: 'Uses provided audio references' },
];

/* ── Sub-components ── */

function QuickPresets({ seedanceModelId, onApply }: { seedanceModelId: string; onApply: (p: typeof PRESETS[number]) => void }) {
  const supported = MODEL_RESOLUTION_RULES[seedanceModelId] ?? MODEL_RESOLUTION_RULES[SEEDANCE_MODEL_IDS.STANDARD];
  const norm = (r: string) => r.toLowerCase();
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.filter(p => supported.some(r => norm(r) === norm(p.resolution))).map(p => (
        <Button key={p.name} variant="outline" size="sm"
          className="h-7 text-xs rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
          onClick={() => onApply(p)}>
          {p.icon} {p.name}
        </Button>
      ))}
    </div>
  );
}

function ResolutionCards({ seedanceModelId, resolution, setResolution }: { seedanceModelId: string; resolution: string; setResolution: (v: string) => void }) {
  const resList = MODEL_RESOLUTION_RULES[seedanceModelId] ?? MODEL_RESOLUTION_RULES[SEEDANCE_MODEL_IDS.STANDARD];
  const isMiniOrFast = seedanceModelId === SEEDANCE_MODEL_IDS.MINI || seedanceModelId === SEEDANCE_MODEL_IDS.FAST;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {resList.map(r => {
          const selected = resolution.toLowerCase() === r.toLowerCase();
          return (
            <button key={r} onClick={() => setResolution(r)}
              className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                selected
                  ? isMiniOrFast ? 'border-amber-400 bg-amber-500/15' : 'border-emerald-400 bg-emerald-500/15'
                  : 'border-border bg-muted/30 hover:border-border'
              }`}>
              <div className="text-sm font-bold text-gray-200">{r}</div>
              <div className="text-xs text-muted-foreground">{getPixelDims(r)}</div>
              <div className="text-xs text-muted-foreground">official token estimate</div>
            </button>
          );
        })}
      </div>
      {/* Resolution rule note */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="w-3 h-3 shrink-0 text-emerald-500/70" />
        {seedanceModelId === SEEDANCE_MODEL_IDS.STANDARD
          ? 'Seedance Standard supports 480p/720p/1080p/4k.'
          : 'Seedance Fast/Mini support 480p/720p only. 1080p/4k is only supported by Seedance 2.0 Standard.'}
      </p>
    </div>
  );
}

function CostBreakdownBar({
  seedanceModelId,
  resolution,
  duration,
  aspectRatio,
}: {
  seedanceModelId: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
}) {
  const estimate = duration === -1 ? null : estimateSeedancePlanningCost({
    modelId: seedanceModelId,
    resolution,
    aspectRatio,
    outputDurationSec: duration,
    inputMode: 'without_video',
  });
  const total = estimate?.estimatedCostUsd ?? 0;
  const cny = total * 7.25;
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-emerald-500/20 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Cost Breakdown</span>
        {duration === -1 ? (
          <span className="text-xs text-amber-400">Auto duration — cost unknown</span>
        ) : (
          <CostDisplay usd={total} cny={cny} size="md" />
        )}
      </div>
      {estimate && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-background/40 p-2">
            <div className="text-muted-foreground">Tokens</div>
            <div className="text-gray-200 font-mono">{estimate.estimatedTokens.toLocaleString()}</div>
          </div>
          <div className="rounded bg-background/40 p-2">
            <div className="text-muted-foreground">Rate</div>
            <div className="text-gray-200 font-mono">${estimate.usdPerMillionTokens.toFixed(1)}/M</div>
          </div>
          <div className="rounded bg-background/40 p-2">
            <div className="text-muted-foreground">Mode</div>
            <div className="text-gray-200 font-mono">estimate</div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{duration === -1 ? 'auto duration' : 'official_token_estimate_only'}</span>
        {duration !== -1 && <span className="text-muted-foreground">¥{cny.toFixed(2)} CNY</span>}
      </div>
    </div>
  );
}

/* ── Main Component ── */

interface StepOutputProps {
  modelType: ModelType;
  resolution: string; setResolution: (v: string) => void;
  duration: number; setDuration: (v: number) => void;
  aspectRatio: string; setAspectRatio: (v: string) => void;
  maxCostUsd: string; setMaxCostUsd: (v: string) => void;
  outputFilename: string; setOutputFilename: (v: string) => void;
  fps: number; setFps: (v: number) => void;
  audioMode: string; setAudioMode: (v: string) => void;
  // ─── PHASE4: Official Seedance model ID + generation mode ───
  seedanceModelId: string;
  setSeedanceModelId: (v: string) => void;
  generationMode: GenerationMode;
  setGenerationMode: (v: GenerationMode) => void;
}

export function StepOutput({
  modelType, resolution, setResolution, duration, setDuration,
  aspectRatio, setAspectRatio, maxCostUsd, setMaxCostUsd,
  outputFilename, setOutputFilename,
  fps, setFps, audioMode, setAudioMode,
  seedanceModelId, setSeedanceModelId,
  generationMode, setGenerationMode,
}: StepOutputProps) {
  const durationValid = isValidSeedanceDuration(duration);
  const modelMeta = MODEL_METADATA[seedanceModelId] ?? MODEL_METADATA[SEEDANCE_MODEL_IDS.STANDARD];

  const applyPreset = (p: typeof PRESETS[number]) => {
    setResolution(normalizeSeedanceResolution(p.resolution));
    setDuration(p.duration);
    setAspectRatio(p.aspectRatio);
  };

  return (
    <StepShell
      num={3}
      title="Output Settings"
      value="output"
      active
      defaultOpen={false}
      summary={
        <>
          <StepChip>{resolution}</StepChip>
          <StepChip>{duration === -1 ? 'auto' : `${duration}s`}</StepChip>
          <StepChip tone="muted">{aspectRatio}</StepChip>
        </>
      }
    >
        {/* ─── PHASE4: Official Seedance Model Selector ─── */}
        <div>
          <Label className="text-sm text-gray-400 mb-2 block">
            <Film className="w-3.5 h-3.5 inline mr-1" /> Seedance Model (Official)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.values(SEEDANCE_MODEL_IDS).map(id => {
              const meta = MODEL_METADATA[id];
              const selected = seedanceModelId === id;
              const supported = MODEL_RESOLUTION_RULES[id];
              return (
                <button
                  key={id}
                  onClick={() => setSeedanceModelId(id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selected
                      ? 'border-emerald-400 bg-emerald-500/15'
                      : 'border-border bg-muted/30 hover:border-border'
                  }`}
                >
                  <div className="text-sm font-bold text-gray-200">{meta.shortLabel}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{meta.description}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono truncate">{id}</div>
                  <div className="text-xs text-emerald-500/70 mt-0.5">Res: {supported.join(', ')}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── PHASE4: Generation Mode Selector ─── */}
        <div>
          <Label className="text-sm text-gray-400 mb-2 block">
            <Zap className="w-3.5 h-3.5 inline mr-1" /> Generation Mode
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => setGenerationMode('reference_mode')}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                generationMode === 'reference_mode'
                  ? 'border-emerald-400 bg-emerald-500/15'
                  : 'border-border bg-muted/30 hover:border-border'
              }`}
            >
              <div className="text-sm font-bold text-gray-200">Reference Mode</div>
              <div className="text-xs text-muted-foreground mt-0.5">Multimodal references: reference_image, reference_video, reference_audio</div>
              <div className="text-xs text-emerald-500/70 mt-1">Soft first/last guidance through prompt, not exact frame lock</div>
              <Badge variant="outline" className="text-xs mt-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">WSTV default</Badge>
            </button>
            <button
              onClick={() => setGenerationMode('frame_mode')}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                generationMode === 'frame_mode'
                  ? 'border-amber-400 bg-amber-500/15'
                  : 'border-border bg-muted/30 hover:border-border'
              }`}
            >
              <div className="text-sm font-bold text-gray-200">Frame Mode</div>
              <div className="text-xs text-muted-foreground mt-0.5">Strict exact first_frame and optional last_frame</div>
              <div className="text-xs text-amber-500/70 mt-1">Cannot mix with reference media</div>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-emerald-500/70" />
            Reference Mode and Frame Mode cannot be mixed. Use Reference Mode for soft multimodal guidance; use Frame Mode only for exact first/last frame lock.
          </p>
        </div>

        {/* Quick Presets */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
          <QuickPresets seedanceModelId={seedanceModelId} onApply={applyPreset} />
        </div>

        {/* Resolution Cards */}
        <div>
          <Label className="text-sm text-gray-400 mb-2 block">
            <Monitor className="w-3.5 h-3.5 inline mr-1" /> Resolution
          </Label>
          <ResolutionCards seedanceModelId={seedanceModelId} resolution={resolution} setResolution={setResolution} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Aspect Ratio */}
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="bg-muted/30 border-emerald-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="4:3">4:3</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="3:4">3:4</SelectItem>
                <SelectItem value="9:16">9:16 (Vertical, WSTV default)</SelectItem>
                <SelectItem value="21:9">21:9</SelectItem>
                <SelectItem value="adaptive">adaptive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Official ratios: {VALID_RATIOS.join(', ')}. WSTV defaults to 9:16.
            </p>
          </div>
          {/* FPS — kept for cost/frame display only, NOT sent to Seedance API */}
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">
              Frame Rate <span className="text-xs text-muted-foreground">(display only — not in Seedance payload)</span>
            </Label>
            <Select value={String(fps)} onValueChange={v => setFps(Number(v))}>
              <SelectTrigger className="bg-muted/30 border-emerald-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[24, 30, 60].map(f => (
                  <SelectItem key={f} value={String(f)}>{f} fps</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-1">
              {duration !== -1 ? `${duration * fps} total frames @${fps}fps` : 'auto duration — frame count unknown'}
            </div>
          </div>
        </div>

        {/* ─── PHASE4: Duration — any integer 4–15 or -1 for auto ─── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm text-gray-400">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Duration
            </Label>
            <div className="flex items-center gap-2">
              {duration === -1 ? (
                <span className="text-sm text-amber-400 font-medium">Auto (-1) — model chooses</span>
              ) : (
                <span className={`text-sm font-medium ${durationValid ? 'text-emerald-400' : 'text-red-400'}`}>{duration}s</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDuration(duration === -1 ? 15 : -1)}
                className="h-6 px-2 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                {duration === -1 ? 'Set manual' : 'Auto (-1)'}
              </Button>
            </div>
          </div>
          {duration !== -1 && (
            <>
              <Slider value={[duration]} onValueChange={([v]) => setDuration(v)}
                min={VALID_DURATION_MIN} max={VALID_DURATION_MAX} step={1} className="py-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{VALID_DURATION_MIN}s</span><span>{VALID_DURATION_MAX}s</span>
              </div>
            </>
          )}
          {!durationValid && duration !== -1 && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Invalid Seedance duration. Use an integer from {VALID_DURATION_MIN} to {VALID_DURATION_MAX} seconds, or -1 for auto duration.
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-emerald-500/70" />
            Seedance 2.0 duration supports any integer from {VALID_DURATION_MIN} to {VALID_DURATION_MAX} seconds, or -1 for auto duration. Frames parameter is not supported for Seedance 2.0.
          </p>
        </div>

        {/* Audio Mode */}
        <div>
          <Label className="text-sm text-gray-400 mb-2 block">Audio Mode</Label>
          <Select value={audioMode} onValueChange={setAudioMode}>
            <SelectTrigger className="bg-muted/30 border-emerald-500/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIO_MODES.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground mt-1">
            {AUDIO_MODES.find(m => m.value === audioMode)?.desc}
          </div>
        </div>

        {/* Max Cost + Filename */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">
              <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Max Cost Cap (USD)
            </Label>
            <Input type="number" value={maxCostUsd} onChange={e => setMaxCostUsd(e.target.value)}
              placeholder="0.50" step="0.01" min="0"
              className="bg-muted/30 border-emerald-500/20 focus:border-emerald-500/50" />
          </div>
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">
              <FileVideo className="w-3.5 h-3.5 inline mr-1" /> Output Filename
            </Label>
            <Input value={outputFilename} onChange={e => setOutputFilename(e.target.value)}
              placeholder="my_wildlife_video.mp4"
              className="bg-muted/30 border-emerald-500/20 focus:border-emerald-500/50" />
          </div>
        </div>

        {/* Enhanced Cost Display */}
        <CostBreakdownBar seedanceModelId={seedanceModelId} resolution={resolution} duration={duration} aspectRatio={aspectRatio} />
    </StepShell>
  );
}
