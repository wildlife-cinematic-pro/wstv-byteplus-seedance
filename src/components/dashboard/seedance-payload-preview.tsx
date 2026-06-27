'use client';

import { useMemo, useState } from 'react';
import { Code2, FileText, Info, AlertTriangle, ChevronDown, ChevronRight, Copy, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StepNumber } from './shared';
import type { ReferenceEntry } from './types';
import {
  buildSeedancePayload,
  validateSeedancePayload,
  SEEDANCE_MODEL_IDS,
  MODEL_METADATA,
  HUMAN_FACE_WARNING,
  FRAMES_NOT_SUPPORTED_NOTE,
  SEED_NOT_SUPPORTED_NOTE,
  CAMERA_FIXED_NOT_SUPPORTED_NOTE,
  MEDIA_LIMITS,
  SEEDANCE_TASK_STATUSES,
  CANCEL_DELETE_RULES,
  type GenerationMode,
} from '@/lib/seedance-validation';

interface SeedancePayloadPreviewPanelProps {
  prompt: string;
  seedanceModelId: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  references: ReferenceEntry[];
  generationMode: GenerationMode;
  audioMode: string;
}

// ─── Example payloads (static, for the Request Examples panel) ───

const EXAMPLE_PAYLOADS: { label: string; description: string; payload: Record<string, unknown> }[] = [
  {
    label: 'A. Text-only',
    description: 'Pure text prompt, no reference media.',
    payload: {
      model: SEEDANCE_MODEL_IDS.STANDARD,
      content: [{ type: 'text', text: 'Timing guide:\nOpening beat: A lioness crouches in tall savanna grass.\nMiddle beat: Wind ripples the grass as she watches the herd.\nPeak beat: She bursts forward through dust.\nResolution beat: The herd scatters safely.\nFinal beat: She pauses in warm backlight.' }],
      ratio: '9:16',
      duration: 15,
      resolution: '720p',
      watermark: false,
      generate_audio: true,
      return_last_frame: true,
    },
  },
  {
    label: 'B. Frame mode: first_frame',
    description: 'Single first-frame image to lock the opening shot.',
    payload: {
      model: SEEDANCE_MODEL_IDS.STANDARD,
      content: [
        { type: 'text', text: 'Timing guide:\nOpening beat: Match the provided first frame.\nMiddle beat: The lioness raises her head.\nPeak beat: Dust catches the light around her.\nResolution beat: She settles into a steady stance.\nFinal beat: Hold a cinematic close frame.' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/first_frame.png' }, role: 'first_frame' },
      ],
      ratio: '9:16',
      duration: 10,
      resolution: '720p',
      watermark: false,
      generate_audio: true,
      return_last_frame: true,
    },
  },
  {
    label: 'C. Frame mode: first_frame + last_frame',
    description: 'First + last frame for exact start and end control.',
    payload: {
      model: SEEDANCE_MODEL_IDS.STANDARD,
      content: [
        { type: 'text', text: 'Timing guide:\nOpening beat: Start from the first frame crouch.\nMiddle beat: The lioness rises into motion.\nPeak beat: She reaches full sprint.\nResolution beat: Motion eases toward the target pose.\nFinal beat: Land exactly on the last frame.' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/first_frame.png' }, role: 'first_frame' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/last_frame.png' }, role: 'last_frame' },
      ],
      ratio: '9:16',
      duration: 12,
      resolution: '720p',
      watermark: false,
      generate_audio: true,
      return_last_frame: true,
    },
  },
  {
    label: 'D. Reference mode: master + storyboard',
    description: 'WSTV default — master identity image + storyboard shot-order image.',
    payload: {
      model: SEEDANCE_MODEL_IDS.STANDARD,
      content: [
        { type: 'text', text: 'Timing guide:\nOpening beat: Lioness crouches low in the grass.\nMiddle beat: She tracks movement across the plain.\nPeak beat: The chase surges forward.\nResolution beat: The action slows near the ridge.\nFinal beat: Hold on her alert profile.' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/master_identity.png' }, role: 'reference_image' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/storyboard.png' }, role: 'reference_image' },
      ],
      ratio: '9:16',
      duration: 15,
      resolution: '720p',
      watermark: false,
      generate_audio: true,
      return_last_frame: true,
    },
  },
  {
    label: 'E. Reference mode: master + storyboard + audio',
    description: 'Master + storyboard + ambient audio reference.',
    payload: {
      model: SEEDANCE_MODEL_IDS.STANDARD,
      content: [
        { type: 'text', text: 'Timing guide:\nOpening beat: Lioness waits in rain-dark grass.\nMiddle beat: Ambient wind and distant calls build.\nPeak beat: She moves through splashing water.\nResolution beat: The scene calms under soft thunder.\nFinal beat: Hold a quiet breathing moment.' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/master_identity.png' }, role: 'reference_image' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/storyboard.png' }, role: 'reference_image' },
        { type: 'audio_url', audio_url: { url: 'https://cdn.example.com/ambient.wav' }, role: 'reference_audio' },
      ],
      ratio: '9:16',
      duration: 15,
      resolution: '720p',
      watermark: false,
      generate_audio: true,
      return_last_frame: true,
    },
  },
  {
    label: 'F. Reference mode: master + video + audio',
    description: 'Master identity + reference video (motion) + audio reference.',
    payload: {
      model: SEEDANCE_MODEL_IDS.STANDARD,
      content: [
        { type: 'text', text: 'Timing guide:\nOpening beat: Lioness starts from a low stance.\nMiddle beat: Match the reference video pacing.\nPeak beat: Her stride reaches full speed.\nResolution beat: Motion decelerates naturally.\nFinal beat: Hold a steady final profile.' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/master_identity.png' }, role: 'reference_image' },
        { type: 'video_url', video_url: { url: 'https://cdn.example.com/motion_ref.mp4' }, role: 'reference_video' },
        { type: 'audio_url', audio_url: { url: 'https://cdn.example.com/ambient.wav' }, role: 'reference_audio' },
      ],
      ratio: '9:16',
      duration: 15,
      resolution: '720p',
      watermark: false,
      generate_audio: true,
      return_last_frame: true,
    },
  },
];

export function SeedancePayloadPreviewPanel({
  prompt,
  seedanceModelId,
  resolution,
  duration,
  aspectRatio,
  references,
  generationMode,
  audioMode,
}: SeedancePayloadPreviewPanelProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showLifecycle, setShowLifecycle] = useState(false);
  const [showMediaWarnings, setShowMediaWarnings] = useState(false);
  const [showFutureControls, setShowFutureControls] = useState(false);
  const [copiedExample, setCopiedExample] = useState<number | null>(null);

  // Build the references object in the shape expected by buildSeedancePayload
  const seedanceRefs = useMemo(() => {
    const active = references.filter(r => r.url.trim());
    return {
      images: active.filter(r => r.assetType === 'image').map(r => ({ role: r.role, url: r.url, label: r.label })),
      videos: active.filter(r => r.assetType === 'video').map(r => ({ role: r.role, url: r.url, label: r.label })),
      audios: active.filter(r => r.assetType === 'audio').map(r => ({ role: r.role, url: r.url, label: r.label })),
    };
  }, [references]);

  // Build the live payload preview
  const payload = useMemo(() => buildSeedancePayload({
    modelId: seedanceModelId,
    prompt,
    ratio: aspectRatio,
    duration,
    resolution,
    generationMode,
    references: seedanceRefs,
    watermark: false,
    generateAudio: audioMode !== 'none',
    returnLastFrame: true,
  }), [seedanceModelId, prompt, aspectRatio, duration, resolution, generationMode, seedanceRefs, audioMode]);

  // Validate the live payload
  const validation = useMemo(() => validateSeedancePayload({
    modelId: seedanceModelId,
    prompt,
    ratio: aspectRatio,
    duration,
    resolution,
    generationMode,
    references: seedanceRefs,
  }), [seedanceModelId, prompt, aspectRatio, duration, resolution, generationMode, seedanceRefs]);

  const copyToClipboard = (text: string, idx: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedExample(idx);
        setTimeout(() => setCopiedExample(null), 2000);
      }).catch(() => {});
    }
  };

  const modelMeta = MODEL_METADATA[seedanceModelId] ?? MODEL_METADATA[SEEDANCE_MODEL_IDS.STANDARD];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Code2 className="w-5 h-5 text-emerald-400" />
          Seedance 2.0 API Validation & Payload Preview
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10">
            Payload preview only — no real API call
          </Badge>
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Model: {modelMeta.shortLabel}
          </Badge>
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Mode: {generationMode === 'reference_mode' ? 'Reference' : 'Frame'}
          </Badge>
          <Badge variant="outline" className={`text-xs ${validation.valid ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
            {validation.valid ? '✓ Valid' : `✗ ${validation.errors.length} error(s)`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick info row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-muted/30 rounded p-2 border border-emerald-500/30">
            <p className="text-muted-foreground text-xs">Model ID</p>
            <p className="text-gray-300 font-mono text-xs truncate">{seedanceModelId}</p>
          </div>
          <div className="bg-muted/30 rounded p-2 border border-emerald-500/30">
            <p className="text-muted-foreground text-xs">Resolution</p>
            <p className="text-gray-300">{resolution}</p>
          </div>
          <div className="bg-muted/30 rounded p-2 border border-emerald-500/30">
            <p className="text-muted-foreground text-xs">Duration</p>
            <p className="text-gray-300">{duration === -1 ? 'auto (-1)' : `${duration}s`}</p>
          </div>
          <div className="bg-muted/30 rounded p-2 border border-emerald-500/30">
            <p className="text-muted-foreground text-xs">Ratio</p>
            <p className="text-gray-300">{aspectRatio}</p>
          </div>
        </div>

        {/* Validation errors */}
        {validation.errors.length > 0 && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 space-y-1">
            <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors
            </p>
            {validation.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-300 ml-5">• {err}</p>
            ))}
          </div>
        )}

        {/* Validation warnings */}
        {validation.warnings.length > 0 && (
          <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 space-y-1">
            <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Warnings
            </p>
            {validation.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-300 ml-5">• {w}</p>
            ))}
          </div>
        )}

        {/* ─── Live Payload Preview (collapsible) ─── */}
        <Collapsible open={showPreview} onOpenChange={setShowPreview}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Live Payload Preview (JSON)</span>
              </span>
              {showPreview ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="relative">
              <pre className="p-3 rounded-md bg-muted/60 border border-border text-xs font-mono text-gray-300 overflow-x-auto max-h-80 overflow-y-auto">
{JSON.stringify(payload, null, 2)}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(payload, null, 2), -1)}
                className="absolute top-2 right-2 h-6 px-2 text-xs text-muted-foreground hover:text-emerald-400"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copiedExample === -1 ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              Payload Preview only — no real API call. This is the JSON payload that would be sent to a future real API integration. No request is made now.
            </p>
            <div className="mt-2 p-2 rounded-md bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-gray-400">Future PHASE6 endpoint (NOT called in PHASE5.1):</span>
              </p>
              <p className="text-xs font-mono text-emerald-400/70 mt-0.5">
                POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks
              </p>
              <p className="text-xs text-red-400/80 mt-1">
                ⚠ Do not call this endpoint. ARK_API_KEY is not configured. Safe Mode is ON.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Request Examples (collapsible) ─── */}
        <Collapsible open={showExamples} onOpenChange={setShowExamples}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Request Examples (6 payloads)</span>
              </span>
              {showExamples ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {EXAMPLE_PAYLOADS.map((ex, idx) => (
              <div key={idx} className="bg-muted/30 rounded-md border border-emerald-500/30 overflow-hidden">
                <div className="flex items-center justify-between p-2">
                  <div>
                    <p className="text-xs font-medium text-emerald-400">{ex.label}</p>
                    <p className="text-xs text-muted-foreground">{ex.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(ex.payload, null, 2), idx)}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-emerald-400"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copiedExample === idx ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="p-2 bg-muted/60 border-t border-border text-xs font-mono text-muted-foreground overflow-x-auto max-h-40 overflow-y-auto">
{JSON.stringify(ex.payload, null, 2)}
                </pre>
              </div>
            ))}
            <p className="text-xs text-muted-foreground italic">
              WSTV default example = D (Reference mode: master + storyboard). Model: {SEEDANCE_MODEL_IDS.STANDARD}, ratio 9:16, duration 15, resolution 720p, return_last_frame true.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Future PHASE6 Real API Lifecycle (collapsible) ─── */}
        <Collapsible open={showLifecycle} onOpenChange={setShowLifecycle}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Future PHASE6 Real API Lifecycle</span>
              </span>
              {showLifecycle ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="p-3 rounded-md bg-muted/30 border border-emerald-500/30 space-y-3 text-xs text-muted-foreground">
              <div>
                <p className="text-emerald-400 font-medium mb-1">When real API is connected later:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-2">
                  <li>POST create task → save <code className="text-gray-300">provider_task_id</code></li>
                  <li>Poll GET task until status is <code className="text-gray-300">succeeded</code> / <code className="text-gray-300">failed</code> / <code className="text-gray-300">expired</code></li>
                  <li>Save status</li>
                  <li>On succeeded, read <code className="text-gray-300">content.video_url</code></li>
                  <li>If <code className="text-gray-300">return_last_frame=true</code>, save <code className="text-gray-300">content.last_frame_url</code></li>
                  <li>Save <code className="text-gray-300">usage.total_tokens</code> and <code className="text-gray-300">usage.completion_tokens</code></li>
                  <li>Copy <code className="text-gray-300">video_url</code> and <code className="text-gray-300">last_frame_url</code> to permanent storage quickly — provider URLs expire after 24 hours</li>
                  <li>Record actual tokens and actual cost</li>
                </ol>
              </div>
              <div>
                <p className="text-emerald-400 font-medium mb-1">Task statuses:</p>
                <div className="flex flex-wrap gap-1">
                  {SEEDANCE_TASK_STATUSES.map(s => (
                    <Badge key={s} variant="outline" className="text-xs border-border text-muted-foreground bg-muted">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-emerald-400 font-medium mb-1">Cancel/delete rules:</p>
                <div className="space-y-0.5 ml-2">
                  {SEEDANCE_TASK_STATUSES.map(s => {
                    const rules = CANCEL_DELETE_RULES[s];
                    return (
                      <div key={s} className="text-xs">
                        <span className="text-gray-300">{s}:</span>{' '}
                        <span className={rules.canCancel ? 'text-emerald-400' : 'text-muted-foreground'}>cancel {rules.canCancel ? '✓' : '✗'}</span>{' · '}
                        <span className={rules.canDelete ? 'text-emerald-400' : 'text-muted-foreground'}>delete {rules.canDelete ? '✓' : '✗'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Generated provider video URL and last frame URL expire after 24 hours; copy output to permanent storage after success.</span>
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Media limits & warnings (collapsible) ─── */}
        <Collapsible open={showMediaWarnings} onOpenChange={setShowMediaWarnings}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Media Limits & Warnings</span>
              </span>
              {showMediaWarnings ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="p-2 rounded-md bg-muted/30 border border-emerald-500/30 text-xs text-muted-foreground space-y-1">
              <p className="text-emerald-400 font-medium">Images:</p>
              <p>• Single image under {MEDIA_LIMITS.image.maxSingleSizeMB} MB</p>
              <p>• Total request body under {MEDIA_LIMITS.image.maxTotalRequestMB} MB</p>
              <p>• Prefer URL or asset ID over Base64 for large media</p>
              <p>• Input types: public URL, Base64, <code className="text-gray-300">asset://&lt;ASSET_ID&gt;</code></p>
            </div>
            <div className="p-2 rounded-md bg-muted/30 border border-emerald-500/30 text-xs text-muted-foreground space-y-1">
              <p className="text-emerald-400 font-medium">Videos:</p>
              <p>• Formats: {MEDIA_LIMITS.video.formats.join(', ')}</p>
              <p>• Each reference video {MEDIA_LIMITS.video.minDurationSec}–{MEDIA_LIMITS.video.maxDurationSec} seconds</p>
              <p>• Max {MEDIA_LIMITS.video.maxCount} reference videos</p>
              <p>• Total reference video duration max {MEDIA_LIMITS.video.maxTotalDurationSec} seconds</p>
              <p>• Input types: public URL, asset ID</p>
            </div>
            <div className="p-2 rounded-md bg-muted/30 border border-emerald-500/30 text-xs text-muted-foreground space-y-1">
              <p className="text-emerald-400 font-medium">Audio:</p>
              <p>• Formats: {MEDIA_LIMITS.audio.formats.join(', ')}</p>
              <p>• Each reference audio {MEDIA_LIMITS.audio.minDurationSec}–{MEDIA_LIMITS.audio.maxDurationSec} seconds</p>
              <p>• Max {MEDIA_LIMITS.audio.maxCount} reference audio clips</p>
              <p>• Total reference audio duration max {MEDIA_LIMITS.audio.maxTotalDurationSec} seconds</p>
              <p>• Audio reference must be paired with at least one image or video reference</p>
              <p>• Do not submit audio alone</p>
            </div>
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
              <p className="font-medium flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3 h-3" /> Human-face warning:
              </p>
              <p className="text-amber-300/90">{HUMAN_FACE_WARNING}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Future controls notes (collapsible) ─── */}
        <Collapsible open={showFutureControls} onOpenChange={setShowFutureControls}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Future Controls (NOT in payload)</span>
              </span>
              {showFutureControls ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="p-3 rounded-md bg-muted/30 border border-border space-y-1 text-xs">
              <p className="text-muted-foreground">• {FRAMES_NOT_SUPPORTED_NOTE}</p>
              <p className="text-muted-foreground">• {SEED_NOT_SUPPORTED_NOTE}</p>
              <p className="text-muted-foreground">• {CAMERA_FIXED_NOT_SUPPORTED_NOTE}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
