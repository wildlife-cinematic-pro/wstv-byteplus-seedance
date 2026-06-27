'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Film, ImageIcon, Type, Globe, DollarSign, BarChart3, Save, CheckCircle2,
  ClipboardCheck, Eye, AlertTriangle, TrendingUp, TrendingDown, Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── CapCut checklist items ───
const CAPCUT_STEPS = [
  { key: 'rawDownloaded', label: 'Raw downloaded' },
  { key: 'bestClipSelected', label: 'Best clip selected' },
  { key: 'trimmed', label: 'Trimmed' },
  { key: 'coverFrameSelected', label: 'Cover frame selected' },
  { key: 'colorAdjusted', label: 'Color adjusted' },
  { key: 'soundChecked', label: 'Sound checked' },
  { key: 'captionAdded', label: 'Caption added' },
  { key: 'exported1080p', label: 'Exported 1080p' },
  { key: 'uploadedToFacebook', label: 'Uploaded to Facebook' },
  { key: 'performanceReviewed', label: 'Performance reviewed' },
] as const;

const OUTPUT_RATING_LIST = [
  { value: 1, label: '1 - Unusable' },
  { value: 2, label: '2 - Bad' },
  { value: 3, label: '3 - Needs Edit' },
  { value: 4, label: '4 - Usable' },
  { value: 5, label: '5 - Strong' },
  { value: 6, label: '6 - Viral Candidate' },
] as const;

export default function PostProduction() {
  const [activeTab, setActiveTab] = useState('capcut');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // CapCut state
  const [capcutSteps, setCapcutSteps] = useState<Record<string, boolean>>({});

  // Cover Frame state
  const [coverTimestamp, setCoverTimestamp] = useState('');
  const [coverEmotion, setCoverEmotion] = useState('');
  const [coverChecks, setCoverChecks] = useState<Record<string, boolean>>({});
  const [coverNotes, setCoverNotes] = useState('');

  // Caption state
  const [captionText, setCaptionText] = useState('');
  const [hashtags, setHashtags] = useState('');

  // Browser Generation state
  const [browserModel, setBrowserModel] = useState('');
  const [browserPrompt, setBrowserPrompt] = useState('');
  const [browserRefImages, setBrowserRefImages] = useState('');
  const [browserEstCost, setBrowserEstCost] = useState('');
  const [browserActualCost, setBrowserActualCost] = useState('');
  const [browserOutputRating, setBrowserOutputRating] = useState(4);
  const [browserVideoFile, setBrowserVideoFile] = useState('');
  const [browserCapcutStatus, setBrowserCapcutStatus] = useState('');
  const [browserPostedUrl, setBrowserPostedUrl] = useState('');

  // Cost state
  const [plannedCost, setPlannedCost] = useState('');
  const [generationCost, setGenerationCost] = useState('');
  const [failedGenCost, setFailedGenCost] = useState('');
  const [retryCost, setRetryCost] = useState('');
  const [finalVideoCost, setFinalVideoCost] = useState('');

  // Performance state
  const [views, setViews] = useState('');
  const [retention3s, setRetention3s] = useState('');
  const [avgWatchTime, setAvgWatchTime] = useState('');
  const [shares, setShares] = useState('');
  const [comments, setComments] = useState('');
  const [saves, setSaves] = useState('');
  const [negativeComments, setNegativeComments] = useState('');
  const [bestComment, setBestComment] = useState('');
  const [reasonWorked, setReasonWorked] = useState('');
  const [reasonFailed, setReasonFailed] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Fetch existing data
  useEffect(() => {
    fetch('/api/post-production')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (d.capcutSteps) setCapcutSteps(d.capcutSteps);
        if (d.coverTimestamp) setCoverTimestamp(d.coverTimestamp);
        if (d.coverEmotion) setCoverEmotion(d.coverEmotion);
      })
      .catch(() => {});
  }, []);

  // CapCut completion
  const capcutCompleted = CAPCUT_STEPS.filter(s => capcutSteps[s.key]).length;
  const capcutPct = (capcutCompleted / CAPCUT_STEPS.length) * 100;

  // Caption checks
  const captionUnder150 = captionText.length <= 150;
  const captionAmericanEnglish = /^[A-Za-z0-9\s!?',.:"\-#@&()]+$/.test(captionText) || captionText.length === 0;
  const hasEmotionalWords = /\b(amazing|incredible|heartbreaking|shocking|unbelievable|wow|must|never|insane|miracle|rescue|survival)\b/i.test(captionText);
  const noClickbaitLie = !/\b(you won't believe what happens|fake|lie|scam)\b/i.test(captionText);

  // Hashtag checks
  const hashtagList = hashtags.split(/\s+/).filter(h => h.startsWith('#'));
  const hashtagCount = hashtagList.length;
  const exactly5 = hashtagCount === 5;
  const noRepeatedSets = true; // Simplified check

  // Cost calculations
  const totalCost = useMemo(() => {
    const p = parseFloat(plannedCost) || 0;
    const g = parseFloat(generationCost) || 0;
    const f = parseFloat(failedGenCost) || 0;
    const r = parseFloat(retryCost) || 0;
    const v = parseFloat(finalVideoCost) || 0;
    return { planned: p, generation: g, failed: f, retry: r, final: v, total: p + g + f + r + v };
  }, [plannedCost, generationCost, failedGenCost, retryCost, finalVideoCost]);

  const costEfficiency = totalCost.total > 0 && totalCost.final > 0
    ? ((totalCost.final / totalCost.total) * 100).toFixed(1)
    : '0';

  const toggleCapcutStep = useCallback((key: string) => {
    setCapcutSteps(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleCoverCheck = useCallback((key: string) => {
    setCoverChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const savePostProduction = useCallback(async () => {
    try {
      await fetch('/api/post-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capcutSteps,
          coverTimestamp,
          coverEmotion,
          coverChecks,
          coverNotes,
          captionText,
          hashtags,
          browserModel,
          browserPrompt,
          browserRefImages,
          browserEstCost,
          browserActualCost,
          browserOutputRating,
          browserVideoFile,
          browserCapcutStatus,
          browserPostedUrl,
          plannedCost: totalCost.planned,
          generationCost: totalCost.generation,
          failedGenerationCost: totalCost.failed,
          retryCost: totalCost.retry,
          finalUsableVideoCost: totalCost.final,
        }),
      });
      showToast('Post-production data saved');
    } catch {
      showToast('Failed to save');
    }
  }, [capcutSteps, coverTimestamp, coverEmotion, coverChecks, coverNotes, captionText, hashtags, browserModel, browserPrompt, browserRefImages, browserEstCost, browserActualCost, browserOutputRating, browserVideoFile, browserCapcutStatus, browserPostedUrl, totalCost, showToast]);

  const savePerformance = useCallback(async () => {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          views: parseInt(views) || null,
          threeSecRetention: parseFloat(retention3s) || null,
          avgWatchTime: parseFloat(avgWatchTime) || null,
          shares: parseInt(shares) || null,
          comments: parseInt(comments) || null,
          saves: parseInt(saves) || null,
          negativeComments: parseInt(negativeComments) || null,
          bestComment,
          reasonWorked,
          reasonFailed,
        }),
      });
      showToast('Performance data saved');
    } catch {
      showToast('Failed to save performance');
    }
  }, [views, retention3s, avgWatchTime, shares, comments, saves, negativeComments, bestComment, reasonWorked, reasonFailed, showToast]);

  return (
    <Card className="bg-[oklch(0.18_0.03_155)] border-emerald-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-emerald-400 flex items-center gap-2">
          <Film className="w-5 h-5" /> Post-Production Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[oklch(0.15_0.02_155)] border border-emerald-500/20 mb-4 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="capcut" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <ClipboardCheck className="w-3 h-3" />CapCut
            </TabsTrigger>
            <TabsTrigger value="cover" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <ImageIcon className="w-3 h-3" />Cover
            </TabsTrigger>
            <TabsTrigger value="caption" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <Type className="w-3 h-3" />Caption
            </TabsTrigger>
            <TabsTrigger value="browser" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <Globe className="w-3 h-3" />Browser
            </TabsTrigger>
            <TabsTrigger value="cost" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <DollarSign className="w-3 h-3" />Cost
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400 text-xs gap-1">
              <BarChart3 className="w-3 h-3" />Performance
            </TabsTrigger>
          </TabsList>

          {/* ─── CapCut Editing Tracker ─── */}
          <TabsContent value="capcut">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-emerald-400">CapCut Editing Checklist</h4>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">{capcutCompleted}/{CAPCUT_STEPS.length}</Badge>
                </div>
                <Progress value={capcutPct} className="h-2 mb-4 bg-gray-800 [&>div]:bg-emerald-500" />
                <div className="space-y-2">
                  {CAPCUT_STEPS.map(step => (
                    <div key={step.key} className="flex items-center justify-between">
                      <Label className="text-xs text-gray-300 cursor-pointer flex items-center gap-2">
                        {capcutSteps[step.key] && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {step.label}
                      </Label>
                      <Switch checked={!!capcutSteps[step.key]} onCheckedChange={() => toggleCapcutStep(step.key)} />
                    </div>
                  ))}
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePostProduction}>
                <Save className="w-4 h-4 mr-2" /> Save CapCut Progress
              </Button>
            </div>
          </TabsContent>

          {/* ─── Cover Frame Planner ─── */}
          <TabsContent value="cover">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Cover Frame Planner</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label className="text-xs text-gray-400">Cover Timestamp</Label>
                    <Input
                      placeholder="e.g., 2.4s"
                      value={coverTimestamp}
                      onChange={e => setCoverTimestamp(e.target.value)}
                      className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Cover Emotion</Label>
                    <Input
                      placeholder="e.g., Fear, Joy, Tension"
                      value={coverEmotion}
                      onChange={e => setCoverEmotion(e.target.value)}
                      className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1"
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {[
                    { key: 'animalFaceVisible', label: 'Animal face visible' },
                    { key: 'dangerVisible', label: 'Danger visible' },
                    { key: 'noBlur', label: 'No blur' },
                    { key: 'strongThumbnail', label: 'Strong thumbnail' },
                  ].map(c => (
                    <div key={c.key} className="flex items-center justify-between">
                      <Label className="text-xs text-gray-300 cursor-pointer">{c.label}</Label>
                      <Switch checked={!!coverChecks[c.key]} onCheckedChange={() => toggleCoverCheck(c.key)} />
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Notes</Label>
                  <Textarea
                    placeholder="Cover frame notes..."
                    value={coverNotes}
                    onChange={e => setCoverNotes(e.target.value)}
                    className="bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1 min-h-[60px]"
                  />
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePostProduction}>
                <Save className="w-4 h-4 mr-2" /> Save Cover Frame
              </Button>
            </div>
          </TabsContent>

          {/* ─── Caption & Hashtag QA ─── */}
          <TabsContent value="caption">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Caption & Hashtag QA</h4>

                <div className="mb-4">
                  <Label className="text-xs text-gray-400">Caption Text</Label>
                  <Textarea
                    placeholder="Write your caption here..."
                    value={captionText}
                    onChange={e => setCaptionText(e.target.value)}
                    className="bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1 min-h-[80px]"
                  />
                </div>

                {/* Live caption checks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border ${captionUnder150 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                    {captionUnder150 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    Under 150 chars ({captionText.length})
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border ${captionAmericanEnglish ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                    {captionAmericanEnglish ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    American English
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border ${hasEmotionalWords ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                    {hasEmotionalWords ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    Emotionally strong
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border ${noClickbaitLie ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                    {noClickbaitLie ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    No clickbait lie
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="text-xs text-gray-400">Hashtags</Label>
                  <Input
                    placeholder="#wildlife #rescue #animals ..."
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1"
                  />
                </div>

                {/* Hashtag checks */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border ${exactly5 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                    {exactly5 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    Exactly 5 ({hashtagCount})
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    USA-relevant
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border ${noRepeatedSets ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                    {noRepeatedSets ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    No repeated sets
                  </div>
                </div>

                {/* Preview card */}
                <div className="p-3 rounded-lg bg-[oklch(0.13_0.02_155)] border border-emerald-500/10">
                  <p className="text-xs text-gray-400 mb-1">Preview</p>
                  <p className="text-sm text-gray-200">{captionText || 'Your caption will appear here...'}</p>
                  <p className="text-xs text-emerald-400/70 mt-1">{hashtags || '#hashtags'}</p>
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePostProduction}>
                <Save className="w-4 h-4 mr-2" /> Save Caption & Hashtags
              </Button>
            </div>
          </TabsContent>

          {/* ─── Browser Generation Tracker ─── */}
          <TabsContent value="browser">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Manual Browser Generation Tracker</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400">Browser Model Used</Label>
                    <Input placeholder="e.g., Seedance 2.0" value={browserModel} onChange={e => setBrowserModel(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Prompt Used</Label>
                    <Input placeholder="Prompt..." value={browserPrompt} onChange={e => setBrowserPrompt(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Ref Images</Label>
                    <Input placeholder="Number or URLs" value={browserRefImages} onChange={e => setBrowserRefImages(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Estimated Cost</Label>
                    <Input placeholder="$0.00" value={browserEstCost} onChange={e => setBrowserEstCost(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Actual Cost</Label>
                    <Input placeholder="$0.00" value={browserActualCost} onChange={e => setBrowserActualCost(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Output Rating</Label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {OUTPUT_RATING_LIST.map(r => (
                        <button key={r.value} onClick={() => setBrowserOutputRating(r.value)}
                          className={`p-1.5 rounded border text-[10px] transition-all ${browserOutputRating === r.value ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-emerald-500/30'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Video File Name</Label>
                    <Input placeholder="filename.mp4" value={browserVideoFile} onChange={e => setBrowserVideoFile(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">CapCut Edit Status</Label>
                    <Input placeholder="e.g., In progress, Done" value={browserCapcutStatus} onChange={e => setBrowserCapcutStatus(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-gray-400">Posted URL</Label>
                    <Input placeholder="https://facebook.com/..." value={browserPostedUrl} onChange={e => setBrowserPostedUrl(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePostProduction}>
                <Save className="w-4 h-4 mr-2" /> Save Browser Generation Data
              </Button>
            </div>
          </TabsContent>

          {/* ─── Cost Per Posted Video ─── */}
          <TabsContent value="cost">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Cost Per Posted Video</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label className="text-xs text-gray-400">Planned Cost</Label>
                    <Input placeholder="$0.00" value={plannedCost} onChange={e => setPlannedCost(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Generation Cost</Label>
                    <Input placeholder="$0.00" value={generationCost} onChange={e => setGenerationCost(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Failed Generation Cost</Label>
                    <Input placeholder="$0.00" value={failedGenCost} onChange={e => setFailedGenCost(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Retry Cost</Label>
                    <Input placeholder="$0.00" value={retryCost} onChange={e => setRetryCost(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Final Usable Video Cost</Label>
                    <Input placeholder="$0.00" value={finalVideoCost} onChange={e => setFinalVideoCost(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="p-3 rounded-lg bg-[oklch(0.13_0.02_155)] border border-emerald-500/10">
                  <h5 className="text-xs text-gray-400 mb-2">Cost Breakdown</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Planned:</span><span className="text-gray-300">${totalCost.planned.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Generation:</span><span className="text-gray-300">${totalCost.generation.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Failed:</span><span className="text-red-400">${totalCost.failed.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Retry:</span><span className="text-amber-400">${totalCost.retry.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Final:</span><span className="text-emerald-400">${totalCost.final.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400 font-medium">Total:</span><span className="text-emerald-400 font-bold">${totalCost.total.toFixed(2)}</span></div>
                  </div>
                  <Separator className="my-2 bg-emerald-500/10" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Cost Efficiency (final / total attempts):</span>
                    <span className={`font-medium ${parseFloat(costEfficiency) >= 50 ? 'text-emerald-400' : parseFloat(costEfficiency) >= 25 ? 'text-amber-400' : 'text-red-400'}`}>{costEfficiency}%</span>
                  </div>
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePostProduction}>
                <Save className="w-4 h-4 mr-2" /> Save Cost Data
              </Button>
            </div>
          </TabsContent>

          {/* ─── Performance Tracker ─── */}
          <TabsContent value="performance">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-400 mb-3">Performance Tracker</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label className="text-xs text-gray-400">Views</Label>
                    <Input placeholder="0" value={views} onChange={e => setViews(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">3-Sec Retention %</Label>
                    <Input placeholder="0%" value={retention3s} onChange={e => setRetention3s(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Avg Watch Time (sec)</Label>
                    <Input placeholder="0" value={avgWatchTime} onChange={e => setAvgWatchTime(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Shares</Label>
                    <Input placeholder="0" value={shares} onChange={e => setShares(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Comments</Label>
                    <Input placeholder="0" value={comments} onChange={e => setComments(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Saves</Label>
                    <Input placeholder="0" value={saves} onChange={e => setSaves(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Negative Comments</Label>
                    <Input placeholder="0" value={negativeComments} onChange={e => setNegativeComments(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-gray-400">Best Comment</Label>
                    <Input placeholder="Best comment..." value={bestComment} onChange={e => setBestComment(e.target.value)} className="h-8 bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Reason It Worked</Label>
                    <Textarea placeholder="What made this video successful..." value={reasonWorked} onChange={e => setReasonWorked(e.target.value)} className="bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1 min-h-[60px]" />
                  </div>
                  <div>
                    <Label className="text-xs text-red-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Reason It Failed</Label>
                    <Textarea placeholder="What went wrong..." value={reasonFailed} onChange={e => setReasonFailed(e.target.value)} className="bg-[oklch(0.13_0.02_155)] border-emerald-500/20 text-xs mt-1 min-h-[60px]" />
                  </div>
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePerformance}>
                <Save className="w-4 h-4 mr-2" /> Save Performance Data
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
      </CardContent>
    </Card>
  );
}
