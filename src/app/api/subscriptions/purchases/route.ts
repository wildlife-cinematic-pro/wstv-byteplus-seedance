import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { subscriptionPurchaseCreateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// GET /api/subscriptions/purchases — List all subscription purchases
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const purchases = await db.subscriptionPurchase.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return privateJson(purchases);
  } catch (error) {
    console.error('[SUBSCRIPTION_PURCHASES_LIST]', error);
    return privateJson(
      { error: 'Failed to fetch subscription purchases' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/purchases — Create a new subscription purchase
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = subscriptionPurchaseCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    // Default purchaseDate and expiryDate if not provided
    const now = new Date();
    const resolvedPurchaseDate = parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : now;
    const resolvedExpiryDate = parsed.data.expiryDate
      ? new Date(parsed.data.expiryDate)
      : new Date(now.getTime() + parsed.data.validityDays * 24 * 60 * 60 * 1000);

    const purchase = await db.subscriptionPurchase.create({
      data: {
        planId: parsed.data.planId ?? null,
        planName: parsed.data.planName,
        priceUsd: parsed.data.priceUsd,
        tokenAllowance: parsed.data.tokenAllowance,
        tokensUsed: parsed.data.tokensUsed,
        purchaseDate: resolvedPurchaseDate,
        expiryDate: resolvedExpiryDate,
        manualExpiryOverride: parsed.data.manualExpiryOverride,
        validityDays: parsed.data.validityDays,
        provider: parsed.data.provider,
        billingCurrency: parsed.data.billingCurrency,
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
      },
    });

    return privateJson(purchase, { status: 201 });
  } catch (error) {
    console.error('[SUBSCRIPTION_PURCHASES_CREATE]', error);
    return privateJson(
      { error: 'Failed to create subscription purchase' },
      { status: 500 }
    );
  }
}
