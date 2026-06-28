'use client';

import { useState, useMemo, useCallback } from 'react';
import { Sparkles, Zap, ArrowLeftRight, Info, Clipboard, Lock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QualityMeter, StepShell, StepChip } from './shared';
import type { ModelType } from './types';

/* ─── Helpers ─── */
// PHASE5.1: Char limits are RECOMMENDED ranges, not hard API limits.
// A long prompt shows a warning but does NOT hard-block Dry Run.
// Official Seedance 2.0 does not publish a hard character limit —
// these are soft guidelines based on model context windows.
function getRecommendedCharLimit(model: ModelType) { return model === 'mini' ? 1500 : 2000; }
function getOptimalRange(model: ModelType) { return model === 'mini' ? [150, 1000] as const : [200, 1500] as const; }

/* ─── Quality Analyzer (kept — gives useful local feedback on pasted prompts) ─── */
function analyzeQuality(prompt: string, model: ModelType) {
  if (!prompt.trim()) return { structure: 0, specificity: 0, sensory: 0, length: 0, overall: 0, suggestions: [] as string[] };
  const suggestions: string[] = [];
  // Structure: legacy bracketed timing plus current WSTV beat/shot labels
  const timeCodes = prompt.match(/\[\d+-\d+s?\s*\w*\]/g) || [];
  const timingBeatLabels = ['Opening beat', 'Middle beat', 'Peak beat', 'Resolution beat', 'Final beat'];
  const timingBeats = timingBeatLabels.filter(label => new RegExp(`\\b${label}:`, 'i').test(prompt)).length;
  const shotLabels = (prompt.match(/\bShot\s+[1-3]\s*:/gi) || []).length;
  const legacyStructureScore = timeCodes.length * 25;
  const wstvStructureScore = (timingBeats * 20) + (shotLabels * 12);
  const structure = Math.min(100, Math.max(legacyStructureScore, wstvStructureScore));
  if (structure < 50) suggestions.push('Add Timing guide beats such as Opening beat, Middle beat, Peak beat, Resolution beat, Final beat.');
  // Specificity: numbers, adjectives, technical terms
  const numbers = (prompt.match(/\d+/g) || []).length;
  const adjectives = (prompt.match(/\b(golden|massive|electric|dramatic|explosive|crushing|towering|oversized|rhythmic|shimmering|bioluminescent|silhouetted)\b/gi) || []).length;
  const specificity = Math.min(100, (numbers * 8) + (adjectives * 12));
  if (specificity < 40) suggestions.push('Add specific details: numbers, descriptive adjectives, technical terms');
  // Sensory: visual/audio/motion cues
  const visualCues = (prompt.match(/\b(camera|lens|shot|angle|close-up|wide|aerial|macro|pan|zoom|tilt|tracking)\b/gi) || []).length;
  const audioCues = (prompt.match(/\b(sound|echo|roar|song|splash|shatter|pulse|rhythm|music|ambient|silence)\b/gi) || []).length;
  const motionCues = (prompt.match(/\b(slow[- ]?motion|time[- ]?lapse|speed|burst|rush|flow|drift|swim|fly|leap|swing|strike|pounce)\b/gi) || []).length;
  const sensory = Math.min(100, (visualCues * 15) + (audioCues * 20) + (motionCues * 15));
  if (sensory < 40) suggestions.push('Add sensory details: camera angles, lighting, movement, sounds');
  // Length
  const [lo, hi] = getOptimalRange(model);
  const len = prompt.length;
  let length = 100;
  if (len < lo) { length = Math.round((len / lo) * 60); suggestions.push(`Prompt is short — aim for ${lo}+ characters for richer output`); }
  else if (len > hi) { length = Math.max(20, 100 - Math.round(((len - hi) / hi) * 80)); suggestions.push('Prompt may be too long — consider trimming to the optimal range'); }
  const overall = Math.round(structure * 0.3 + specificity * 0.25 + sensory * 0.25 + length * 0.2);
  return { structure, specificity, sensory, length, overall, suggestions };
}

/* ─── Sub-components ─── */
function CharProgressBar({ len, limit }: { len: number; limit: number }) {
  const pct = Math.min(100, (len / limit) * 100);
  // PHASE5: Over-limit is amber (warning), NOT red (hard block).
  // 3500 characters does NOT hard-block Dry Run.
  const barColor = pct <= 60 ? 'bg-emerald-500' : 'bg-amber-500';
  return (
    <div className="mt-1.5">
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
        <span>{len.toLocaleString()} chars</span>
        <span>{limit.toLocaleString()} recommended range</span>
      </div>
    </div>
  );
}

function ModelCompareDialog() {
  const specs = [
    { label: 'Resolution', full: '480p–4k', mini: '480p–720p' },
    { label: 'Duration', full: '4–15s', mini: '4–15s' },
    { label: 'Speed', full: 'Standard', mini: 'Fast' },
    { label: 'Pricing', full: 'official token estimate', mini: 'official token estimate' },
    { label: 'Max Inputs', full: '9 img / 3 aud / 3 vid', mini: '9 img / 3 aud / 3 vid' },
    { label: 'Audio Gen', full: 'Yes / Supported / generate_audio true', mini: 'Yes / Supported / generate_audio true' },
    { label: 'Quality', full: 'Highest', mini: 'Good' },
  ];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs">
          <ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Compare Models
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-emerald-500/20 text-gray-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" /> Model Comparison
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Spec</div>
          <div className="text-emerald-400 font-medium text-xs uppercase tracking-wider text-center">Full</div>
          <div className="text-amber-400 font-medium text-xs uppercase tracking-wider text-center">Mini</div>
          {specs.map(s => (
            <div key={s.label} className="contents">
              <div className="text-gray-400 text-xs py-1.5">{s.label}</div>
              <div className="text-emerald-300 text-xs py-1.5 text-center font-medium">{s.full}</div>
              <div className="text-amber-300 text-xs py-1.5 text-center font-medium">{s.mini}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-emerald-500/30 pt-3 space-y-2 text-xs">
          <div className="flex gap-2 items-start"><Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /><span className="text-gray-300"><strong className="text-emerald-400">Use Full</strong> when you need highest resolution, cinematic quality, or longer detailed prompts</span></div>
          <div className="flex gap-2 items-start"><Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" /><span className="text-gray-300"><strong className="text-amber-400">Use Mini</strong> when speed and cost matter, or for quick iterations and previews</span></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Mode B: Future AI Prompt Writer (disabled placeholder) ─── */
function FutureAiWriterPanel() {
  return (
    <div className="p-4 rounded-md bg-muted/30 border border-dashed border-border space-y-3">
      <div className="flex items-center gap-2 text-gray-400">
        <Lock className="w-4 h-4" />
        <span className="text-sm font-medium">AI Prompt Writer — Future Feature</span>
        <Badge variant="outline" className="text-xs border-border text-muted-foreground ml-auto">DISABLED</Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Future AI Prompt Writer — disabled. Later this can connect to ChatGPT / Claude / GLM API.
        No network call is made. No API key is configured. No real integration exists yet.
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled
        className="border-border text-muted-foreground cursor-not-allowed opacity-60"
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate Prompt with AI
      </Button>
      <p className="text-xs text-muted-foreground">
        Safe Mode is ON · Dry Run only · No external API calls
      </p>
    </div>
  );
}

/* ─── Main Component ─── */
interface StepPromptProps {
  prompt: string;
  setPrompt: (v: string) => void;
  modelType: ModelType;
  setModelType: (v: ModelType) => void;
}

/**
 * StepPrompt — clean two-mode prompt editor for the Generate tab.
 *
 * Mode A (default): Copy-Paste Prompt
 *   - Large textarea
 *   - Character count + progress bar
 *   - Local quality analyzer (pure regex, no API)
 *   - Model selector (Full / Mini)
 *
 * Mode B: AI Prompt Writer (disabled placeholder)
 *   - No network call
 *   - No API key
 *   - No real integration
 *   - Visible only as a future-feature hint
 *
 * Removed in this cleanup (was clutter for copy-paste workflow):
 *   - Prompt Structure Guide (static text)
 *   - Template Quick-Insert cards (hardcoded prompts)
 *   - DB Templates panel (loaded from promptTemplate table)
 *   - Quick-fill dropdowns (Animal, Biome, Action, Camera, Lighting)
 *   - Booster buttons (Cinematic, Audio, Time Codes, Optimize Mini)
 *   - Recent Prompts section
 */
export function StepPrompt({ prompt, setPrompt, modelType, setModelType }: StepPromptProps) {
  const [mode, setMode] = useState<'copy-paste' | 'ai-writer'>('copy-paste');
  const [copied, setCopied] = useState(false);
  const charLimit = getRecommendedCharLimit(modelType);
  const quality = useMemo(() => analyzeQuality(prompt, modelType), [prompt, modelType]);
  const copyPrompt = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [prompt]);

  return (
    <StepShell
      num={1}
      title="Prompt"
      value="prompt"
      active
      completed={prompt.length > 0}
      summary={
        <>
          <StepChip tone="muted">{prompt.length} chars</StepChip>
          <StepChip>{modelType === 'mini' ? 'Mini' : 'Full'}</StepChip>
        </>
      }
    >
        {/* Model Selector + Compare — always visible in both modes */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-sm text-gray-400 mb-2 block">Model</Label>
              <div className="flex gap-2 flex-wrap">
                <Button variant={modelType === 'full' ? 'default' : 'outline'} size="sm" onClick={() => setModelType('full')}
                  className={modelType === 'full' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-border text-gray-400 hover:text-emerald-400'}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Full
                </Button>
                <Button variant={modelType === 'mini' ? 'default' : 'outline'} size="sm" onClick={() => setModelType('mini')}
                  className={modelType === 'mini' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border-border text-gray-400 hover:text-amber-400'}>
                  <Zap className="w-3.5 h-3.5 mr-1" /> Mini
                </Button>
                <ModelCompareDialog />
              </div>
            </div>
          </div>
        </div>

        {/* Mode toggle — Copy-Paste (A) vs AI Writer (B, disabled) */}
        <div className="flex gap-1 p-1 bg-muted/30 border border-emerald-500/30 rounded-md w-fit">
          <button
            type="button"
            onClick={() => setMode('copy-paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              mode === 'copy-paste' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-emerald-400'
            }`}
          >
            <Clipboard className="w-3 h-3" />
            Copy-Paste Prompt
          </button>
          <button
            type="button"
            onClick={() => setMode('ai-writer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              mode === 'ai-writer' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-emerald-400'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            AI Prompt Writer
          </button>
        </div>

        {/* ─── Mode A: Copy-Paste Prompt (default) ─── */}
        {mode === 'copy-paste' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-gray-400">Prompt</Label>
                {/* PHASE5.1: Word count + character count warning system.
                    Over-limit is amber (warning), NOT red (hard block).
                    3500 characters does NOT hard-block Dry Run.
                    These are RECOMMENDED ranges, not official hard API limits. */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    <span className="text-gray-400">{prompt.trim() ? prompt.trim().split(/\s+/).filter(Boolean).length : 0}</span> words
                  </span>
                  <span className={`${prompt.length > charLimit ? 'text-amber-400' : prompt.length > charLimit * 0.8 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    <span className={prompt.length > charLimit ? 'text-amber-400' : 'text-gray-400'}>{prompt.length}</span> / {charLimit} chars
                    {prompt.length > charLimit && (
                      <span className="text-amber-500 ml-1 text-xs">Long prompt warning — not blocked in Dry Run</span>
                    )}
                  </span>
                  <Badge variant="outline" className={`text-xs ${modelType === 'mini' ? 'text-amber-400 border-amber-500/30' : 'text-emerald-400 border-emerald-500/30'}`}>
                    {modelType === 'mini' ? 'Mini' : 'Full'}
                  </Badge>
                </div>
              </div>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPrompt}
                  disabled={!prompt}
                  className="absolute right-2 top-2 z-10 h-7 border-emerald-500/30 bg-background/90 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Paste your finished prompt here (from ChatGPT / Claude / GLM)..."
                  className="h-64 min-h-0 max-h-64 overflow-y-auto resize-none bg-muted/30 border-emerald-500/20 focus:border-emerald-500/50 text-gray-100 placeholder:text-muted-foreground/60 font-mono text-sm pr-24"
                />
              </div>
              <CharProgressBar len={prompt.length} limit={charLimit} />
            </div>

            {/* Local quality analyzer — pure regex, no API call */}
            {prompt.length > 10 && (
              <div className="p-3 rounded-md bg-muted/30 border border-emerald-500/30 space-y-2 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Prompt Quality</span>
                  <span className={`text-sm font-bold ${quality.overall >= 70 ? 'text-emerald-400' : quality.overall >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{quality.overall}%</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <QualityMeter label="Structure" score={quality.structure} size="sm" />
                  <QualityMeter label="Specificity" score={quality.specificity} size="sm" />
                  <QualityMeter label="Sensory" score={quality.sensory} size="sm" />
                  <QualityMeter label="Length" score={quality.length} size="sm" />
                </div>
                {quality.suggestions.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {quality.suggestions.map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-amber-400">•</span>{s}</li>)}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <Info className="w-3 h-3" /> Local analysis only — no API call. Paste your finished prompt as-is.
                </p>
              </div>
            )}
          </>
        )}

        {/* ─── Mode B: AI Prompt Writer (disabled placeholder) ─── */}
        {mode === 'ai-writer' && (
          <FutureAiWriterPanel />
        )}
    </StepShell>
  );
}
