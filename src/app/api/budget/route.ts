import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import {
  budgetPutSchema,
  DEFAULT_MONTHLY_LIMIT,
  DEFAULT_CURRENCY,
  DEFAULT_ALERT_THRESHOLD,
  firstZodErrorMessage,
} from '@/lib/budget-validation';

// Force dynamic — this route reads/writes the DB and must never be cached.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/budget
 *
 * Route-level authentication (defense-in-depth on top of the global proxy).
 * GET is read-only: when no BudgetSetting row exists, a safe default budget
 * object is returned WITHOUT creating a row. The row is created on demand by
 * PUT /api/budget or POST /api/cost-summary.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;

  try {
    const budget = await db.budgetSetting.findFirst();

    return privateJson({
      budget:
        budget ?? {
          id: null,
          monthlyLimit: DEFAULT_MONTHLY_LIMIT,
          spentThisMonth: 0,
          currency: DEFAULT_CURRENCY,
          alertThreshold: DEFAULT_ALERT_THRESHOLD,
        },
    });
  } catch (error) {
    console.error('Budget GET error:', error);
    return privateJson({ error: 'Failed to fetch budget' }, { status: 500 });
  }
}

/**
 * PUT /api/budget
 *
 * Route-level mutation guard + strict Zod validation.
 * Allowed fields: monthlyLimit, currency, alertThreshold.
 * spentThisMonth is NEVER client-settable here — the spend accumulator is
 * exclusively managed by the simulation and real-usage pipelines.
 */
export async function PUT(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = budgetPutSchema.safeParse(body);
  if (!parsed.success) {
    return privateJson(
      { error: firstZodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const { monthlyLimit, currency, alertThreshold } = parsed.data;

  try {
    let budget = await db.budgetSetting.findFirst();

    if (!budget) {
      budget = await db.budgetSetting.create({
        data: {
          monthlyLimit: monthlyLimit ?? DEFAULT_MONTHLY_LIMIT,
          spentThisMonth: 0, // always starts at zero; never client-settable
          currency: currency ?? DEFAULT_CURRENCY,
          alertThreshold: alertThreshold ?? DEFAULT_ALERT_THRESHOLD,
        },
      });
    } else {
      budget = await db.budgetSetting.update({
        where: { id: budget.id },
        data: {
          ...(monthlyLimit !== undefined && { monthlyLimit }),
          ...(currency !== undefined && { currency }),
          ...(alertThreshold !== undefined && { alertThreshold }),
        },
      });
    }

    return privateJson({ budget });
  } catch (error) {
    console.error('Budget PUT error:', error);
    return privateJson({ error: 'Failed to update budget' }, { status: 500 });
  }
}
