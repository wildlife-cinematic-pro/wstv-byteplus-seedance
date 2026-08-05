import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import {
  costSummaryPostSchema,
  DEFAULT_MONTHLY_LIMIT,
  DEFAULT_CURRENCY,
  DEFAULT_ALERT_THRESHOLD,
  firstZodErrorMessage,
} from '@/lib/budget-validation';

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
 * This route only ever updates `monthlyLimit`. It never accepts or writes
 * `spentThisMonth` — the spend accumulator is exclusively server-managed
 * (see /api/generate and /api/real-task-status).
 *
 * Response shape (on success):
 *   { success: true, budget: { monthlyLimit, spentThisMonth, currency, alertThreshold, ... } }
 */
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = costSummaryPostSchema.safeParse(body);
  if (!parsed.success) {
    return privateJson(
      { success: false, error: firstZodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const newLimit = parsed.data.monthlyLimit ?? (parsed.data.monthlyBudgetUsd as number);

  try {
    let saved: {
      monthlyLimit: number;
      spentThisMonth: number;
      currency: string;
      alertThreshold: number;
    };

    const existing = await db.budgetSetting.findFirst();

    if (existing) {
      const updated = await db.budgetSetting.update({
        where: { id: existing.id },
        data: { monthlyLimit: newLimit },
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
          monthlyLimit: newLimit,
          spentThisMonth: 0,
          currency: DEFAULT_CURRENCY,
          alertThreshold: DEFAULT_ALERT_THRESHOLD,
        },
      });
      saved = {
        monthlyLimit: created.monthlyLimit,
        spentThisMonth: created.spentThisMonth,
        currency: created.currency,
        alertThreshold: created.alertThreshold,
      };
    }

    return privateJson({
      success: true,
      budget: {
        ...saved,
        label: 'Current Period Spend',
        safeModeNote: 'Canonical budget accumulator — includes simulated costs and any recorded actual provider spend.',
      },
    });
  } catch {
    console.error('Cost summary POST failed');
    return privateJson(
      {
        success: false,
        error: 'Failed to save budget setting',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cost-summary
 *
 * Returns the current budget + spend summary.
 *
 * Canonical values (used by budget enforcement in /api/generate,
 * /api/real-generate and /api/real-task-status):
 *   - spentThisMonth = BudgetSetting.spentThisMonth
 *   - remainingBudget = monthlyLimit - spentThisMonth
 *   - usagePercent = spentThisMonth / monthlyLimit
 *
 * The canonical spend is the BudgetSetting accumulator, NOT a sum over a
 * partial (latest-100) subset of CostLedger rows. CostLedger remains an
 * audit/history list: `recentLedger` returns only the latest 20 rows, and the
 * total record count comes from db.costLedger.count().
 *
 * The estimated/actual spend split is not reliably derivable from ledger data
 * (both simulated and actual costs land in the same accumulator), so those
 * fields are explicitly unknown (null) rather than fabricated from an
 * incomplete subset. `spendBasis` documents this.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;

  try {
    const [budgetSetting, recentLedgerRows, ledgerCount] = await Promise.all([
      db.budgetSetting.findFirst(),
      db.costLedger.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      db.costLedger.count(),
    ]);

    const monthlyLimitRaw = toSafeNumber(budgetSetting?.monthlyLimit, DEFAULT_MONTHLY_LIMIT);
    const monthlyLimit = monthlyLimitRaw > 0 ? monthlyLimitRaw : DEFAULT_MONTHLY_LIMIT;

    // Canonical current-period spend accumulator.
    const spentThisMonth = toSafeNumber(budgetSetting?.spentThisMonth, 0);
    const remainingBudget = Math.max(0, monthlyLimit - spentThisMonth);
    const usagePercent = monthlyLimit > 0 ? (spentThisMonth / monthlyLimit) * 100 : 0;

    return privateJson({
      budget: {
        monthlyLimit: round2(monthlyLimit),
        spentThisMonth: round2(spentThisMonth),
        // Explicitly unknown: the accumulator mixes simulated and actual costs,
        // and a partial ledger subset cannot split them honestly.
        estimatedSpendThisMonth: null,
        actualSpendThisMonth: null,
        remainingBudget: round2(remainingBudget),
        usagePercent: round2(usagePercent),
        currency: budgetSetting?.currency ?? DEFAULT_CURRENCY,
        alertThreshold: budgetSetting?.alertThreshold ?? DEFAULT_ALERT_THRESHOLD,
        label: 'Current Period Spend',
        safeModeNote: 'Canonical budget accumulator — includes simulated costs and any recorded actual provider spend.',
        spendBasis: 'BudgetSetting.spentThisMonth',
        spendBasisNote:
          'spentThisMonth is the canonical mixed current-period accumulator used for budget enforcement. ' +
          'The estimate/actual split is not derived from a partial ledger subset.',
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
        plannedVideoCount: ledgerCount,
        completedManualVideoCount: 0,
        estimatedTokensUsed: 0,
        actualTokensUsed: 0,
        failedRetryEstimate: 0,
        estimatedVsActualDifference: null,
      },
      meta: {
        safeMode: true,
        dryRunOnly: true,
        realApiConnected: false,
        realChargesTrackedAutomatically: false,
      },
      recentLedger: recentLedgerRows.map(entry => ({
        id: entry.id,
        modelType: entry.modelType,
        resolution: entry.resolution,
        duration: entry.duration,
        costUsd: toSafeNumber(entry.costUsd, 0),
        description: entry.description ?? '',
        createdAt: entry.createdAt.toISOString(),
      })),
      totalSpentInPeriod: round2(spentThisMonth),
    });
  } catch (error) {
    console.error('Cost summary error:', error);
    return privateJson(
      { error: 'Failed to fetch cost summary' },
      { status: 500 }
    );
  }
}
