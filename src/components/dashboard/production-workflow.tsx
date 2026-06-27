'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, GitBranch, ShieldCheck, RotateCcw, Plus, Save,
  Baby, CloudLightning, Waves, ShieldAlert, Laugh, Heart,
  Binoculars, PawPrint, TreePine, AlertTriangle, CheckCircle2,
  XCircle, Star, ChevronDown, ChevronUp, Copy, X, Loader2, Clipboard
} from 'lucide-react';
import { StepShell } from './shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type {
  WSTVPresetData, PromptVersionData, GenerationQAData,
  RetryStrategyData,
} from '@/components/dashboard/types';

// ─── Preset icons map ───
const PRESET_ICONS: Record<string, React.ReactNode> = {
  'mother-saves-baby': <Baby className="w-5 h-5" />,
  'baby-learning': <PawPrint className="w-5 h-5" />,
  'storm-survival': <CloudLightning className="w-5 h-5" />,
  'river-rescue': <Waves className="w-5 h-5" />,
  'predator-tension': <ShieldAlert className="w-5 h-5" />,
  'funny-failed-hunt': <Laugh className="w-5 h-5" />,
  'emotional-reunion': <Heart className="w-5 h-5" />,
  'rare-behavior': <Binoculars className="w-5 h-5" />,
};

const DEFAULT_PRESETS: WSTVPresetData[] = [
  { id: '1', name: 'Mother saves baby', icon: 'mother-saves-baby', category: 'Rescue', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'full', defaultResolution: '720p', defaultDuration: 10, defaultFps: 24, animalType: 'Lion', biome: 'Savanna', dangerType: 'Predator', emotionalBeat: 'Protective', sortOrder: 1, isActive: true },
  { id: '2', name: 'Baby learning', icon: 'baby-learning', category: 'Cute', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'mini', defaultResolution: '720p', defaultDuration: 6, defaultFps: 24, animalType: 'Elephant', biome: 'Forest', dangerType: 'None', emotionalBeat: 'Curious', sortOrder: 2, isActive: true },
  { id: '3', name: 'Storm survival', icon: 'storm-survival', category: 'Survival', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'full', defaultResolution: '1080p', defaultDuration: 10, defaultFps: 24, animalType: 'Eagle', biome: 'Mountain', dangerType: 'Weather', emotionalBeat: 'Resilient', sortOrder: 3, isActive: true },
  { id: '4', name: 'River rescue', icon: 'river-rescue', category: 'Rescue', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'full', defaultResolution: '720p', defaultDuration: 10, defaultFps: 24, animalType: 'Deer', biome: 'River', dangerType: 'Drowning', emotionalBeat: 'Desperate', sortOrder: 4, isActive: true },
  { id: '5', name: 'Predator tension', icon: 'predator-tension', category: 'Tension', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'full', defaultResolution: '1080p', defaultDuration: 10, defaultFps: 24, animalType: 'Cheetah', biome: 'Savanna', dangerType: 'Hunt', emotionalBeat: 'Suspense', sortOrder: 5, isActive: true },
  { id: '6', name: 'Funny failed hunt', icon: 'funny-failed-hunt', category: 'Comedy', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'mini', defaultResolution: '720p', defaultDuration: 6, defaultFps: 24, animalType: 'Fox', biome: 'Snow', dangerType: 'None', emotionalBeat: 'Funny', sortOrder: 6, isActive: true },
  { id: '7', name: 'Emotional reunion', icon: 'emotional-reunion', category: 'Emotional', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'full', defaultResolution: '720p', defaultDuration: 10, defaultFps: 24, animalType: 'Penguin', biome: 'Ice', dangerType: 'Separation', emotionalBeat: 'Tearful', sortOrder: 7, isActive: true },
  { id: '8', name: 'Rare behavior', icon: 'rare-behavior', category: 'Documentary', promptTemplate: '', hookTemplate: null, structureNotes: null, safetyRules: null, captionStyle: null, hashtagStyle: null, defaultModel: 'full', defaultResolution: '1080p', defaultDuration: 10, defaultFps: 24, animalType: 'Octopus', biome: 'Ocean', dangerType: 'None', emotionalBeat: 'Awe', sortOrder: 8, isActive: true },
];

// ─── QA toggle check items ───
const REALISM_CHECKS = [
  { key: 'habitatCorrect', label: 'Habitat correct' },
  { key: 'behaviorRealistic', label: 'Behavior realistic' },
  { key: 'movementPossible', label: 'Movement possible' },
  { key: 'scaleCorrect', label: 'Scale correct' },
  { key: 'seasonBelievable', label: 'Season believable' },
  { key: 'predatorPreySafe', label: 'Predator/prey safe' },
  { key: 'babyAgeBelievable', label: 'Baby age believable' },
] as const;

const VIRAL_SUBFACTORS = [
  'Instant danger', 'Emotional clarity', 'Animal readable',
  'Unusual moment', 'Curiosity gap', 'No confusing setup', 'No slow opening',
];

const MOBILE_SUBFACTORS = [
  'Large subject', 'Clear action', 'Readable text',
  'No tiny details', 'Strong contrast', 'Fast hook', 'Vertical framing',
];

const RISK_FACTORS = [
  { key: 'multipleAnimals', label: 'Multiple animals' },
  { key: 'fastMotion', label: 'Fast motion' },
  { key: 'waterPhysics', label: 'Water physics' },
  { key: 'rainStorm', label: 'Rain/storm' },
  { key: 'snow', label: 'Snow' },
  { key: 'furRealism', label: 'Fur realism' },
  { key: 'babyAnimalScale', label: 'Baby animal scale' },
  { key: 'predatorPreyContact', label: 'Predator/prey contact' },
  { key: 'complexRescue', label: 'Complex rescue' },
] as const;

const FAILURE_LIST = [
  { value: 'identity_drift', label: 'Identity Drift' },
  { value: 'wrong_animal', label: 'Wrong Animal' },
  { value: 'bad_anatomy', label: 'Bad Anatomy' },
  { value: 'unreadable_action', label: 'Unreadable Action' },
  { value: 'too_much_violence', label: 'Too Much Violence' },
  { value: 'camera_confusion', label: 'Camera Confusion' },
  { value: 'bad_ending', label: 'Bad Ending' },
  { value: 'wrong_environment', label: 'Wrong Environment' },
  { value: 'storyboard_ignored', label: 'Storyboard Ignored' },
] as const;

const RETRY_FIX_LIST = [
  { value: 'simplify_prompt', label: 'Simplify Prompt' },
  { value: 'reduce_animal_contact', label: 'Reduce Animal Contact' },
  { value: 'strengthen_identity_lock', label: 'Strengthen Identity Lock' },
  { value: 'change_camera_angle', label: 'Change Camera Angle' },
  { value: 'use_master_image_only', label: 'Use Master Image Only' },
  { value: 'use_storyboard_only', label: 'Use Storyboard Only' },
  { value: 'split_10s_5s', label: 'Split into 10s + 5s' },
] as const;

const OUTPUT_RATING_LIST = [
  { value: 1, label: '1 - Unusable', color: 'text-red-400' },
  { value: 2, label: '2 - Bad', color: 'text-red-300' },
  { value: 3, label: '3 - Needs Edit', color: 'text-amber-400' },
  { value: 4, label: '4 - Usable', color: 'text-emerald-400' },
  { value: 5, label: '5 - Strong', color: 'text-emerald-300' },
  { value: 6, label: '6 - Viral Candidate', color: 'text-green-300' },
] as const;

// ─── Main Component ───
export default function ProductionWorkflow() {
  const [activeTab, setActiveTab] = useState('presets');
  const [presets, setPresets] = useState<WSTVPresetData[]>(DEFAULT_PRESETS);
  const [promptVersions, setPromptVersions] = useState<PromptVersionData[]>([]);
  const [qaData, setQaData] = useState<Record<string, boolean | null>>({});
  const [viralScore, setViralScore] = useState(5);
  const [mobileScore, setMobileScore] = useState(5);
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [riskFactors, setRiskFactors] = useState<Record<string, boolean>>({});
  const [outputRating, setOutputRating] = useState(4);
  const [selectedFailures, setSelectedFailures] = useState<Record<string, boolean>>({});
  const [selectedFixes, setSelectedFixes] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // ─── Add Custom Preset modal state ───
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);
  const [newPreset, setNewPreset] = useState({
    name: '',
    category: 'wildlife',
    animalType: '',
    biome: '',
    dangerType: '',
    emotionalBeat: '',
    structureNotes: '',
    promptTemplate: '',
  });

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Fetch presets — API returns a bare array (not wrapped in { presets: [...] })
  useEffect(() => {
    fetch('/api/presets')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (Array.isArray(d) && d.length > 0) setPresets(d);
        else if (d && Array.isArray(d.presets) && d.presets.length > 0) setPresets(d.presets);
      })
      .catch(() => {});
  }, []);

  // Fetch prompt versions
  useEffect(() => {
    fetch('/api/prompt-versions')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.versions) setPromptVersions(d.versions); })
      .catch(() => {});
  }, []);

  // Apply preset — dispatches a global event that the Generate tab can listen
  // for to populate the prompt box. Falls back to a toast if no prompt text.
  const applyPreset = useCallback((p: WSTVPresetData) => {
    if (p.promptTemplate && p.promptTemplate.trim()) {
      // Dispatch custom event with the prompt text — Generate tab listens
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wstv-apply-preset', { detail: { prompt: p.promptTemplate, presetName: p.name } }));
      }
      showToast(`Preset "${p.name}" sent to Generate tab prompt box`);
    } else {
      showToast(`Preset "${p.name}" has no prompt template — use Copy buttons below`);
    }
  }, [showToast]);

  // Copy preset prompt to clipboard
  const copyPresetPrompt = useCallback((p: WSTVPresetData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const text = p.promptTemplate || '';
    if (!text.trim()) {
      showToast(`Preset "${p.name}" has no prompt template`);
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Prompt for "${p.name}" copied to clipboard`);
      }).catch(() => {
        showToast('Failed to copy — clipboard not available');
      });
    } else {
      showToast('Clipboard API not available');
    }
  }, [showToast]);

  // Copy preset idea (name + category + animal + biome + danger + emotion) to clipboard
  const copyPresetIdea = useCallback((p: WSTVPresetData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const lines = [
      `Preset: ${p.name}`,
      `Category: ${p.category}`,
      p.animalType ? `Animal: ${p.animalType}` : null,
      p.biome ? `Biome: ${p.biome}` : null,
      p.dangerType ? `Danger/Tension: ${p.dangerType}` : null,
      p.emotionalBeat ? `Emotional tone: ${p.emotionalBeat}` : null,
      p.structureNotes ? `\nStructure notes:\n${p.structureNotes}` : null,
    ].filter(Boolean);
    const text = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Idea for "${p.name}" copied to clipboard`);
      }).catch(() => {
        showToast('Failed to copy — clipboard not available');
      });
    } else {
      showToast('Clipboard API not available');
    }
  }, [showToast]);

  // Save new custom preset via POST /api/presets
  const handleSavePreset = useCallback(async () => {
    if (!newPreset.name.trim()) {
      showToast('Preset title is required');
      return;
    }
    if (!newPreset.promptTemplate.trim()) {
      showToast('Prompt text is required (or type a placeholder)');
      return;
    }
    setPresetSaving(true);
    try {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPreset.name.trim(),
          icon: '🎬',
          category: newPreset.category || 'wildlife',
          promptTemplate: newPreset.promptTemplate.trim(),
          structureNotes: newPreset.structureNotes || null,
          animalType: newPreset.animalType || null,
          biome: newPreset.biome || null,
          dangerType: newPreset.dangerType || null,
          emotionalBeat: newPreset.emotionalBeat || null,
          sortOrder: presets.length + 1,
          isActive: true,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setPresets(prev => [...prev, created]);
        setNewPreset({
          name: '', category: 'wildlife', animalType: '', biome: '',
          dangerType: '', emotionalBeat: '', structureNotes: '', promptTemplate: '',
        });
        setShowPresetModal(false);
        showToast(`Preset "${created.name}" saved`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Failed to save: ${err?.error ?? res.statusText}`);
      }
    } catch (err) {
      console.error('[SavePreset]', err);
      showToast('Network error while saving preset');
    } finally {
      setPresetSaving(false);
    }
  }, [newPreset, presets.length, showToast]);

  const saveQA = useCallback(async () => {
    try {
      await fetch('/api/generation-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...qaData,
          viralHookScore: viralScore,
          mobileReadabilityScore: mobileScore,
          riskLevel,
          riskFactors,
          outputRating,
        }),
      });
      showToast('QA scores saved');
    } catch {
      showToast('Failed to save QA scores');
    }
  }, [qaData, viralScore, mobileScore, riskLevel, riskFactors, outputRating, showToast]);

  const toggleQA = useCallback((key: string) => {
    setQaData(prev => ({ ...prev, [key]: prev[key] ? !prev[key] : true }));
  }, []);

  const toggleRisk = useCallback((key: string) => {
    setRiskFactors(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleFailure = useCallback((key: string) => {
    setSelectedFailures(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleFix = useCallback((key: string) => {
    setSelectedFixes(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const getVersionBadge = useCallback((v: PromptVersionData) => {
    if (v.isFinal) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Final</Badge>;
    if (v.isRejected) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Rejected</Badge>;
    if (v.performanceNote?.toLowerCase().includes('viral')) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Viral</Badge>;
    if (v.performanceNote) return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Used</Badge>;
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px]">{v.versionLabel}</Badge>;
  }, []);

  const riskColor = riskLevel === 'Low' ? 'text-emerald-400' : riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400';
  const activeRiskCount = Object.values(riskFactors).filter(Boolean).length;
  const calcRiskLevel = activeRiskCount <= 2 ? 'Low' : activeRiskCount <= 5 ? 'Medium' : 'High';

  return (
    <StepShell
      icon={<Sparkles className="w-5 h-5" />}
      title="Production Workflow"
      cardClassName="bg-[oklch(0.18_0.03_155)]"
      bodyClassName=""
    >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[oklch(0.15_0.02_155)] border border-emerald-500/20 mb-4">
            <TabsTrigger value="presets" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <Sparkles className="w-3 h-3" />Presets
            </TabsTrigger>
            <TabsTrigger value="versions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <GitBranch className="w-3 h-3" />Versions
            </TabsTrigger>
            <TabsTrigger value="qa" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <ShieldCheck className="w-3 h-3" />QA Scores
            </TabsTrigger>
            <TabsTrigger value="retry" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <RotateCcw className="w-3 h-3" />Retry
            </TabsTrigger>
          </TabsList>

          {/* ─── Presets Tab ─── */}
          <TabsContent value="presets">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {presets.map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                >
                  {/* Clickable header area — applies preset to Generate prompt */}
                  <button
                    onClick={() => applyPreset(p)}
                    className="w-full text-left"
                    title="Click to send preset prompt to Generate tab"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-emerald-400 group-hover:scale-110 transition-transform">
                        {PRESET_ICONS[p.icon] || <PawPrint className="w-5 h-5" />}
                      </span>
                      <span className="text-sm font-medium text-gray-200">{p.name}</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">{p.category}</Badge>
                        <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-[10px]">{p.animalType || '—'}</Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {p.biome && <span className="text-gray-500">{p.biome}</span>}
                        {p.dangerType && <span className="text-amber-500/70">• {p.dangerType}</span>}
                      </div>
                      <div className="text-gray-500">{p.emotionalBeat}</div>
                      {p.promptTemplate && (
                        <div className="text-[10px] text-gray-600 italic mt-1 line-clamp-2">
                          {p.promptTemplate.substring(0, 80)}{p.promptTemplate.length > 80 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </button>
                  {/* Copy buttons — stopPropagation so they don't trigger applyPreset */}
                  <div className="flex gap-1 mt-2 pt-2 border-t border-emerald-500/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => copyPresetPrompt(p, e)}
                      className="h-6 px-2 text-[10px] text-gray-400 hover:text-emerald-400"
                      title="Copy preset prompt to clipboard"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Prompt
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => copyPresetIdea(p, e)}
                      className="h-6 px-2 text-[10px] text-gray-400 hover:text-emerald-400"
                      title="Copy preset idea (name + animal + biome + emotion) to clipboard"
                    >
                      <Clipboard className="w-3 h-3 mr-1" /> Idea
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowPresetModal(true)}
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Custom Preset
              </Button>
            </div>

            {/* ─── Add Custom Preset Modal ─── */}
            {showPresetModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowPresetModal(false)}>
                <div
                  className="bg-[oklch(0.18_0.03_155)] border border-emerald-500/30 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                      <Plus className="w-5 h-5" /> Add Custom Preset
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowPresetModal(false)} className="text-gray-400 hover:text-gray-200 h-8 w-8 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Save a new preset to your local DB. Persists after refresh. Saved via POST /api/presets.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[10px] text-gray-500">Title *</Label>
                      <Input
                        value={newPreset.name}
                        onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
                        placeholder="e.g., Mountain Lion Rescue"
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Category</Label>
                      <Input
                        value={newPreset.category}
                        onChange={e => setNewPreset({ ...newPreset, category: e.target.value })}
                        placeholder="wildlife, rescue, emotional..."
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Animal</Label>
                      <Input
                        value={newPreset.animalType}
                        onChange={e => setNewPreset({ ...newPreset, animalType: e.target.value })}
                        placeholder="e.g., Lion, Eagle, Bear"
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Environment / Biome</Label>
                      <Input
                        value={newPreset.biome}
                        onChange={e => setNewPreset({ ...newPreset, biome: e.target.value })}
                        placeholder="e.g., Savanna, Forest, Ocean"
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Danger / Tension type</Label>
                      <Input
                        value={newPreset.dangerType}
                        onChange={e => setNewPreset({ ...newPreset, dangerType: e.target.value })}
                        placeholder="e.g., Predator, Storm, Drowning"
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Emotional tone</Label>
                      <Input
                        value={newPreset.emotionalBeat}
                        onChange={e => setNewPreset({ ...newPreset, emotionalBeat: e.target.value })}
                        placeholder="e.g., Protective, Curious, Suspense"
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[10px] text-gray-500">Short notes (structure, timing beats)</Label>
                      <Textarea
                        value={newPreset.structureNotes}
                        onChange={e => setNewPreset({ ...newPreset, structureNotes: e.target.value })}
                        placeholder="e.g., 0-3s hook with instant danger, 3-8s chase, 8-13s development, 13-15s resolve"
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm min-h-16"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[10px] text-gray-500">Prompt text * (optional but recommended)</Label>
                      <Textarea
                        value={newPreset.promptTemplate}
                        onChange={e => setNewPreset({ ...newPreset, promptTemplate: e.target.value })}
                        placeholder="Paste a finished prompt here, or type a placeholder. Clicking the preset card will send this to the Generate tab prompt box."
                        className="bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 text-sm min-h-24 font-mono"
                        style={{ color: '#e5e7eb' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-500/10">
                    <Button variant="ghost" size="sm" onClick={() => setShowPresetModal(false)} className="text-gray-400 hover:text-gray-200">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePreset}
                      disabled={presetSaving || !newPreset.name.trim() || !newPreset.promptTemplate.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                      size="sm"
                    >
                      {presetSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                      {presetSaving ? 'Saving...' : 'Save Preset'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── Prompt Versions Tab ─── */}
          <TabsContent value="versions">
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {promptVersions.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No versions yet. Save your first version below.</div>
              )}
              {promptVersions.map(v => (
                <div key={v.id} className="p-3 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getVersionBadge(v)}
                      <span className="text-sm font-medium text-gray-200">{v.versionLabel}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-emerald-400 h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(v.promptText); showToast('Prompt copied'); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-1">{v.promptText}</p>
                  <div className="flex gap-3 text-[10px]">
                    {v.changeNote && <span className="text-gray-500">Change: {v.changeNote}</span>}
                    {v.performanceNote && <span className="text-emerald-500/70">Perf: {v.performanceNote}</span>}
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4 bg-emerald-500/10" />
            <div className="flex gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Save className="w-3 h-3 mr-1" /> Save Version
              </Button>
            </div>
          </TabsContent>

          {/* ─── QA Scores Tab ─── */}
          <TabsContent value="qa">
            <div className="space-y-6">
              {/* Animal Realism QA */}
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Animal Realism QA
                </h4>
                <div className="space-y-2">
                  {REALISM_CHECKS.map(c => (
                    <div key={c.key} className="flex items-center justify-between">
                      <Label className="text-xs text-gray-300 cursor-pointer">{c.label}</Label>
                      <Switch
                        checked={!!qaData[c.key]}
                        onCheckedChange={() => toggleQA(c.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Viral Hook Score */}
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Viral Hook Score: {viralScore}/10</h4>
                <Slider
                  value={[viralScore]}
                  min={1} max={10} step={1}
                  onValueChange={([v]) => setViralScore(v)}
                  className="mb-3"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {VIRAL_SUBFACTORS.map(f => (
                    <div key={f} className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${viralScore >= 7 ? 'bg-emerald-400' : viralScore >= 4 ? 'bg-amber-400' : 'bg-red-400'}`} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Readability Score */}
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Mobile Readability Score: {mobileScore}/10</h4>
                <Slider
                  value={[mobileScore]}
                  min={1} max={10} step={1}
                  onValueChange={([v]) => setMobileScore(v)}
                  className="mb-3"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {MOBILE_SUBFACTORS.map(f => (
                    <div key={f} className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${mobileScore >= 7 ? 'bg-emerald-400' : mobileScore >= 4 ? 'bg-amber-400' : 'bg-red-400'}`} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Level */}
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-emerald-400">Risk Level</h4>
                  <Badge className={`${calcRiskLevel === 'Low' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : calcRiskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} text-xs`}>
                    {calcRiskLevel} ({activeRiskCount} factors)
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RISK_FACTORS.map(r => (
                    <div key={r.key} className="flex items-center justify-between">
                      <Label className="text-xs text-gray-300 cursor-pointer">{r.label}</Label>
                      <Switch checked={!!riskFactors[r.key]} onCheckedChange={() => toggleRisk(r.key)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Rating */}
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Output Rating</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {OUTPUT_RATING_LIST.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setOutputRating(r.value)}
                      className={`p-2 rounded border text-xs font-medium transition-all ${
                        outputRating === r.value
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-emerald-500/30'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-300">{duplicateWarning}</span>
                </div>
              )}

              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveQA}>
                <Save className="w-4 h-4 mr-2" /> Save QA Scores
              </Button>
            </div>
          </TabsContent>

          {/* ─── Retry Strategy Tab ─── */}
          <TabsContent value="retry">
            <div className="space-y-6">
              {/* Failed Generation Reasons */}
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Failed Generation Reasons</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FAILURE_LIST.map(f => (
                    <div key={f.value} className="flex items-center gap-2">
                      <Switch
                        checked={!!selectedFailures[f.value]}
                        onCheckedChange={() => toggleFailure(f.value)}
                      />
                      <Label className="text-xs text-gray-300 cursor-pointer">{f.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Retry Fixes */}
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Suggested Retry Fixes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RETRY_FIX_LIST.map(f => (
                    <div key={f.value} className="flex items-center gap-2">
                      <Switch
                        checked={!!selectedFixes[f.value]}
                        onCheckedChange={() => toggleFix(f.value)}
                      />
                      <Label className="text-xs text-gray-300 cursor-pointer">{f.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Retry Strategy
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-sm px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm animate-[slideInRight_0.3s_ease-out]">
            {toastMsg}
          </div>
        )}
    </StepShell>
  );
}
