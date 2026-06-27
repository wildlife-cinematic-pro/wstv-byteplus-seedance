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
  isValidSeedanceDuration,
  type GenerationMode,
} from '@/lib/seedance-validation';

// Legacy cost table (kept for Cost Breakdown Bar display only — not used for API validation)
function costPerSec(model: ModelType, res: string) {
  const table: Record<string, Record<string, number>> = {
    mini: { '480p': 0.02, '720p': 0.04 },
    full: { '480p': 0.03, '720p': 0.06, '1080p': 0.10, '4K': 0.18 },
  };
  return table[model]?.[res] || 0;
}
function estimateCost(model: ModelType, res: string, dur: number) {
  if (dur === -1) return 0; // auto duration — cost unknown
  return costPerSec(model, res) * dur;
}
function getPixelDims(res: string) {
  const map: Record<string, string> = { '480p': '854×480', '720p': '1280×720', '1080p': '1920×1080', '4K': '3840×2160' };
  return map[res] || res;
}

// Map Seedance model ID to legacy ModelType for cost table lookups
function seedanceIdToModelType(id: string): ModelType {
  return id === SEEDANCE_MODEL_IDS.MINI ? 'mini' : 'full';
}

const PRESETS = [
  { name: 'Social Reel', icon: '🎬', resolution: '720p', duration: 15, aspectRatio: '9:16' },
  { name: 'Cinematic', icon: '🌅', resolution: '1080p', duration: 10, aspectRatio: '16:9' },
  { name: 'Detail Shot', icon: '🔬', resolution: '4K', duration: 6, aspectRatio: '1:1' },
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
  const modelType = seedanceIdToModelType(seedanceModelId);
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
              <div className="text-xs text-muted-foreground">${costPerSec(modelType, r).toFixed(2)}/s</div>
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

function CostBreakdownBar({ seedanceModelId, resolution, duration }: { seedanceModelId: string; resolution: string; duration: number }) {
  const modelType = seedanceIdToModelType(seedanceModelId);
  const base = costPerSec(modelType, '480p');
  const current = costPerSec(modelType, resolution);
  const resMult = base > 0 ? current / base : 1;
  const total = duration === -1 ? 0 : current * duration;
  const cny = total * 7.25;
  const barMax = costPerSec('full', '4K') * 15;
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
      {duration !== -1 && (
        <div className="space-y-1.5">
          {[
            { label: 'Base (480p)', value: base * duration, color: 'bg-emerald-600' },
            { label: `Res ×${resMult.toFixed(1)}`, value: total - base * duration, color: 'bg-amber-500' },
            { label: 'Duration', value: total * 0.1, color: 'bg-sky-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">{item.label}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, (item.value / barMax) * 100)}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-14 text-right">${item.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{duration === -1 ? 'auto duration' : `${(total / Math.max(duration, 1)).toFixed(3)}/sec`}</span>
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
  const cost = estimateCost(seedanceIdToModelType(seedanceModelId), resolution, duration);
  const durationValid = isValidSeedanceDuration(duration);
  const modelMeta = MODEL_METADATA[seedanceModelId] ?? MODEL_METADATA[SEEDANCE_MODEL_IDS.STANDARD];

  const applyPreset = (p: typeof PRESETS[number]) => {
    setResolution(p.resolution);
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
              <div className="text-xs text-muted-foreground mt-0.5">Master image + storyboard + character/environment references</div>
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
              <div className="text-xs text-muted-foreground mt-0.5">Exact first-frame / first+last-frame control</div>
              <div className="text-xs text-amber-500/70 mt-1">Cannot mix with reference media</div>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0 text-emerald-500/70" />
            Frame mode and reference mode cannot be mixed in one request. Use reference mode for master image + storyboard. Use frame mode only for first-frame / last-frame lock.
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
                <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
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
        <CostBreakdownBar seedanceModelId={seedanceModelId} resolution={resolution} duration={duration} />
    </StepShell>
  );
}
