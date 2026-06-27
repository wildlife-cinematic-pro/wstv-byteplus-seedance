/**
 * WSTV Seedance Pricing Calculation Engine
 * 
 * Token formula: tokens = (width * height * frameRate * durationSeconds * videoCount) / 1024
 * Cost formula: costUsd = (tokens / 1000) * usdPerKTokens
 * 
 * Important: In intelligent ratio/duration mode, exact tokens/cost cannot be guaranteed
 * before generation. All pre-generation values must be labeled as "estimated".
 */

// ─── Resolution dimension maps ───

export const RESOLUTION_DIMS: Record<string, { w: number; h: number; label: string }> = {
  '480p': { w: 854, h: 480, label: '480p (854×480)' },
  '720p_v': { w: 720, h: 1280, label: '720p Vertical (720×1280)' },
  '720p': { w: 1280, h: 720, label: '720p Landscape (1280×720)' },
  '1080p_v': { w: 1080, h: 1920, label: '1080p Vertical (1080×1920)' },
  '1080p': { w: 1920, h: 1080, label: '1080p Landscape (1920×1080)' },
  '4K': { w: 3840, h: 2160, label: '4K (3840×2160)' },
};

// WSTV-specific resolution shortcuts
export const WSTV_RESOLUTIONS = {
  vertical_720: { w: 720, h: 1280, label: '9:16 Vertical 720p' },
  vertical_1080: { w: 1080, h: 1920, label: '9:16 Vertical 1080p' },
  landscape_720: { w: 1280, h: 720, label: '16:9 Landscape 720p' },
};

// ─── FPS options ───

export const FPS_OPTIONS = [12, 16, 24, 25, 30];

// ─── WSTV Presets ───

export interface WSTVPreset {
  id: string;
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  modelId: string;
  modelName: string;
  ratePerKTokens: number;
  description: string;
  icon: string;
}

export const WSTV_PRESETS: WSTVPreset[] = [
  {
    id: 'wstv-final-reel',
    name: 'WSTV Final Reel',
    aspectRatio: '9:16',
    width: 720,
    height: 1280,
    duration: 15,
    fps: 24,
    modelId: 'dreamina-seedance-2-0-260128',
    modelName: 'Seedance 2.0',
    ratePerKTokens: 0.007,
    description: 'Standard WSTV vertical reel for final production',
    icon: '🎬',
  },
  {
    id: 'wstv-mini-test',
    name: 'WSTV Mini Test',
    aspectRatio: '9:16',
    width: 720,
    height: 1280,
    duration: 8,
    fps: 24,
    modelId: 'seedance-2.0-mini',
    modelName: 'Seedance 2.0 Mini',
    ratePerKTokens: 0.0035,
    description: 'Quick test generation with Mini model, 8-10 seconds',
    icon: '🧪',
  },
  {
    id: 'wstv-1080p-final',
    name: 'WSTV 1080p Final',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    duration: 15,
    fps: 24,
    modelId: 'dreamina-seedance-2-0-260128',
    modelName: 'Seedance 2.0',
    ratePerKTokens: 0.0077,
    description: 'High quality 1080p vertical reel for final production',
    icon: '✨',
  },
];

// ─── Core calculation functions ───

export function calculateTokens(
  width: number,
  height: number,
  frameRate: number,
  durationSeconds: number,
  videoCount: number = 1
): number {
  return Math.round((width * height * frameRate * durationSeconds * videoCount) / 1024);
}

export function calculateCostUsd(tokens: number, usdPerKTokens: number): number {
  return (tokens / 1000) * usdPerKTokens;
}

export function convertToJpy(usd: number, exchangeRate: number): number {
  return usd * exchangeRate;
}

// ─── Full estimation result ───

export interface CostEstimation {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  videoCount: number;
  modelId: string;
  modelName: string;
  ratePerKTokens: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
  estimatedCostJpy: number;
  exchangeRate: number;
  costPerVideo: number;
  tokensPerVideo: number;
  intelligentMode: boolean;
  warningText: string;
}

export function estimateFullCost(params: {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  videoCount?: number;
  modelId: string;
  modelName: string;
  ratePerKTokens: number;
  exchangeRate?: number;
  intelligentMode?: boolean;
}): CostEstimation {
  const videoCount = params.videoCount ?? 1;
  const exchangeRate = params.exchangeRate ?? 149.5;
  const intelligentMode = params.intelligentMode ?? false;

  const estimatedTokens = calculateTokens(
    params.width, params.height, params.fps, params.durationSeconds, videoCount
  );
  const estimatedCostUsd = calculateCostUsd(estimatedTokens, params.ratePerKTokens);
  const estimatedCostJpy = convertToJpy(estimatedCostUsd, exchangeRate);
  const tokensPerVideo = calculateTokens(
    params.width, params.height, params.fps, params.durationSeconds, 1
  );
  const costPerVideo = calculateCostUsd(tokensPerVideo, params.ratePerKTokens);

  return {
    width: params.width,
    height: params.height,
    fps: params.fps,
    durationSeconds: params.durationSeconds,
    videoCount,
    modelId: params.modelId,
    modelName: params.modelName,
    ratePerKTokens: params.ratePerKTokens,
    estimatedTokens,
    estimatedCostUsd,
    estimatedCostJpy,
    exchangeRate,
    costPerVideo,
    tokensPerVideo,
    intelligentMode,
    warningText: intelligentMode
      ? '⚠️ Intelligent mode: Estimated only. Actual consumption may differ based on final generation result, intelligent ratio, intelligent duration, and model behavior.'
      : 'Estimated only. Actual BytePlus consumption may differ depending on final generation result, intelligent ratio, intelligent duration, model behavior, and official billing rules.',
  };
}

// ─── Budget / remaining capacity calculation ───

export interface BudgetSnapshot {
  activePurchaseId: string | null;
  planName: string;
  priceUsd: number;
  tokenAllowance: number;
  tokensUsed: number;
  tokensRemaining: number;
  usdRemaining: number;
  purchaseDate: string;
  expiryDate: string;
  daysSincePurchase: number;
  daysUntilExpiry: number;
  totalDays: number;
  elapsedPct: number;
  dailyTokenPace: number;
  dailyUsdPace: number;
  monthlyUsdPace: number;
  safeDailyTokenBudget: number;
  safeDailyUsdBudget: number;
  estimatedVideosRemaining10s: number;
  estimatedVideosRemaining12s: number;
  estimatedVideosRemaining15s: number;
  estimatedVideosRemaining15s1080: number;
  // ─── Extended capacity grid: 3 resolutions × 3 durations ───
  // Each entry stores tokens-per-video, remaining video count, USD cost per
  // video, JPY cost per video (if exchange rate available), whether the
  // pricing is estimated/configurable, and a human-readable pricing note.
  estimatedCapacity720p10s: CapacityEntry;
  estimatedCapacity720p12s: CapacityEntry;
  estimatedCapacity720p15s: CapacityEntry;
  estimatedCapacity1080p10s: CapacityEntry;
  estimatedCapacity1080p12s: CapacityEntry;
  estimatedCapacity1080p15s: CapacityEntry;
  estimatedCapacity4k10s: CapacityEntry;
  estimatedCapacity4k12s: CapacityEntry;
  estimatedCapacity4k15s: CapacityEntry;
  paceWarning: boolean;
  budgetBadge: 'green' | 'yellow' | 'red';
  today: string;
  isExpired: boolean;
}

/** Single capacity entry — used in the Remaining Video Capacity grid. */
export interface CapacityEntry {
  tokensPerVideo: number;
  videosRemaining: number;
  costUsdPerVideo: number;
  costJpyPerVideo: number | null;
  isEstimated: boolean;
  pricingNote: string;
  rateSource: string;
}

export function calculateBudgetSnapshot(params: {
  purchase: {
    id: string;
    planName: string;
    priceUsd: number;
    tokenAllowance: number;
    tokensUsed: number;
    purchaseDate: string;
    expiryDate: string;
  };
  defaultModelRate: number; // USD per 1K tokens for 720p vertical
  defaultModelRate1080: number;
  defaultModelRate4k?: number; // USD per 1K tokens for 4K vertical (optional — may be unverified)
  exchangeRate?: number;
}): BudgetSnapshot {
  const { purchase, defaultModelRate, defaultModelRate1080, defaultModelRate4k, exchangeRate } = params;
  const now = new Date();
  const purchaseDate = new Date(purchase.purchaseDate);
  const expiryDate = new Date(purchase.expiryDate);
  
  const tokensRemaining = Math.max(0, purchase.tokenAllowance - purchase.tokensUsed);
  const usdPerToken = purchase.priceUsd / purchase.tokenAllowance;
  const usdRemaining = tokensRemaining * usdPerToken;
  
  const daysSincePurchase = Math.max(0, Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.max(1, Math.ceil((expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedPct = Math.min(100, (daysSincePurchase / totalDays) * 100);
  
  const dailyTokenPace = daysSincePurchase > 0 ? purchase.tokensUsed / daysSincePurchase : 0;
  const dailyUsdPace = dailyTokenPace * usdPerToken;
  const monthlyUsdPace = dailyUsdPace * 30;
  
  const safeDailyTokenBudget = daysUntilExpiry > 0 ? tokensRemaining / daysUntilExpiry : 0;
  const safeDailyUsdBudget = safeDailyTokenBudget * usdPerToken;
  
  // Estimate remaining videos — legacy 4-field set (kept for backward compat)
  const tokens10s = calculateTokens(720, 1280, 24, 10, 1);
  const tokens12s = calculateTokens(720, 1280, 24, 12, 1);
  const tokens15s = calculateTokens(720, 1280, 24, 15, 1);
  const tokens15s1080 = calculateTokens(1080, 1920, 24, 15, 1);

  const estimatedVideosRemaining10s = tokens10s > 0 ? Math.floor(tokensRemaining / tokens10s) : 0;
  const estimatedVideosRemaining12s = tokens12s > 0 ? Math.floor(tokensRemaining / tokens12s) : 0;
  const estimatedVideosRemaining15s = tokens15s > 0 ? Math.floor(tokensRemaining / tokens15s) : 0;
  const estimatedVideosRemaining15s1080 = tokens15s1080 > 0 ? Math.floor(tokensRemaining / tokens15s1080) : 0;

  // ─── Extended capacity grid: 3 resolutions × 3 durations ───
  // Formula: tokens = (width × height × fps × duration) / 1024
  // For 9:16 vertical (default WSTV orientation):
  //   720p  → 720 × 1280
  //   1080p → 1080 × 1920
  //   4K    → 2160 × 3840
  //
  // Cost per video = (tokensPerVideo / 1000) × ratePerKTokens
  //   - 720p  uses defaultModelRate
  //   - 1080p uses defaultModelRate1080
  //   - 4K    uses defaultModelRate4k if provided, else falls back to
  //           defaultModelRate1080 × 1.5 (rough estimate) and isEstimated=true
  const capacity = (w: number, h: number, dur: number, ratePerK: number, opts?: { isEstimated?: boolean; pricingNote?: string; rateSource?: string }): CapacityEntry => {
    const tpv = calculateTokens(w, h, 24, dur, 1);
    const costUsd = (tpv / 1000) * ratePerK;
    const costJpy = exchangeRate != null ? costUsd * exchangeRate : null;
    return {
      tokensPerVideo: tpv,
      videosRemaining: tpv > 0 ? Math.floor(tokensRemaining / tpv) : 0,
      costUsdPerVideo: costUsd,
      costJpyPerVideo: costJpy,
      isEstimated: opts?.isEstimated ?? false,
      pricingNote: opts?.pricingNote ?? 'local manual estimate',
      rateSource: opts?.rateSource ?? 'PricingModel DB',
    };
  };

  // 4K rate handling: if the pricing model has rate4k > 0, use it directly.
  // Otherwise, fall back to 1.5× the 1080p rate as a rough estimate and mark
  // it as estimated/configurable so the user knows to verify.
  const hasVerified4kRate = (defaultModelRate4k ?? 0) > 0;
  const estimated4kRate = hasVerified4kRate
    ? (defaultModelRate4k as number)
    : defaultModelRate1080 * 1.5;
  const note4k = hasVerified4kRate
    ? '4K rate from PricingModel DB'
    : '4K estimate — configurable (verify in Pricing & Plans)';

  const estimatedCapacity720p10s  = capacity(720,  1280, 10, defaultModelRate,     { rateSource: 'PricingModel.rate720p' });
  const estimatedCapacity720p12s  = capacity(720,  1280, 12, defaultModelRate,     { rateSource: 'PricingModel.rate720p' });
  const estimatedCapacity720p15s  = capacity(720,  1280, 15, defaultModelRate,     { rateSource: 'PricingModel.rate720p' });
  const estimatedCapacity1080p10s = capacity(1080, 1920, 10, defaultModelRate1080, { rateSource: 'PricingModel.rate1080p' });
  const estimatedCapacity1080p12s = capacity(1080, 1920, 12, defaultModelRate1080, { rateSource: 'PricingModel.rate1080p' });
  const estimatedCapacity1080p15s = capacity(1080, 1920, 15, defaultModelRate1080, { rateSource: 'PricingModel.rate1080p' });
  const estimatedCapacity4k10s    = capacity(2160, 3840, 10, estimated4kRate,      { isEstimated: !hasVerified4kRate, pricingNote: note4k, rateSource: hasVerified4kRate ? 'PricingModel.rate4k' : 'estimated (1.5× 1080p)' });
  const estimatedCapacity4k12s    = capacity(2160, 3840, 12, estimated4kRate,      { isEstimated: !hasVerified4kRate, pricingNote: note4k, rateSource: hasVerified4kRate ? 'PricingModel.rate4k' : 'estimated (1.5× 1080p)' });
  const estimatedCapacity4k15s    = capacity(2160, 3840, 15, estimated4kRate,      { isEstimated: !hasVerified4kRate, pricingNote: note4k, rateSource: hasVerified4kRate ? 'PricingModel.rate4k' : 'estimated (1.5× 1080p)' });
  
  // Check if pace exceeds remaining budget
  const projectedTotalTokens = dailyTokenPace * totalDays;
  const paceWarning = projectedTotalTokens > purchase.tokenAllowance;
  
  // Budget badge
  const usedPct = (purchase.tokensUsed / purchase.tokenAllowance) * 100;
  const budgetBadge: 'green' | 'yellow' | 'red' = usedPct >= 90 ? 'red' : usedPct >= 70 ? 'yellow' : 'green';
  
  const isExpired = now > expiryDate;
  
  return {
    activePurchaseId: purchase.id,
    planName: purchase.planName,
    priceUsd: purchase.priceUsd,
    tokenAllowance: purchase.tokenAllowance,
    tokensUsed: purchase.tokensUsed,
    tokensRemaining,
    usdRemaining,
    purchaseDate: purchase.purchaseDate,
    expiryDate: purchase.expiryDate,
    daysSincePurchase,
    daysUntilExpiry,
    totalDays,
    elapsedPct,
    dailyTokenPace,
    dailyUsdPace,
    monthlyUsdPace,
    safeDailyTokenBudget,
    safeDailyUsdBudget,
    estimatedVideosRemaining10s,
    estimatedVideosRemaining12s,
    estimatedVideosRemaining15s,
    estimatedVideosRemaining15s1080,
    estimatedCapacity720p10s,
    estimatedCapacity720p12s,
    estimatedCapacity720p15s,
    estimatedCapacity1080p10s,
    estimatedCapacity1080p12s,
    estimatedCapacity1080p15s,
    estimatedCapacity4k10s,
    estimatedCapacity4k12s,
    estimatedCapacity4k15s,
    paceWarning,
    budgetBadge,
    today: now.toISOString().split('T')[0],
    isExpired,
  };
}

// ─── Resolution lookup by aspect ratio ───

export function getResolutionDims(resolution: string, aspectRatio: string): { w: number; h: number } {
  // For WSTV vertical 9:16
  if (aspectRatio === '9:16') {
    switch (resolution) {
      case '480p': return { w: 480, h: 854 };
      case '720p': return { w: 720, h: 1280 };
      case '1080p': return { w: 1080, h: 1920 };
      case '4K': return { w: 2160, h: 3840 };
      default: return { w: 720, h: 1280 };
    }
  }
  // For landscape 16:9
  if (aspectRatio === '16:9') {
    switch (resolution) {
      case '480p': return { w: 854, h: 480 };
      case '720p': return { w: 1280, h: 720 };
      case '1080p': return { w: 1920, h: 1080 };
      case '4K': return { w: 3840, h: 2160 };
      default: return { w: 1280, h: 720 };
    }
  }
  // For 1:1
  if (aspectRatio === '1:1') {
    switch (resolution) {
      case '480p': return { w: 480, h: 480 };
      case '720p': return { w: 720, h: 720 };
      case '1080p': return { w: 1080, h: 1080 };
      case '4K': return { w: 2160, h: 2160 };
      default: return { w: 720, h: 720 };
    }
  }
  return { w: 720, h: 1280 };
}

// ─── Model rate lookup ───

export function getRateForResolution(rates: { rate480p: number; rate720p: number; rate1080p: number; rate4k: number }, resolution: string, aspectRatio: string): number {
  // For vertical 9:16, 720p uses the 720p rate
  switch (resolution) {
    case '480p': return rates.rate480p;
    case '720p': return rates.rate720p;
    case '1080p': return rates.rate1080p;
    case '4K': return rates.rate4k;
    default: return rates.rate720p;
  }
}
