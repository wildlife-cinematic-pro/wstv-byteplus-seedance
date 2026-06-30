'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Video, RefreshCw, FolderOpen, FileVideo, Download, Film,
  Play, Copy, Check, ExternalLink, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        <div className="absolute inset-2 rounded-full bg-muted/50 border border-emerald-500/20 flex items-center justify-center">
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
  const [error, setError] = useState(false);
  const [usingProxy, setUsingProxy] = useState(false);

  // A URL is "remote" when it points to a different origin than the app
  // (e.g. a BytePlus / CDN signed URL). Same-origin /api/video URLs are
  // served directly with range support and never need the proxy.
  const isRemote = useMemo(() => {
    try {
      const u = new URL(videoUrl, window.location.origin);
      return u.origin !== window.location.origin;
    } catch {
      return false;
    }
  }, [videoUrl]);

  // Try the direct URL first; if a remote URL fails to load (CORS, expired
  // signature, auth), retry once through the server-side proxy.
  const src = usingProxy && isRemote
    ? `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`
    : videoUrl;

  const handleError = useCallback(() => {
    if (!usingProxy && isRemote) {
      // First failure on a remote URL — retry through the proxy.
      setUsingProxy(true);
      setError(false);
      return;
    }
    setError(true);
  }, [usingProxy, isRemote]);

  if (error) {
    return (
      <div className="aspect-[9/16] max-h-[70vh] max-w-xs mx-auto bg-black rounded-lg border border-red-500/20 flex items-center justify-center">
        <div className="text-center p-6">
          <Film className="w-10 h-10 text-red-400/70 mx-auto mb-3" />
          <p className="text-sm text-red-400 font-medium">Preview failed</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">The video could not be loaded in the player.</p>
          <a href={videoUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
            <ExternalLink className="w-3.5 h-3.5" /> Open video link instead
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[9/16] max-h-[70vh] max-w-xs mx-auto bg-black rounded-lg border border-emerald-500/20 overflow-hidden">
      <video
        key={src}
        src={src}
        controls
        playsInline
        preload="metadata"
        onError={handleError}
        className="w-full h-full object-contain"
      />
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
    <div className="relative h-6 bg-muted/50 rounded border border-emerald-500/10 overflow-hidden">
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
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderMsg, setFinderMsg] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const copyFilename = useCallback(() => {
    if (latestVideo?.videoFileName) {
      navigator.clipboard.writeText(latestVideo.videoFileName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [latestVideo]);

  const handleDownload = useCallback(() => {
    if (!latestVideo?.videoUrl) return;
    const fileName = latestVideo.videoFileName || 'video.mp4';

    // Build a download URL that forces a real file save:
    // - same-origin /api/video?name=... → append &download=1 (server sets
    //   Content-Disposition: attachment with the real .mp4 name)
    // - remote / signed URL → stream through /api/video-proxy with download=1
    let downloadUrl: string;
    try {
      const u = new URL(latestVideo.videoUrl, window.location.origin);
      if (u.origin === window.location.origin) {
        u.searchParams.set('download', '1');
        downloadUrl = u.toString();
      } else {
        const proxy = new URL('/api/video-proxy', window.location.origin);
        proxy.searchParams.set('url', latestVideo.videoUrl);
        proxy.searchParams.set('download', '1');
        proxy.searchParams.set('filename', fileName);
        downloadUrl = proxy.toString();
      }
    } catch {
      downloadUrl = latestVideo.videoUrl;
    }

    // Trigger a real browser download via a temporary anchor.
    try {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // Fallback: open the URL in a new tab.
      window.open(downloadUrl, '_blank', 'noopener');
    }
  }, [latestVideo]);

  const handleOpenFinder = useCallback(async () => {
    if (finderLoading) return;
    setFinderLoading(true);
    setFinderMsg(null);
    try {
      const res = await fetch('/api/open-video-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: latestVideo?.videoFileName || null }),
      });
      const data = await res.json().catch(() => null) as
        | { success?: boolean; copied?: boolean; folder?: string; error?: string }
        | null;
      if (res.ok && data?.success) {
        setFinderMsg({
          text: data.copied ? 'Saved to collection — folder opened' : 'Collection folder opened',
          tone: 'success',
        });
      } else {
        setFinderMsg({ text: 'Could not open folder. Check local folder path.', tone: 'error' });
      }
    } catch {
      setFinderMsg({ text: 'Could not open folder. Check local folder path.', tone: 'error' });
    } finally {
      setFinderLoading(false);
      setTimeout(() => setFinderMsg(null), 4000);
    }
  }, [finderLoading, latestVideo]);

  return (
    <StepShell
      num={6}
      title="Video Preview"
      value="preview"
      active
      completed={!!latestVideo}
      defaultOpen={false}
      section="generate"
      summary={
        latestVideo
          ? <StepChip>✓ Ready</StepChip>
          : <StepChip tone="muted">No video</StepChip>
      }
    >
        {latestVideo ? (
          <div className="space-y-3">
            {latestVideo.videoUrl ? <VideoPlayer key={latestVideo.videoUrl} videoUrl={latestVideo.videoUrl} /> : (
              <div className="aspect-[9/16] max-h-[70vh] max-w-xs mx-auto bg-black rounded-lg border border-amber-500/20 flex items-center justify-center">
                <div className="text-center p-6">
                  <Film className="w-10 h-10 text-amber-400/70 mx-auto mb-3" />
                  <p className="text-sm text-amber-400 font-medium">No preview URL available</p>
                  <p className="text-xs text-gray-500 mt-1">Video generated but no playable URL was stored.</p>
                  <p className="text-xs text-gray-600 mt-2 break-all">{latestVideo.videoFileName}</p>
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
                <Button variant="ghost" size="sm" onClick={handleOpenFinder} disabled={finderLoading}
                  className="flex-1 text-gray-400 hover:text-emerald-400">
                  <FolderOpen className="w-3.5 h-3.5 mr-1" /> {finderLoading ? 'Opening…' : 'Open in Finder'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { if (latestVideo.videoUrl) navigator.clipboard.writeText(latestVideo.videoUrl); }} className="flex-1 text-gray-400 hover:text-emerald-400">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Copy URL
                </Button>
              </div>
              {finderMsg && (
                <div className={`flex items-center gap-1.5 text-xs px-1 ${finderMsg.tone === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {finderMsg.tone === 'success' ? <Check className="w-3 h-3 shrink-0" /> : <FolderOpen className="w-3 h-3 shrink-0" />}
                  <span>{finderMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState onRefreshVideo={onRefreshVideo} onOpenFolder={onOpenFolder} dryRunPassed={dryRunPassed} hasPaidTask={hasPaidTask} />
        )}
    </StepShell>
  );
}
