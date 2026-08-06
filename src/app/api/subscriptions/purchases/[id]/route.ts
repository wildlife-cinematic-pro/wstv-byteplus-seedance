import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import { subscriptionPurchaseUpdateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// PUT /api/subscriptions/purchases/[id] — Update a subscription purchase
// Supports manual expiry override and partial updates
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = subscriptionPurchaseUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const { id } = await params;

    // Check if the purchase exists
    const existing = await db.subscriptionPurchase.findUnique({ where: { id } });
    if (!existing) {
      return privateJson(
        { error: 'Subscription purchase not found' },
        { status: 404 }
      );
    }

    // Build update data from provided (validated) fields only
    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.planId !== undefined) updateData.planId = data.planId;
    if (data.planName !== undefined) updateData.planName = data.planName;
    if (data.priceUsd !== undefined) updateData.priceUsd = data.priceUsd;
    if (data.tokenAllowance !== undefined) updateData.tokenAllowance = data.tokenAllowance;
    if (data.tokensUsed !== undefined) updateData.tokensUsed = data.tokensUsed;
    if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.manualExpiryOverride !== undefined) updateData.manualExpiryOverride = data.manualExpiryOverride;
    if (data.validityDays !== undefined) updateData.validityDays = data.validityDays;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.billingCurrency !== undefined) updateData.billingCurrency = data.billingCurrency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await db.subscriptionPurchase.update({
      where: { id },
      data: updateData,
    });

    return privateJson(updated);
  } catch (error) {
    console.error('[SUBSCRIPTION_PURCHASES_UPDATE]', error);
    return privateJson(
      { error: 'Failed to update subscription purchase' },
      { status: 500 }
    );
  }
}
