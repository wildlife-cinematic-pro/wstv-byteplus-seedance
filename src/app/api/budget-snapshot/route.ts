import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import {
  calculateBudgetSnapshot,
  type BudgetSnapshot,
} from '@/lib/pricing';

// GET /api/budget-snapshot — Calculate and return the full budget snapshot
export async function GET() {
  try {
    // 1. Find the active SubscriptionPurchase
    const activePurchase = await db.subscriptionPurchase.findFirst({
      where: { status: 'active' },
      orderBy: { purchaseDate: 'desc' },
    });

    if (!activePurchase) {
      return NextResponse.json({
        activePurchaseId: null,
        planName: 'No Active Subscription',
        priceUsd: 0,
        tokenAllowance: 0,
        tokensUsed: 0,
        tokensRemaining: 0,
        usdRemaining: 0,
        purchaseDate: '',
        expiryDate: '',
        daysSincePurchase: 0,
        daysUntilExpiry: 0,
        totalDays: 0,
        elapsedPct: 0,
        dailyTokenPace: 0,
        dailyUsdPace: 0,
        monthlyUsdPace: 0,
        safeDailyTokenBudget: 0,
        safeDailyUsdBudget: 0,
        estimatedVideosRemaining10s: 0,
        estimatedVideosRemaining12s: 0,
        estimatedVideosRemaining15s: 0,
        estimatedVideosRemaining15s1080: 0,
        // Extended capacity grid (3 resolutions × 3 durations) — zero values
        estimatedCapacity720p10s:  { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: false, pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity720p12s:  { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: false, pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity720p15s:  { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: false, pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity1080p10s: { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: false, pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity1080p12s: { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: false, pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity1080p15s: { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: false, pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity4k10s:    { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: true,  pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity4k12s:    { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: true,  pricingNote: 'no active plan', rateSource: 'none' },
        estimatedCapacity4k15s:    { tokensPerVideo: 0, videosRemaining: 0, costUsdPerVideo: 0, costJpyPerVideo: 0, isEstimated: true,  pricingNote: 'no active plan', rateSource: 'none' },
        paceWarning: false,
        budgetBadge: 'green' as const,
        today: new Date().toISOString().split('T')[0],
        isExpired: false,
      } satisfies BudgetSnapshot);
    }

    // 2. Find the default PricingModel for rate info
    const defaultPricingModel = await db.pricingModel.findFirst({
      where: { status: 'active', modelId: 'dreamina-seedance-2-0-260128' },
    });

    // Fallback: any active pricing model
    const fallbackPricingModel = defaultPricingModel ?? await db.pricingModel.findFirst({
      where: { status: 'active' },
    });

    const defaultModelRate = fallbackPricingModel?.rate720p ?? 0.007;
    const defaultModelRate1080 = fallbackPricingModel?.rate1080p ?? 0.0077;
    const defaultModelRate4k = fallbackPricingModel?.rate4k && fallbackPricingModel.rate4k > 0
      ? fallbackPricingModel.rate4k
      : undefined;

    // 3. Calculate total tokensUsed from UsageRecord entries linked to this purchase
    const usageRecords = await db.usageRecord.findMany({
      where: { purchaseId: activePurchase.id },
      select: { actualTokens: true, estimatedTokens: true },
    });

    const calculatedTokensUsed = usageRecords.reduce((sum, r) => {
      return sum + (r.actualTokens ?? r.estimatedTokens ?? 0);
    }, 0);

    // Use the greater of: purchase.tokensUsed or calculated from records
    const tokensUsed = Math.max(activePurchase.tokensUsed, calculatedTokensUsed);

    // 4. Get exchange rate
    const exchangeRateSetting = await db.exchangeRateSetting.findFirst({
      where: { fromCurrency: 'USD', toCurrency: 'JPY' },
    });
    const exchangeRate = exchangeRateSetting?.rate ?? 149.5;

    // 5. Use calculateBudgetSnapshot() to return the full snapshot
    const snapshot = calculateBudgetSnapshot({
      purchase: {
        id: activePurchase.id,
        planName: activePurchase.planName,
        priceUsd: activePurchase.priceUsd,
        tokenAllowance: activePurchase.tokenAllowance,
        tokensUsed,
        purchaseDate: activePurchase.purchaseDate.toISOString(),
        expiryDate: activePurchase.expiryDate.toISOString(),
      },
      defaultModelRate,
      defaultModelRate1080,
      defaultModelRate4k,
      exchangeRate,
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('[BUDGET_SNAPSHOT]', error);
    return NextResponse.json(
      { error: 'Failed to calculate budget snapshot' },
      { status: 500 }
    );
  }
}
