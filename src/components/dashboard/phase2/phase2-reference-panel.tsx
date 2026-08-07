'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowDown, ArrowUp, FileAudio, FileImage, FileVideo, Plus, Trash2 } from 'lucide-react';
import {
  FRAME_MODE_ROLES,
  REFERENCE_LIMITS,
  REFERENCE_ROLES,
  createEmptyReference,
  type GenerationMode,
  type ReferenceEntry,
} from '@/components/dashboard/types';
import { validateSeedanceMediaUri } from '@/lib/seedance-validation';

type MediaType = 'image' | 'video' | 'audio';

interface Props {
  references: ReferenceEntry[];
  setReferences: Dispatch<SetStateAction<ReferenceEntry[]>>;
  generationMode: GenerationMode;
  setGenerationMode: (mode: GenerationMode) => void;
  onChanged?: () => void;
}

const MEDIA = {
  image: { label: 'Image', Icon: FileImage, accept: 'image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif,image/heic,image/heif' },
  video: { label: 'Video', Icon: FileVideo, accept: 'video/mp4,video/quicktime,video/webm' },
  audio: { label: 'Audio', Icon: FileAudio, accept: 'audio/wav,audio/mpeg' },
} as const;

function normalizedSort(refs: ReferenceEntry[]) {
  return refs.map((ref, index) => ({ ...ref, sortOrder: index }));
}

function roleOptions(type: MediaType, mode: GenerationMode) {
  return REFERENCE_ROLES[type].filter(role =>
    mode === 'frame_mode' ? FRAME_MODE_ROLES.has(role.value) : !FRAME_MODE_ROLES.has(role.value)
  );
}

export default function Phase2ReferencePanel({ references, setReferences, generationMode, setGenerationMode, onChanged }: Props) {
  const [announcement, setAnnouncement] = useState('');
  const grouped = useMemo(() => ({
    image: references.filter(ref => ref.assetType === 'image'),
    video: references.filter(ref => ref.assetType === 'video'),
    audio: references.filter(ref => ref.assetType === 'audio'),
  }), [references]);

  const activeUrls = references.filter(ref => ref.url.trim());
  const hasVisual = activeUrls.some(ref => ref.assetType === 'image' || ref.assetType === 'video');
  const hasAudio = activeUrls.some(ref => ref.assetType === 'audio');
  const frameImages = grouped.image.filter(ref => FRAME_MODE_ROLES.has(ref.role));
  const hasFirstFrame = frameImages.some(ref => ref.role === 'first_frame' && ref.url.trim());
  const hasLastFrame = frameImages.some(ref => ref.role === 'last_frame' && ref.url.trim());

  const validationSummary = generationMode === 'frame_mode'
    ? (!hasFirstFrame ? 'Frame Mode requires a first-frame image URI.' : hasLastFrame && !hasFirstFrame ? 'Last frame requires a first frame.' : 'Frame Mode structure is valid.')
    : (hasAudio && !hasVisual ? 'Audio cannot stand alone; add an image or video URI.' : 'Reference Mode structure is valid.');

  const update = (id: string, patch: Partial<ReferenceEntry>) => {
    setReferences(current => current.map(ref => ref.id === id ? { ...ref, ...patch } : ref));
    onChanged?.();
  };

  const add = (type: MediaType) => {
    const current = grouped[type];
    const max = generationMode === 'frame_mode' && type === 'image' ? 2 : REFERENCE_LIMITS[type];
    if (generationMode === 'frame_mode' && type !== 'image') return;
    if (current.length >= max) return;
    const entry = createEmptyReference(type, current.length);
    if (generationMode === 'frame_mode') entry.role = current.length === 0 ? 'first_frame' : 'last_frame';
    setReferences(prev => normalizedSort([...prev, entry]));
    setAnnouncement(`${MEDIA[type].label} reference added. ${current.length + 1} of ${max}.`);
    onChanged?.();
  };

  const remove = (id: string, type: MediaType) => {
    setReferences(prev => normalizedSort(prev.filter(ref => ref.id !== id)));
    setAnnouncement(`${MEDIA[type].label} reference removed.`);
    onChanged?.();
  };

  const move = (id: string, direction: -1 | 1, type: MediaType) => {
    setReferences(prev => {
      const positions = prev.map((ref, index) => ({ ref, index })).filter(item => item.ref.assetType === type);
      const localIndex = positions.findIndex(item => item.ref.id === id);
      const targetLocal = localIndex + direction;
      if (localIndex < 0 || targetLocal < 0 || targetLocal >= positions.length) return prev;
      const from = positions[localIndex].index;
      const to = positions[targetLocal].index;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return normalizedSort(next);
    });
    setAnnouncement(`${MEDIA[type].label} reference moved ${direction < 0 ? 'up' : 'down'}.`);
    onChanged?.();
  };

  const switchMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setAnnouncement(mode === 'frame_mode' ? 'Frame Mode selected.' : 'Reference Mode selected.');
    onChanged?.();
  };

  const renderGroup = (type: MediaType) => {
    const config = MEDIA[type];
    const rows = grouped[type];
    const max = generationMode === 'frame_mode' && type === 'image' ? 2 : REFERENCE_LIMITS[type];
    const disabledByMode = generationMode === 'frame_mode' && type !== 'image';

    return (
      <section className="rounded-xl border border-slate-800 bg-slate-950/35 p-4" aria-labelledby={`phase2-${type}-heading`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <config.Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            <h3 id={`phase2-${type}-heading`} className="font-medium text-slate-200">{config.label} references</h3>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/5 px-2 py-0.5 text-xs text-emerald-200">{rows.length}/{max}</span>
          </div>
          <button
            type="button"
            onClick={() => add(type)}
            disabled={disabledByMode || rows.length >= max}
            aria-describedby={disabledByMode ? `phase2-${type}-disabled` : undefined}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-emerald-500/30 px-3 text-sm text-emerald-200 hover:bg-emerald-500/5 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add {config.label}
          </button>
        </div>
        {disabledByMode && <p id={`phase2-${type}-disabled`} className="mt-2 text-xs text-slate-500">Disabled in Frame Mode. Only first/last-frame images are allowed.</p>}

        <div className="mt-3 space-y-3">
          {rows.length === 0 && !disabledByMode && <p className="rounded-lg border border-dashed border-slate-800 p-3 text-sm text-slate-500">No {config.label.toLowerCase()} references added.</p>}
          {rows.map((entry, index) => {
            const validation = entry.url.trim() ? validateSeedanceMediaUri(type, entry.url.trim()) : null;
            const options = roleOptions(type, generationMode);
            return (
              <div key={entry.id} className="rounded-xl border border-slate-800 bg-[#0d1210] p-3">
                <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_150px_auto]">
                  <label className="space-y-1.5 text-xs text-slate-400">
                    <span>Role</span>
                    <select
                      value={entry.role}
                      onChange={event => update(entry.id, { role: event.target.value })}
                      className="min-h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100"
                    >
                      {options.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </label>

                  <div className="space-y-1.5">
                    <label htmlFor={`${entry.id}-url`} className="text-xs text-slate-400">Provider-ready URI</label>
                    <input
                      id={`${entry.id}-url`}
                      type="url"
                      value={entry.url}
                      onChange={event => update(entry.id, { url: event.target.value })}
                      placeholder="https://… or asset://…"
                      className="min-h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-700"
                    />
                    <p className={`text-xs ${validation ? (validation.valid ? 'text-emerald-400' : 'text-amber-300') : 'text-slate-600'}`}>
                      {validation ? (validation.valid ? 'URI format accepted for dry-run validation.' : validation.error) : 'URI is required before this row is included in the dry-run payload.'}
                    </p>
                  </div>

                  <label className="space-y-1.5 text-xs text-slate-400">
                    <span>Local file</span>
                    <input
                      type="file"
                      accept={config.accept}
                      onChange={event => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        update(entry.id, { label: file.name });
                        setAnnouncement(`${file.name} selected locally. It is not uploaded or sent to a provider.`);
                      }}
                      className="block min-h-10 w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-800 file:px-2 file:py-2 file:text-xs file:text-slate-200"
                    />
                    {entry.label && <p className="truncate text-xs text-slate-500" title={entry.label}>{entry.label} · local metadata only</p>}
                  </label>

                  <div className="flex items-end gap-1">
                    <button type="button" aria-label={`Move ${config.label} reference up`} disabled={index === 0} onClick={() => move(entry.id, -1, type)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-800 text-slate-400 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Move ${config.label} reference down`} disabled={index === rows.length - 1} onClick={() => move(entry.id, 1, type)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-800 text-slate-400 disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Remove ${config.label} reference`} onClick={() => remove(entry.id, type)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/5"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                  </div>
                </div>
                <label className="mt-3 block space-y-1.5 text-xs text-slate-400">
                  <span>Notes</span>
                  <input value={entry.notes} onChange={event => update(entry.id, { notes: event.target.value })} placeholder="Optional planning note" className="min-h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100" />
                </label>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <section className="rounded-2xl border border-slate-900 bg-[#0d1210] p-5" aria-labelledby="phase2-references-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">Step 2</p>
          <h2 id="phase2-references-heading" className="mt-1 text-xl font-semibold">References</h2>
          <p className="mt-1 text-sm text-slate-500">Production-shaped reference planning using existing ASTV typed reference entries.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Reference counters">
          <span className="rounded-full border border-emerald-500/25 px-2.5 py-1 text-xs text-emerald-200">Image {grouped.image.length}/{generationMode === 'frame_mode' ? 2 : 9}</span>
          <span className="rounded-full border border-slate-800 px-2.5 py-1 text-xs text-slate-400">Video {grouped.video.length}/3</span>
          <span className="rounded-full border border-slate-800 px-2.5 py-1 text-xs text-slate-400">Audio {grouped.audio.length}/3</span>
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1" role="group" aria-label="Generation mode">
        <button type="button" aria-pressed={generationMode === 'reference_mode'} onClick={() => switchMode('reference_mode')} className={`min-h-10 rounded-lg px-4 text-sm ${generationMode === 'reference_mode' ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-500'}`}>Reference Mode</button>
        <button type="button" aria-pressed={generationMode === 'frame_mode'} onClick={() => switchMode('frame_mode')} className={`min-h-10 rounded-lg px-4 text-sm ${generationMode === 'frame_mode' ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-500'}`}>Frame Mode</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {generationMode === 'reference_mode'
          ? 'Reference Mode supports up to 9 images, 3 videos and 3 audio references. Audio cannot be used alone.'
          : 'Frame Mode supports exactly one first-frame image and an optional last-frame image; video/audio controls are disabled.'}
      </p>

      <div className="mt-4 space-y-4">
        {renderGroup('image')}
        {renderGroup('video')}
        {renderGroup('audio')}
      </div>

      <div className={`mt-4 rounded-xl border p-3 text-sm ${validationSummary.includes('valid') ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200' : 'border-amber-500/20 bg-amber-500/5 text-amber-200'}`} role="status" aria-live="polite">
        {validationSummary}
      </div>
      <p className="mt-2 text-xs text-slate-600">Local file selection records filename metadata only. Phase 2 does not upload files, call a provider, or persist browser state.</p>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </section>
  );
}
