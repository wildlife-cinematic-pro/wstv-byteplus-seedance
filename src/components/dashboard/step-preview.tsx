'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Video, RefreshCw, FolderOpen, FileVideo, Download, Film,
  Play, Pause, Volume2, VolumeX, Maximize, Copy, Check, ExternalLink, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { StatusBadge, CostDisplay, StepShell, StepChip } from './shared';
import type { LatestVideo, ModelType } from './types';

interface StepPreviewProps {
  latestVideo: LatestVideo | null;
  onRefreshVideo: () => void;
  onOpenFolder: () => void;
  dryRunPassed?: boolean;
  hasPaidTask?: boolean;
  modelType?: ModelType;
  resolution?: string;
  duration?: number;
  estimatedCost?: number;
}

function RelativeTime({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const rel = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : new Date(date).toLocaleDateString();
  return <span>{rel}</span>;
}

function EmptyState({ onRefreshVideo, onOpenFolder, dryRunPassed, hasPaidTask }: {
  onRefreshVideo: () => void; onOpenFolder: () => void; dryRunPassed?: boolean; hasPaidTask?: boolean;
}) {
  const steps = [
    { label: 'Complete Dry Run', done: !!dryRunPassed },
    { label: 'Run Simulation', done: !!hasPaidTask },
    { label: 'Wait for Sim Result', done: false },
    { label: 'Preview Here', done: false },
  ];
  return (
    <div className="text-center py-8">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-[oklch(0.15_0.02_155)] border border-emerald-500/20 flex items-center justify-center">
          <Play className="w-8 h-8 text-emerald-400/60" />
        </div>
      </div>
      <p className="text-gray-400 text-sm font-medium mb-1">No generated video yet</p>
      <p className="text-gray-600 text-xs mb-4 max-w-xs mx-auto">Follow these steps to generate your first video</p>
      <div className="flex items-center justify-center gap-1 mb-4 flex-wrap">
        {steps.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className={`text-xs px-2 py-1 rounded-full ${s.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
              {s.done ? '✓' : `${i + 1}.`} {s.label}
            </span>
            {i < steps.length - 1 && <span className="text-gray-600 text-xs">→</span>}
          </span>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={onRefreshVideo} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenFolder} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
          <FolderOpen className="w-3.5 h-3.5 mr-1" /> Open Folder
        </Button>
      </div>
    </div>
  );
}

function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const speeds = [0.5, 1, 1.5, 2];

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const changeSpeed = useCallback((s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
  }, []);

  const goFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen?.();
  }, []);

  const seekTo = useCallback((val: number[]) => {
    const v = videoRef.current;
    if (!v || !videoDuration) return;
    v.currentTime = (val[0] / 100) * videoDuration;
  }, [videoDuration]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setVideoDuration(v.duration);
    const onEnd = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDur);
    v.addEventListener('ended', onEnd);
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onDur); v.removeEventListener('ended', onEnd); };
  }, []);

  const pct = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="relative aspect-[9/16] max-w-xs mx-auto bg-black rounded-lg border border-emerald-500/20 overflow-hidden group"
      onMouseEnter={() => setShowControls(true)} onMouseLeave={() => setShowControls(false)}>
      <video ref={videoRef} src={videoUrl} preload="metadata" className="w-full h-full object-contain" onClick={togglePlay} />
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <Slider value={[pct]} onValueChange={seekTo} max={100} step={0.1} className="mb-1.5 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-emerald-400" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={togglePlay}>
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={toggleMute}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <span className="text-[10px] text-gray-300 w-16 text-center">{formatTime(currentTime)} / {formatTime(videoDuration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex bg-white/10 rounded overflow-hidden">
              {speeds.map(s => (
                <button key={s} onClick={() => changeSpeed(s)} className={`px-1.5 py-0.5 text-[10px] ${speed === s ? 'bg-emerald-500/30 text-emerald-400' : 'text-gray-400 hover:text-white'}`}>{s}x</button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={goFullscreen}>
              <Maximize className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function VideoTimeline({ currentTime, duration }: { currentTime: number; duration: number }) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="relative h-6 bg-[oklch(0.15_0.02_155)] rounded border border-emerald-500/10 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 rounded transition-all duration-200" style={{ width: `${pct}%` }} />
      <div className="absolute top-0 bottom-0 bg-emerald-400 w-0.5 shadow-[0_0_6px_rgba(52,211,153,0.6)] transition-all duration-200" style={{ left: `${pct}%` }} />
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-gray-500">
        <span>0:00</span>
        <span className="text-emerald-400">{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export function StepPreview({
  latestVideo, onRefreshVideo, onOpenFolder,
  dryRunPassed, hasPaidTask, modelType, resolution, duration, estimatedCost,
}: StepPreviewProps) {
  const [copied, setCopied] = useState(false);

  const copyFilename = useCallback(() => {
    if (latestVideo?.videoFileName) {
      navigator.clipboard.writeText(latestVideo.videoFileName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [latestVideo]);

  const handleDownload = useCallback(() => {
    if (latestVideo?.videoUrl) window.open(latestVideo.videoUrl, '_blank');
  }, [latestVideo]);

  return (
    <StepShell
      num={6}
      title="Video Preview"
      value="preview"
      active
      completed={!!latestVideo}
      defaultOpen={false}
      cardClassName="bg-[oklch(0.18_0.03_155)]"
      summary={
        latestVideo
          ? <StepChip>✓ Ready</StepChip>
          : <StepChip tone="muted">No video</StepChip>
      }
    >
        {latestVideo ? (
          <div className="space-y-3">
            {latestVideo.videoUrl ? <VideoPlayer videoUrl={latestVideo.videoUrl} /> : (
              <div className="aspect-[9/16] max-w-xs mx-auto bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center">
                <div className="text-center p-6">
                  <Film className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-emerald-400 font-medium">Video Generated</p>
                  <p className="text-xs text-gray-500 mt-1">{latestVideo.videoFileName}</p>
                </div>
              </div>
            )}

            <VideoTimeline currentTime={0} duration={duration ?? 6} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileVideo className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-300 truncate">{latestVideo.videoFileName}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={copyFilename}>
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  </Button>
                </div>
                <StatusBadge status={latestVideo.taskStatus} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /><RelativeTime date={latestVideo.createdAt} /></span>
                {modelType && <span>Model: {modelType}</span>}
                {resolution && <span>{resolution}</span>}
                {duration && <span>{duration}s</span>}
                {estimatedCost != null && <CostDisplay usd={estimatedCost} cny={estimatedCost * 7.25} size="sm" />}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDownload} disabled={!latestVideo.videoUrl}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </Button>
                <Button variant="outline" size="sm" onClick={onRefreshVideo}
                  className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onOpenFolder} className="flex-1 text-gray-400 hover:text-emerald-400">
                  <FolderOpen className="w-3.5 h-3.5 mr-1" /> Open in Finder
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { if (latestVideo.videoUrl) navigator.clipboard.writeText(latestVideo.videoUrl); }} className="flex-1 text-gray-400 hover:text-emerald-400">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Copy URL
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState onRefreshVideo={onRefreshVideo} onOpenFolder={onOpenFolder} dryRunPassed={dryRunPassed} hasPaidTask={hasPaidTask} />
        )}
    </StepShell>
  );
}
