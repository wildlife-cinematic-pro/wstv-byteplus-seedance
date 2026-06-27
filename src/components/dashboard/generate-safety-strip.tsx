'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, CreditCard, ShieldCheck, ShieldOff, Volume2, WifiOff } from 'lucide-react';
import {
  MODEL_METADATA,
  SEEDANCE_MODEL_IDS,
  WSTV_ACTIVE_PACK,
} from '@/lib/seedance-validation';

interface GenerateSafetyStripProps {
  safeMode: boolean;
  seedanceModelId: string;
  resolution: string;
  duration: number;
  generateAudio: boolean;
}

export function GenerateSafetyStrip({
  safeMode,
  seedanceModelId,
  resolution,
  duration,
  generateAudio,
}: GenerateSafetyStripProps) {
  const modelMeta = MODEL_METADATA[seedanceModelId] ?? MODEL_METADATA[SEEDANCE_MODEL_IDS.STANDARD];
  const durationLabel = duration === -1 ? 'auto' : `${duration}s`;

  return (
    <div className="rounded-md border border-emerald-500/15 bg-[oklch(0.15_0.02_155)] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={safeMode ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}>
          {safeMode ? <ShieldCheck className="w-3 h-3 mr-1" /> : <ShieldOff className="w-3 h-3 mr-1" />}
          Safe Mode {safeMode ? 'ON' : 'OFF'}
        </Badge>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Dry Run Only
        </Badge>
        <Badge variant="outline" className={generateAudio ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}>
          <Volume2 className="w-3 h-3 mr-1" />
          generate_audio={generateAudio ? 'true' : 'false'}
        </Badge>
        <Badge variant="outline" className="border-gray-600/50 text-gray-300 bg-gray-700/20">
          {modelMeta.shortLabel} / {resolution} / {durationLabel}
        </Badge>
        <Badge variant="outline" className="border-blue-500/30 text-blue-300 bg-blue-500/10">
          <CreditCard className="w-3 h-3 mr-1" />
          WSTV Standard pack: {WSTV_ACTIVE_PACK.totalQuota.toLocaleString()} tokens
        </Badge>
        <Badge variant="outline" className="border-red-500/30 text-red-300 bg-red-500/10">
          <WifiOff className="w-3 h-3 mr-1" />
          No real API connected
        </Badge>
      </div>
    </div>
  );
}
