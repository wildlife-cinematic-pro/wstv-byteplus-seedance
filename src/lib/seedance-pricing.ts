export const OFFICIAL_SEEDANCE_MODEL_IDS = {
  MAIN: 'dreamina-seedance-2-0-260128',
  FAST: 'dreamina-seedance-2-0-fast-260128',
  MINI: 'dreamina-seedance-2-0-mini-260615',
} as const;

export type OfficialSeedanceModelId = (typeof OFFICIAL_SEEDANCE_MODEL_IDS)[keyof typeof OFFICIAL_SEEDANCE_MODEL_IDS];
export type SeedanceInputMode = 'without_video' | 'with_video';
export type SeedanceResolution = '480p' | '720p' | '1080p' | '4k';

export const OFFICIAL_SEEDANCE_PRICING_USD_PER_M_TOKENS: Record<
  OfficialSeedanceModelId,
  Record<SeedanceInputMode, Partial<Record<SeedanceResolution, number>>>
> = {
  [OFFICIAL_SEEDANCE_MODEL_IDS.MAIN]: {
    without_video: { '480p': 7.0, '720p': 7.0, '1080p': 7.7, '4k': 4.0 },
    with_video: { '480p': 4.3, '720p': 4.3, '1080p': 4.7, '4k': 2.4 },
  },
  [OFFICIAL_SEEDANCE_MODEL_IDS.FAST]: {
    without_video: { '480p': 5.6, '720p': 5.6 },
    with_video: { '480p': 3.3, '720p': 3.3 },
  },
  [OFFICIAL_SEEDANCE_MODEL_IDS.MINI]: {
    without_video: { '480p': 3.5, '720p': 3.5 },
    with_video: { '480p': 2.1, '720p': 2.1 },
  },
};

export const WSTV_DEFAULT_PLANNING_PRESET = {
  outputDurationSec: 15,
  aspectRatio: '9:16',
  width: 720,
  height: 1280,
  fps: 24,
  inputVideoDurationSec: 0,
  inputMode: 'without_video' as SeedanceInputMode,
  planningEstimateOnly: true,
  actualUsageRequiredForFinalBilling: true,
};

export const ACTUAL_CONSOLE_USAGE = {
  totalPlanTokens: 7_000_000,
  usedTokens: 649_800,
  totalCalls: 2,
  averageTokensPerCall: 324_900,
  remainingTokens: 6_350_200,
  estimatedRemainingCalls: 19.5,
  safePlannedRemainingCalls: '17 to 18',
};

export function normalizeSeedancePricingResolution(resolution: string): SeedanceResolution {
  const value = resolution.toLowerCase();
  if (value === '4k') return '4k';
  if (value === '1080p') return '1080p';
  if (value === '480p') return '480p';
  return '720p';
}

export function resolveOfficialSeedanceModelId(modelId?: string | null, modelType?: string | null): OfficialSeedanceModelId {
  if (modelId === OFFICIAL_SEEDANCE_MODEL_IDS.MAIN) return OFFICIAL_SEEDANCE_MODEL_IDS.MAIN;
  if (modelId === OFFICIAL_SEEDANCE_MODEL_IDS.FAST) return OFFICIAL_SEEDANCE_MODEL_IDS.FAST;
  if (modelId === OFFICIAL_SEEDANCE_MODEL_IDS.MINI) return OFFICIAL_SEEDANCE_MODEL_IDS.MINI;
  if (modelType === 'mini') return OFFICIAL_SEEDANCE_MODEL_IDS.MINI;
  return OFFICIAL_SEEDANCE_MODEL_IDS.MAIN;
}

export function getPlanningDimensions(resolution: string, aspectRatio: string): { width: number; height: number } {
  const normalized = normalizeSeedancePricingResolution(resolution);
  const vertical = aspectRatio === '9:16' || aspectRatio === '3:4';
  const square = aspectRatio === '1:1';

  if (normalized === '480p') {
    if (square) return { width: 480, height: 480 };
    return vertical ? { width: 480, height: 854 } : { width: 854, height: 480 };
  }
  if (normalized === '1080p') {
    if (square) return { width: 1080, height: 1080 };
    return vertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
  }
  if (normalized === '4k') {
    if (square) return { width: 2160, height: 2160 };
    return vertical ? { width: 2160, height: 3840 } : { width: 3840, height: 2160 };
  }
  if (square) return { width: 720, height: 720 };
  return vertical ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
}

export function getSeedanceUsdPerMillionTokens(params: {
  modelId: string;
  resolution: string;
  inputMode: SeedanceInputMode;
}): number | null {
  const modelId = resolveOfficialSeedanceModelId(params.modelId);
  const resolution = normalizeSeedancePricingResolution(params.resolution);
  return OFFICIAL_SEEDANCE_PRICING_USD_PER_M_TOKENS[modelId][params.inputMode][resolution] ?? null;
}

export function estimateSeedanceTokens(params: {
  inputVideoDurationSec?: number;
  outputDurationSec: number;
  width: number;
  height: number;
  fps: number;
}): number {
  const inputVideoDurationSec = Math.max(0, params.inputVideoDurationSec ?? 0);
  const outputDurationSec = Math.max(0, params.outputDurationSec);
  return Math.round(((inputVideoDurationSec + outputDurationSec) * params.width * params.height * params.fps) / 1024);
}

export function estimateSeedanceCostUsd(tokens: number, usdPerMillionTokens: number): number {
  return (tokens / 1_000_000) * usdPerMillionTokens;
}

export function estimateSeedancePlanningCost(params: {
  modelId: string;
  resolution: string;
  aspectRatio: string;
  outputDurationSec: number;
  fps?: number;
  inputVideoDurationSec?: number;
  inputMode?: SeedanceInputMode;
}) {
  const modelId = resolveOfficialSeedanceModelId(params.modelId);
  const resolution = normalizeSeedancePricingResolution(params.resolution);
  const inputMode = params.inputMode ?? 'without_video';
  const fps = params.fps ?? WSTV_DEFAULT_PLANNING_PRESET.fps;
  const { width, height } = getPlanningDimensions(resolution, params.aspectRatio);
  const usdPerMillionTokens = getSeedanceUsdPerMillionTokens({ modelId, resolution, inputMode }) ?? 0;
  const estimatedTokens = estimateSeedanceTokens({
    inputVideoDurationSec: params.inputVideoDurationSec ?? 0,
    outputDurationSec: params.outputDurationSec,
    width,
    height,
    fps,
  });
  const estimatedCostUsd = estimateSeedanceCostUsd(estimatedTokens, usdPerMillionTokens);

  return {
    modelId,
    resolution,
    aspectRatio: params.aspectRatio,
    inputMode,
    inputVideoDurationSec: params.inputVideoDurationSec ?? 0,
    outputDurationSec: params.outputDurationSec,
    width,
    height,
    fps,
    estimatedTokens,
    usdPerMillionTokens,
    estimatedCostUsd,
    pricingMode: 'official_token_estimate_only' as const,
    planningEstimateOnly: true,
    actualUsageRequiredForFinalBilling: true,
    note: 'Estimate only. Final billing requires usage.completion_tokens from the real BytePlus API response.',
  };
}
