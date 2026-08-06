import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { subscriptionPlanCreateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// GET /api/subscriptions/plans — List all subscription plans
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const plans = await db.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return privateJson(plans);
  } catch (error) {
    console.error('[SUBSCRIPTION_PLANS_LIST]', error);
    return privateJson(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/plans — Create a new subscription plan
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = subscriptionPlanCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const plan = await db.subscriptionPlan.create({
      data: {
        name: parsed.data.name,
        priceUsd: parsed.data.priceUsd,
        tokenAllowance: parsed.data.tokenAllowance,
        validityDays: parsed.data.validityDays,
        provider: parsed.data.provider,
        description: parsed.data.description ?? null,
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
      },
    });

    return privateJson(plan, { status: 201 });
  } catch (error) {
    console.error('[SUBSCRIPTION_PLANS_CREATE]', error);
    return privateJson(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}
