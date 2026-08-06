import { NextRequest } from 'next/server';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import { costCalculatorSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';
import {
  calculateTokens,
  calculateCostUsd,
  convertToJpy,
} from '@/lib/pricing';

// POST /api/cost-calculator — Calculate cost from input params
// DRY RUN / PLANNING MODE — no real paid submissions
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = costCalculatorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const {
      width,
      height,
      fps,
      durationSeconds,
      videoCount,
      modelId,
      ratePerKTokens,
      exchangeRate,
      intelligentMode,
      tokenAllowance,
      tokensUsed,
    } = data;

    // Calculate estimated tokens
    const estimatedTokens = calculateTokens(
      width,
      height,
      fps,
      durationSeconds,
      videoCount
    );

    // Calculate estimated cost in USD
    const estimatedCostUsd = calculateCostUsd(estimatedTokens, ratePerKTokens);

    // Calculate estimated cost in JPY
    const estimatedCostJpy = convertToJpy(estimatedCostUsd, exchangeRate);

    // Per-video calculations
    const tokensPerVideo = calculateTokens(width, height, fps, durationSeconds, 1);
    const costPerVideo = calculateCostUsd(tokensPerVideo, ratePerKTokens);

    // Budget impact calculation (if tokenAllowance provided)
    let budgetImpact: Record<string, unknown> | null = null;
    if (tokenAllowance !== undefined && tokenAllowance !== null) {
      const tokensRemaining = Math.max(0, tokenAllowance - tokensUsed);
      const canAfford = estimatedTokens <= tokensRemaining;
      const tokensAfterGeneration = tokensRemaining - estimatedTokens;
      const pctOfAllowance = tokenAllowance > 0
        ? (estimatedTokens / tokenAllowance) * 100
        : 0;

      budgetImpact = {
        canAfford,
        tokensRemaining,
        tokensAfterGeneration: Math.max(0, tokensAfterGeneration),
        pctOfAllowance: Math.round(pctOfAllowance * 100) / 100,
        deficit: canAfford ? 0 : Math.abs(tokensAfterGeneration),
      };
    }

    // Intelligent mode warning
    const warningText = intelligentMode
      ? '⚠️ Intelligent mode: Estimated only. Actual consumption may differ based on final generation result, intelligent ratio, intelligent duration, and model behavior.'
      : 'Estimated only. Actual BytePlus consumption may differ depending on final generation result, intelligent ratio, intelligent duration, model behavior, and official billing rules.';

    return privateJson({
      // Input params echoed
      width,
      height,
      fps,
      durationSeconds,
      videoCount,
      modelId: modelId ?? null,
      ratePerKTokens,
      exchangeRate,
      intelligentMode,

      // Calculation results
      estimatedTokens,
      estimatedCostUsd: Math.round(estimatedCostUsd * 10000) / 10000,
      estimatedCostJpy: Math.round(estimatedCostJpy * 100) / 100,
      tokensPerVideo,
      costPerVideo: Math.round(costPerVideo * 10000) / 10000,
      warningText,

      // Budget impact (if applicable)
      budgetImpact,

      // DRY RUN indicator
      dryRun: true,
      message: 'DRY RUN / PLANNING MODE — No real paid submission. This is a local cost calculation only.',
    });
  } catch (error) {
    console.error('[COST_CALCULATOR]', error);
    return privateJson(
      { error: 'Failed to calculate cost' },
      { status: 500 }
    );
  }
}
