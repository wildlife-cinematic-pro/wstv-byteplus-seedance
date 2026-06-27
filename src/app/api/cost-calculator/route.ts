import { NextResponse } from 'next/server';
import {
  calculateTokens,
  calculateCostUsd,
  convertToJpy,
} from '@/lib/pricing';

// POST /api/cost-calculator — Calculate cost from input params
// DRY RUN / PLANNING MODE — no real paid submissions
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      width,
      height,
      fps = 24,
      durationSeconds,
      videoCount = 1,
      modelId,
      ratePerKTokens,
      exchangeRate = 149.5,
      intelligentMode = false,
      tokenAllowance,
      tokensUsed = 0,
    } = body;

    if (!width || !height || !durationSeconds) {
      return NextResponse.json(
        { error: 'width, height, and durationSeconds are required' },
        { status: 400 }
      );
    }

    if (ratePerKTokens === undefined || ratePerKTokens === null) {
      return NextResponse.json(
        { error: 'ratePerKTokens is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      // Input params echoed
      width,
      height,
      fps,
      durationSeconds,
      videoCount,
      modelId,
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
    return NextResponse.json(
      { error: 'Failed to calculate cost' },
      { status: 500 }
    );
  }
}
