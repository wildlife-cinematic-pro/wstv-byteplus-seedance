// src/components/dashboard/step-references.tsx
'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle,
  ImageIcon, Film, Music, Video, ChevronDown, ChevronRight,
  Clipboard, X, Eye, Lightbulb, ExternalLink,
  Plus, Trash2, Camera, Sun, PawPrint, MapPin, Mic2, Volume2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { StepNumber } from './shared';
import {
  REFERENCE_ROLES, REFERENCE_LIMITS,
  FRAME_MODE_ROLES,
  createEmptyReference,
  type ReferenceEntry,
  type GenerationMode,
} from './types';

// ─── Role icons ───
const ROLE_ICONS: Record<string, React.ReactNode> = {
  main_identity: <Eye className="w-4 h-4" />,
  mother_animal: <PawPrint className="w-4 h-4" />,
  baby_animal: <PawPrint className="w-4 h-4" />,
  environment: <MapPin className="w-4 h-4" />,
  camera_framing: <Camera className="w-4 h-4" />,
  lighting_mood: <Sun className="w-4 h-4" />,
  first_frame: <Film className="w-4 h-4" />,
  last_frame: <Film className="w-4 h-4" />,
  extra_style: <ImageIcon className="w-4 h-4" />,
  video_motion: <Film className="w-4 h-4" />,
  video_pacing: <Film className="w-4 h-4" />,
  video_camera: <Camera className="w-4 h-4" />,
  audio_ambient: <Volume2 className="w-4 h-4" />,
  audio_music: <Music className="w-4 h-4" />,
  audio_voice: <Mic2 className="w-4 h-4" />,
};

interface StepReferencesProps {
  references: ReferenceEntry[];
  setReferences: React.Dispatch<React.SetStateAction<ReferenceEntry[]>>;
  riskAcknowledged: boolean;
  setRiskAcknowledged: (v: boolean) => void;
  // ─── PHASE4: Generation mode ───
  generationMode: GenerationMode;
  setGenerationMode: (v: GenerationMode) => void;
}

function isValidAudioUrl(url: string) { return !url || (url.startsWith('https://') && /\.(mp3|wav|m4a)(\?|$)/i.test(url)); }
function isValidVideoUrl(url: string) { return !url || (url.startsWith('https://') && /\.(mp4|mov)(\?|$)/i.test(url)); }
function isValidImageUrl(url: string) { return !url || url.startsWith('https://'); }
function extractExt(url: string) { const m = url.match(/\.(\w{2,4})(\?|$)/i); return m ? m[1].toLowerCase() : null; }

/* ─── Sub: URL Validation indicator ─── */
function UrlValidation({ url, isValid, type }: { url: string; isValid: boolean; type: 'image' | 'audio' | 'video' }) {
  if (!url) return null;
  const msgs: Record<string, string> = { audio: 'HTTPS + .mp3/.wav/.m4a required', video: 'HTTPS + .mp4/.mov required', image: 'Valid HTTPS image URL' };
  return (
    <div className={`flex items-center gap-1 mt-1 text-xs ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
      {isValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {isValid ? `Valid HTTPS ${type} URL` : msgs[type]}
    </div>
  );
}

/* ─── Sub: Risk Acknowledgement ─── */
function RiskAckCard({ id, title, desc, detail, checked, onCheck }: {
  id: string; title: string; desc: string; detail: string; checked: boolean; onCheck: (v: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Alert className="border-amber-500/30 bg-amber-500/10">
      <AlertTriangle className="text-amber-400" />
      <AlertTitle className="text-amber-400 flex items-center gap-2">
        <Checkbox id={id} checked={checked} onCheckedChange={(c) => onCheck(c === true)} className="border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 transition-all" />
        <label htmlFor={id} className="cursor-pointer">{title}</label>
      </AlertTitle>
      <AlertDescription className="text-amber-400/70 space-y-1.5">
        <p>{desc}</p>
        <button onClick={() => setExpanded(!expanded)} className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs underline underline-offset-2">
          {expanded ? 'Show less' : 'Learn more'} <ExternalLink className="w-3 h-3" />
        </button>
        {expanded && <p className="text-xs text-amber-400/60 leading-relaxed">{detail}</p>}
      </AlertDescription>
    </Alert>
  );
}

/* ─── Sub: Reference Tips ─── */
function ReferenceTips() {
  const [open, setOpen] = useState(false);
  const tips = [
    { icon: <ImageIcon className="w-4 h-4 text-emerald-400" />, label: 'Image Tips', text: 'Use high-contrast images (1024x1024+). Main identity sets the subject. First/Last frame guide scene composition.' },
    { icon: <Music className="w-4 h-4 text-emerald-400" />, label: 'Audio Tips', text: 'generate_audio true creates synchronized audio. Optional audio references can influence ambience, but use them carefully.' },
    { icon: <Video className="w-4 h-4 text-emerald-400" />, label: 'Video Tips', text: 'Use 9:16 vertical clips for best results. Keep under 15s. May override text-driven motion.' },
  ];
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5">
          <span className="flex items-center gap-2 text-xs"><Lightbulb className="w-3.5 h-3.5" />Reference Tips</span>
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {tips.map((t) => (
          <div key={t.label} className="flex items-start gap-2 text-xs text-gray-400 bg-muted/30 rounded-md p-2.5">
            <span className="mt-0.5 shrink-0">{t.icon}</span>
            <div><span className="text-gray-300 font-medium">{t.label}:</span> {t.text}</div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ─── Sub: Reference Summary ─── */
function SummaryCard({ filledImages, filledAudio, filledVideo }: { filledImages: number; filledAudio: number; filledVideo: number }) {
  const total = filledImages + filledAudio + filledVideo;
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Reference Summary</span>
        <div className="flex gap-1.5 text-xs">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1">📸 {filledImages}/9</Badge>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1">🎵 {filledAudio}/3</Badge>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1">🎬 {filledVideo}/3</Badge>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {total} ref{total !== 1 ? 's' : ''} · ~{total * 2}s est. processing
      </div>
    </div>
  );
}

/* ─── Sub: Single Reference Row with role dropdown ─── */
function RefRow({ entry, index, onUpdate, onRemove, type, generationMode }: {
  entry: ReferenceEntry;
  index: number;
  onUpdate: (index: number, field: keyof ReferenceEntry, value: string | boolean | number) => void;
  onRemove: (index: number) => void;
  type: 'image' | 'video' | 'audio';
  generationMode: GenerationMode;
}) {
  // Filter roles based on generation mode:
  // - frame_mode: only show first_frame / last_frame (images only)
  // - reference_mode: hide first_frame / last_frame, show all reference-style roles
  const allRoles = REFERENCE_ROLES[type];
  const roles = generationMode === 'frame_mode'
    ? allRoles.filter(r => FRAME_MODE_ROLES.has(r.value))
    : allRoles.filter(r => !FRAME_MODE_ROLES.has(r.value));
  const validFn = type === 'audio' ? isValidAudioUrl : type === 'video' ? isValidVideoUrl : isValidImageUrl;
  const valid = validFn(entry.url);
  const ext = extractExt(entry.url);
  const isImage = type === 'image' && entry.url && valid;

  const handlePaste = useCallback(async () => {
    try { const t = await navigator.clipboard.readText(); if (t) onUpdate(index, 'url', t); } catch { /* clipboard denied */ }
  }, [index, onUpdate]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-background border border-emerald-500/30">
      {/* Role selector */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-emerald-400">{ROLE_ICONS[entry.role] || <ImageIcon className="w-4 h-4" />}</span>
        <Select value={entry.role} onValueChange={v => onUpdate(index, 'role', v)}>
          <SelectTrigger className="w-[150px] h-8 bg-muted/30 border-emerald-500/20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-emerald-500/20">
            {roles.map(r => (
              <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* URL Input */}
      <div className="flex-1 min-w-0">
        <div className="flex gap-1.5 items-center">
          <div className="relative flex-1">
            <Input
              value={entry.url}
              onChange={e => onUpdate(index, 'url', e.target.value)}
              placeholder={`https://example.com/${type}-reference.${type === 'audio' ? 'mp3' : type === 'video' ? 'mp4' : 'jpg'}`}
              className="bg-muted/30 border-emerald-500/20 focus:border-emerald-500/50 pr-16 h-8 text-xs"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {ext && <Badge variant="outline" className="h-4 text-xs px-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">.{ext}</Badge>}
              {entry.url && <button onClick={() => onUpdate(index, 'url', '')} className="p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10" onClick={handlePaste} title="Paste from clipboard">
            <Clipboard className="w-3.5 h-3.5" />
          </Button>
        </div>
        <UrlValidation url={entry.url} isValid={valid} type={type} />
        {isImage && (
          <div className="mt-1.5 flex items-center gap-2">
            <img src={entry.url} alt="Preview" className="h-8 w-8 rounded object-cover border border-emerald-500/20 bg-muted/30" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />Preview</span>
          </div>
        )}
      </div>

      {/* Notes */}
      <Input
        placeholder="Notes..."
        value={entry.notes}
        onChange={e => onUpdate(index, 'notes', e.target.value)}
        className="h-8 bg-muted/30 border-emerald-500/20 text-xs w-full sm:w-28 shrink-0"
      />

      {/* Remove */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

/* ─── Main Component ─── */
export function StepReferences({
  references, setReferences, riskAcknowledged, setRiskAcknowledged,
  generationMode, setGenerationMode,
}: StepReferencesProps) {
  const [imagesOpen, setImagesOpen] = useState(true);

  const imageRefs = references.filter(r => r.assetType === 'image');
  const videoRefs = references.filter(r => r.assetType === 'video');
  const audioRefs = references.filter(r => r.assetType === 'audio');

  const hasVideoRefs = videoRefs.length > 0;
  const hasAudioRefs = audioRefs.length > 0;

  const filledImages = imageRefs.filter(r => r.url.trim()).length;
  const filledAudio = audioRefs.filter(r => r.url.trim()).length;
  const filledVideo = videoRefs.filter(r => r.url.trim()).length;
  const totalRefs = filledImages + filledAudio + filledVideo;

  const hasAnyNonImageRef = filledAudio > 0 || filledVideo > 0;

  // ─── PHASE4: Mode conflict detection ───
  // Detect if the current references mix frame_mode roles (first_frame/last_frame)
  // with reference_mode roles (everything else). This is not allowed by Seedance 2.0.
  const frameRolesPresent = references.some(r => r.url.trim() && FRAME_MODE_ROLES.has(r.role));
  const referenceRolesPresent = references.some(r => r.url.trim() && !FRAME_MODE_ROLES.has(r.role));
  const modeConflict = frameRolesPresent && referenceRolesPresent;

  // In frame_mode, hide video/audio sections (frame mode only allows first_frame/last_frame images)
  // In reference_mode, hide first_frame/last_frame role options (only show reference-style roles)
  const isFrameMode = generationMode === 'frame_mode';

  // Update a specific reference by its local index within its type group
  const updateRef = useCallback((type: 'image' | 'video' | 'audio', typeIndex: number, field: keyof ReferenceEntry, value: string | boolean | number) => {
    setReferences(prev => {
      const typed = prev.filter(r => r.assetType === type);
      const target = typed[typeIndex];
      if (!target) return prev;
      return prev.map(r => r.id === target.id ? { ...r, [field]: value } : r);
    });
  }, [setReferences]);

  const removeRef = useCallback((type: 'image' | 'video' | 'audio', typeIndex: number) => {
    setReferences(prev => {
      const typed = prev.filter(r => r.assetType === type);
      const target = typed[typeIndex];
      if (!target) return prev;
      return prev.filter(r => r.id !== target.id);
    });
  }, [setReferences]);

  const addRef = useCallback((type: 'image' | 'video' | 'audio') => {
    const max = REFERENCE_LIMITS[type];
    const currentCount = references.filter(r => r.assetType === type).length;
    if (currentCount >= max) return;
    const newRef = createEmptyReference(type, currentCount);
    setReferences(prev => [...prev, newRef]);
  }, [references, setReferences]);

  return (
    <Card className="bg-card border-emerald-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <StepNumber num={2} active completed={totalRefs > 0} />
          References
          <div className="flex gap-1.5 ml-1">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs px-1.5 gap-0.5">📸{filledImages}/9</Badge>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs px-1.5 gap-0.5">🎵{filledAudio}/3</Badge>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs px-1.5 gap-0.5">🎬{filledVideo}/3</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tips */}
        <ReferenceTips />

        {/* ─── PHASE4: Mode conflict warning ─── */}
        {modeConflict && (
          <Alert className="border-red-500/40 bg-red-500/10">
            <AlertTriangle className="text-red-400" />
            <AlertTitle className="text-red-400 text-sm">Seedance mode conflict</AlertTitle>
            <AlertDescription className="text-red-300 text-xs">
              first_frame/last_frame cannot be mixed with reference_image/reference_video/reference_audio.
              {isFrameMode
                ? ' Switch to Reference Mode, or remove the reference-style roles.'
                : ' Switch to Frame Mode, or remove the first_frame/last_frame roles.'}
            </AlertDescription>
          </Alert>
        )}

        {/* ─── PHASE4: Mode-specific hints ─── */}
        {isFrameMode && (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="text-amber-400" />
            <AlertDescription className="text-amber-300 text-xs">
              <strong>Frame Mode active:</strong> Only first_frame / last_frame image roles are allowed.
              Video and audio references are hidden. If last_frame is used, first_frame is also required.
              Storyboard image should use reference mode, not first-frame mode.
            </AlertDescription>
          </Alert>
        )}
        {!isFrameMode && references.some(r => r.url.trim() && FRAME_MODE_ROLES.has(r.role)) && (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="text-amber-400" />
            <AlertDescription className="text-amber-300 text-xs">
              <strong>Reference Mode active:</strong> first_frame / last_frame roles are not allowed in reference mode.
              Switch to Frame Mode to use them, or remove them.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Reference Images (up to 9) ── */}
        <Collapsible open={imagesOpen} onOpenChange={setImagesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">Image References</span>
                <span className="text-xs text-muted-foreground">{filledImages}/9</span>
              </span>
              {imagesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {imageRefs.map((entry, i) => (
              <RefRow key={entry.id} entry={entry} index={i} type="image"
                onUpdate={(idx, field, val) => updateRef('image', idx, field, val)}
                onRemove={(idx) => removeRef('image', idx)}
                generationMode={generationMode}
              />
            ))}
            {imageRefs.length < REFERENCE_LIMITS.image && (
              <Button variant="outline" size="sm" className="w-full border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8"
                onClick={() => addRef('image')}>
                <Plus className="w-3 h-3 mr-1" /> Add Image Reference ({imageRefs.length}/{REFERENCE_LIMITS.image})
              </Button>
            )}
            {filledImages > 0 && (
              <p className="text-xs text-muted-foreground">Image references set subject identity, environment, camera framing, lighting, and scene composition.</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="bg-emerald-500/10" />

        {/* ── Add Video/Audio buttons (always visible if under limit) ── */}
        <div className="flex gap-2 flex-wrap">
          {videoRefs.length < REFERENCE_LIMITS.video && (
            <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
              onClick={() => addRef('video')}>
              <Plus className="w-3 h-3 mr-1" /> Add Video Reference
            </Button>
          )}
          {audioRefs.length < REFERENCE_LIMITS.audio && (
            <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs"
              onClick={() => addRef('audio')}>
              <Plus className="w-3 h-3 mr-1" /> Add Audio Reference
            </Button>
          )}
        </div>

        {/* ── Reference Video (hidden by default, appears when added) ── */}
        {hasVideoRefs && !isFrameMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Video className="w-4 h-4 text-blue-400" /> Video References
                <span className="text-xs text-muted-foreground">{filledVideo}/3</span>
              </span>
              {videoRefs.length < REFERENCE_LIMITS.video && (
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 text-xs h-7"
                  onClick={() => addRef('video')}>
                  <Plus className="w-3 h-3 mr-1" /> Add Video
                </Button>
              )}
            </div>
            {videoRefs.map((entry, i) => (
              <RefRow key={entry.id} entry={entry} index={i} type="video"
                onUpdate={(idx, field, val) => updateRef('video', idx, field, val)}
                onRemove={(idx) => removeRef('video', idx)}
                generationMode={generationMode}
              />
            ))}
            {filledVideo > 0 && (
              <p className="text-xs text-muted-foreground">Video references guide camera movement, pacing, and motion. 9:16 vertical clips recommended, under 15s.</p>
            )}
          </div>
        )}

        {/* ── Reference Audio (hidden by default, appears when added) ── */}
        {hasAudioRefs && !isFrameMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Music className="w-4 h-4 text-purple-400" /> Audio References
                <span className="text-xs text-muted-foreground">{filledAudio}/3</span>
              </span>
              {audioRefs.length < REFERENCE_LIMITS.audio && (
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 text-xs h-7"
                  onClick={() => addRef('audio')}>
                  <Plus className="w-3 h-3 mr-1" /> Add Audio
                </Button>
              )}
            </div>
            {audioRefs.map((entry, i) => (
              <RefRow key={entry.id} entry={entry} index={i} type="audio"
                onUpdate={(idx, field, val) => updateRef('audio', idx, field, val)}
                onRemove={(idx) => removeRef('audio', idx)}
                generationMode={generationMode}
              />
            ))}
            {filledAudio > 0 && (
              <p className="text-xs text-muted-foreground">Audio references guide sound design but may override prompt-driven audio. MP3/WAV/M4A, under 15s total.</p>
            )}
          </div>
        )}

        {/* Risk acknowledgement for any non-image references */}
        {hasAnyNonImageRef && (
          <RiskAckCard id="multi-ref-risk"
            title="Audio/Video references may alter generation output"
            desc="Reference audio and video guide the AI but may override text-driven instructions in your prompt."
            detail="When audio or video references are provided, the model prioritizes matching their characteristics (sound qualities, camera trajectories, motion patterns) over text-based descriptions. This can produce more accurate reproduction but reduces creative flexibility. Multiple references may also introduce artifacts when blended together."
            checked={riskAcknowledged} onCheck={setRiskAcknowledged} />
        )}

        {/* Summary */}
        <SummaryCard filledImages={filledImages} filledAudio={filledAudio} filledVideo={filledVideo} />
      </CardContent>
    </Card>
  );
}
