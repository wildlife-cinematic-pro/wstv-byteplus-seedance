import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic rendering — this route reads/writes the DB and must never be cached.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toSafeNumber(value: unknown, fallback = 0): number {
  const parsed = parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * POST /api/cost-summary
 *
 * Persists the user's monthly budget limit to the BudgetSetting table.
 *
 * Canonical Prisma field: `monthlyLimit` (see prisma/schema.prisma).
 * Legacy alias `monthlyBudgetUsd` is still accepted for backward compatibility,
 * but the database column is always `monthlyLimit`.
 *
 * Response shape (on success):
 *   { success: true, budget: { monthlyLimit, spentThisMonth, currency, alertThreshold, ... } }
 *
 * The returned `budget` reflects the actual row in the database after the
 * write, so the client can update its UI directly without a follow-up GET.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Accept either canonical `monthlyLimit` or legacy `monthlyBudgetUsd`.
    const rawLimit = toSafeNumber(
      (body as any)?.monthlyLimit ?? (body as any)?.monthlyBudgetUsd,
      50
    );
    const safeMonthlyLimit = rawLimit > 0 ? rawLimit : 50;

    // Persist to DB. Unlike the previous implementation, we DO NOT swallow
    // errors silently — if Prisma fails (e.g. schema mismatch), we return a
    // 500 so the client knows the save did not land.
    let saved: { monthlyLimit: number; spentThisMonth: number; currency: string; alertThreshold: number };

    const existing = await db.budgetSetting.findFirst();

    if (existing) {
      const updated = await db.budgetSetting.update({
        where: { id: existing.id },
        data: { monthlyLimit: safeMonthlyLimit },
      });
      saved = {
        monthlyLimit: updated.monthlyLimit,
        spentThisMonth: updated.spentThisMonth,
        currency: updated.currency,
        alertThreshold: updated.alertThreshold,
      };
    } else {
      const created = await db.budgetSetting.create({
        data: {
          monthlyLimit: safeMonthlyLimit,
          spentThisMonth: 0,
          currency: 'USD',
          alertThreshold: 0.8,
        },
      });
      saved = {
        monthlyLimit: created.monthlyLimit,
        spentThisMonth: created.spentThisMonth,
        currency: created.currency,
        alertThreshold: created.alertThreshold,
      };
    }

    return NextResponse.json(
      {
        success: true,
        budget: {
          ...saved,
          label: 'Estimated Spend',
          safeModeNote: 'Dry-run estimate only. No real charge.',
        },
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Cost summary POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save budget setting',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}

/**
 * GET /api/cost-summary
 *
 * Returns the current budget + spend summary. Reads directly from the DB on
 * every request (force-dynamic + no-store headers), so a fresh save is
 * immediately visible to the next GET.
 */
export async function GET() {
  try {
    let budgetSetting: {
      id: string;
      monthlyLimit: number;
      spentThisMonth: number;
      currency: string;
      alertThreshold: number;
    } | null = null;

    try {
      budgetSetting = await db.budgetSetting.findFirst();
    } catch (e) {
      console.warn('budgetSetting table might not exist or is empty', e);
    }

    let costLedger: Array<{
      id: string;
      modelType: string;
      resolution: string;
      duration: number;
      costUsd: number;
      description: string | null;
      createdAt: Date;
    }> = [];

    try {
      costLedger = await db.costLedger.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('costLedger table might not exist or is empty', e);
    }

    const monthlyLimitRaw = toSafeNumber(budgetSetting?.monthlyLimit, 50);
    const monthlyLimit = monthlyLimitRaw > 0 ? monthlyLimitRaw : 50;

    const ledger = Array.isArray(costLedger) ? costLedger : [];

    const estimatedSpendThisMonth = ledger.reduce((sum, entry) => {
      const cost = toSafeNumber(entry?.costUsd, 0);
      return sum + cost;
    }, 0);

    const actualSpendThisMonth = 0; // no actuals tracked in dry-run mode
    const spentThisMonth = estimatedSpendThisMonth + actualSpendThisMonth;
    const remainingBudget = Math.max(0, monthlyLimit - spentThisMonth);
    const usagePercent =
      monthlyLimit > 0 ? (spentThisMonth / monthlyLimit) * 100 : 0;

    return NextResponse.json(
      {
        budget: {
          monthlyLimit,
          spentThisMonth: round2(spentThisMonth),
          estimatedSpendThisMonth: round2(estimatedSpendThisMonth),
          actualSpendThisMonth: round2(actualSpendThisMonth),
          remainingBudget: round2(remainingBudget),
          usagePercent: round2(usagePercent),
          currency: budgetSetting?.currency ?? 'USD',
          alertThreshold: budgetSetting?.alertThreshold ?? 0.8,
          label: 'Estimated Spend',
          safeModeNote: 'Dry-run estimate only. No real charge.',
        },
        plan: {
          provider: 'Seedance / BytePlus / Dreamina',
          planName: 'Seedance Light Plan',
          purchaseDate: '2026-06-16',
          planCostUsd: 30.1,
          includedTokens: 7000000,
          remainingTokens: 7000000,
          validityDays: 90,
          expiryDate: '2026-09-14',
          status: 'Active',
          notes: 'Manual subscription tracker. Does not connect to real API.',
        },
        usage: {
          plannedVideoCount: ledger.length,
          completedManualVideoCount: 0,
          estimatedTokensUsed: 0,
          actualTokensUsed: 0,
          failedRetryEstimate: 0,
          estimatedVsActualDifference: round2(estimatedSpendThisMonth - actualSpendThisMonth),
        },
        meta: {
          safeMode: true,
          dryRunOnly: true,
          realApiConnected: false,
          realChargesTrackedAutomatically: false,
        },
        recentLedger: ledger.slice(0, 20).map(entry => ({
          id: entry?.id ?? Math.random().toString(36).slice(2),
          modelType: entry?.modelType,
          resolution: entry?.resolution,
          duration: entry?.duration,
          costUsd: toSafeNumber(entry?.costUsd, 0),
          description: entry?.description ?? '',
          createdAt: entry?.createdAt ?? new Date().toISOString(),
        })),
        totalSpentInPeriod: round2(spentThisMonth),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Cost summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost summary' },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
