// src/components/dashboard/reference-manager.tsx
'use client';

import { useState, useCallback } from 'react';
import {
  ImageIcon, Video, Music, Plus, Trash2, Save, ChevronDown, ChevronUp,
  Camera, Sun, Frame, Palette, PawPrint, MapPin, Eye, Mic2, Film,
  Volume2, Link, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  REFERENCE_ROLES, REFERENCE_LIMITS,
  createEmptyReference,
  type ReferenceEntry,
} from './types';

// ─── Role icons ───
const ROLE_ICONS: Record<string, React.ReactNode> = {
  main_identity: <Eye className="w-4 h-4" />,
  mother_animal: <PawPrint className="w-4 h-4" />,
  baby_animal: <PawPrint className="w-4 h-4" />,
  environment: <MapPin className="w-4 h-4" />,
  camera_framing: <Camera className="w-4 h-4" />,
  lighting_mood: <Sun className="w-4 h-4" />,
  first_frame: <Frame className="w-4 h-4" />,
  last_frame: <Frame className="w-4 h-4" />,
  extra_style: <Palette className="w-4 h-4" />,
  video_motion: <Film className="w-4 h-4" />,
  video_pacing: <Film className="w-4 h-4" />,
  video_camera: <Camera className="w-4 h-4" />,
  audio_ambient: <Volume2 className="w-4 h-4" />,
  audio_music: <Music className="w-4 h-4" />,
  audio_voice: <Mic2 className="w-4 h-4" />,
};

interface ReferenceManagerProps {
  references: ReferenceEntry[];
  setReferences: React.Dispatch<React.SetStateAction<ReferenceEntry[]>>;
}

export default function ReferenceManager({ references, setReferences }: ReferenceManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const imageRefs = references.filter(r => r.assetType === 'image');
  const videoRefs = references.filter(r => r.assetType === 'video');
  const audioRefs = references.filter(r => r.assetType === 'audio');

  const hasVideoRefs = videoRefs.length > 0;
  const hasAudioRefs = audioRefs.length > 0;

  const activeImageCount = imageRefs.filter(r => r.url.trim()).length;
  const activeVideoCount = videoRefs.filter(r => r.url.trim()).length;
  const activeAudioCount = audioRefs.filter(r => r.url.trim()).length;

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

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      const assets = references.map(r => ({
        dbId: r.dbId,
        assetType: r.assetType,
        role: r.role,
        url: r.url,
        label: r.label,
        notes: r.notes,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
      }));
      const res = await fetch('/api/reference-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update dbId references from saved data
        if (data.assets) {
          setReferences(prev => {
            return prev.map(ref => {
              const saved = data.assets.find((a: { assetType: string; role: string; sortOrder: number; id: string }) =>
                a.assetType === ref.assetType && a.role === ref.role && a.sortOrder === ref.sortOrder
              );
              if (saved && !ref.dbId) {
                return { ...ref, dbId: saved.id };
              }
              return ref;
            });
          });
        }
        showToast('References saved successfully');
      } else {
        showToast('Failed to save references');
      }
    } catch {
      showToast('Failed to save references');
    } finally {
      setSaving(false);
    }
  }, [references, setReferences, showToast]);

  const loadFromDB = useCallback(async () => {
    try {
      const res = await fetch('/api/reference-assets');
      if (res.ok) {
        const data = await res.json();
        if (data.assets && Array.isArray(data.assets) && data.assets.length > 0) {
          setReferences(data.assets.map((a: { id: string; assetType: string; role: string; url: string; label: string | null; notes: string | null; isActive: boolean; sortOrder: number }) => ({
            id: `${a.assetType}-${a.sortOrder}-${Date.now()}`,
            assetType: a.assetType as 'image' | 'video' | 'audio',
            role: a.role,
            url: a.url,
            label: a.label || '',
            notes: a.notes || '',
            isActive: a.isActive,
            sortOrder: a.sortOrder,
            dbId: a.id,
          })));
          showToast('References loaded from database');
        } else {
          showToast('No saved references found');
        }
      }
    } catch {
      showToast('Failed to load references');
    }
  }, [setReferences, showToast]);

  const renderRefRow = (type: 'image' | 'video' | 'audio', entry: ReferenceEntry, index: number) => {
    const roles = REFERENCE_ROLES[type];
    return (
      <div key={entry.id} className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/30 border border-emerald-500/10">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-emerald-400">{ROLE_ICONS[entry.role] || <Link className="w-4 h-4" />}</span>
          <Select value={entry.role} onValueChange={v => updateRef(type, index, 'role', v)}>
            <SelectTrigger className="w-[160px] h-8 bg-muted/50 border-emerald-500/20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-emerald-500/20">
              {roles.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="https://..."
          value={entry.url}
          onChange={e => updateRef(type, index, 'url', e.target.value)}
          className="h-8 bg-muted/50 border-emerald-500/20 text-xs flex-1"
        />
        <Input
          placeholder="Notes..."
          value={entry.notes}
          onChange={e => updateRef(type, index, 'notes', e.target.value)}
          className="h-8 bg-muted/50 border-emerald-500/20 text-xs w-full sm:w-32"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeRef(type, index)}
          className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  return (
    <Card className="bg-card border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Reference Asset Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-emerald-400 text-xs" onClick={loadFromDB}>
              <RefreshCw className="w-3 h-3 mr-1" /> Reload
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-emerald-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Mode */}
        {!expanded && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-emerald-500/10">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">{activeImageCount} image ref{activeImageCount !== 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-600">({imageRefs.length}/9 slots)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-emerald-500/10">
                <Video className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">{activeVideoCount} video ref{activeVideoCount !== 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-600">({videoRefs.length}/3 slots)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-emerald-500/10">
                <Music className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">{activeAudioCount} audio ref{activeAudioCount !== 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-600">({audioRefs.length}/3 slots)</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {imageRefs.length < REFERENCE_LIMITS.image && (
                <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs" onClick={() => { setExpanded(true); addRef('image'); }}>
                  <Plus className="w-3 h-3 mr-1" /> Add Image Reference
                </Button>
              )}
              {videoRefs.length < REFERENCE_LIMITS.video && (
                <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs" onClick={() => { setExpanded(true); addRef('video'); }}>
                  <Plus className="w-3 h-3 mr-1" /> Add Video Reference
                </Button>
              )}
              {audioRefs.length < REFERENCE_LIMITS.audio && (
                <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs" onClick={() => { setExpanded(true); addRef('audio'); }}>
                  <Plus className="w-3 h-3 mr-1" /> Add Audio Reference
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Expanded Mode */}
        {expanded && (
          <div className="space-y-6">
            {/* Image References */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Image References
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">{imageRefs.length}/9</Badge>
                </h4>
                {imageRefs.length < REFERENCE_LIMITS.image && (
                  <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 text-xs h-7" onClick={() => addRef('image')}>
                    <Plus className="w-3 h-3 mr-1" /> Add Another Image
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {imageRefs.map((entry, i) => renderRefRow('image', entry, i))}
              </div>
            </div>

            {/* Add Video/Audio buttons */}
            <div className="flex gap-2 flex-wrap">
              {videoRefs.length < REFERENCE_LIMITS.video && !hasVideoRefs && (
                <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs" onClick={() => addRef('video')}>
                  <Plus className="w-3 h-3 mr-1" /> Add Video Reference
                </Button>
              )}
              {audioRefs.length < REFERENCE_LIMITS.audio && !hasAudioRefs && (
                <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs" onClick={() => addRef('audio')}>
                  <Plus className="w-3 h-3 mr-1" /> Add Audio Reference
                </Button>
              )}
            </div>

            {hasVideoRefs && (
              <>
                <Separator className="bg-emerald-500/10" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                      <Video className="w-4 h-4" /> Video References
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{videoRefs.length}/3</Badge>
                    </h4>
                    {videoRefs.length < REFERENCE_LIMITS.video && (
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 text-xs h-7" onClick={() => addRef('video')}>
                        <Plus className="w-3 h-3 mr-1" /> Add Another Video
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {videoRefs.map((entry, i) => renderRefRow('video', entry, i))}
                  </div>
                </div>
              </>
            )}

            {hasAudioRefs && (
              <>
                <Separator className="bg-emerald-500/10" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                      <Music className="w-4 h-4" /> Audio References
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">{audioRefs.length}/3</Badge>
                    </h4>
                    {audioRefs.length < REFERENCE_LIMITS.audio && (
                      <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 text-xs h-7" onClick={() => addRef('audio')}>
                        <Plus className="w-3 h-3 mr-1" /> Add Another Audio
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {audioRefs.map((entry, i) => renderRefRow('audio', entry, i))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto" onClick={saveAll} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
                {saving ? 'Saving...' : 'Save All References'}
              </Button>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-sm px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm animate-[slideInRight_0.3s_ease-out]">
            {toastMsg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}