import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/subscriptions/purchases/[id] — Update a subscription purchase
// Supports manual expiry override and partial updates
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if the purchase exists
    const existing = await db.subscriptionPurchase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Subscription purchase not found' },
        { status: 404 }
      );
    }

    // Build update data from provided fields only
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'planId', 'planName', 'priceUsd', 'tokenAllowance', 'tokensUsed',
      'purchaseDate', 'expiryDate', 'manualExpiryOverride', 'validityDays',
      'provider', 'billingCurrency', 'status', 'notes',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        // Handle date fields
        if (field === 'purchaseDate' || field === 'expiryDate') {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // If manualExpiryOverride is being set to true and expiryDate is provided,
    // mark that the expiry was manually overridden
    if (body.manualExpiryOverride === true) {
      updateData.manualExpiryOverride = true;
    }

    const updated = await db.subscriptionPurchase.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[SUBSCRIPTION_PURCHASES_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update subscription purchase' },
      { status: 500 }
    );
  }
}
