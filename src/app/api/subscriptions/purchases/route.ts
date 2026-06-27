import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/subscriptions/purchases — List all subscription purchases
export async function GET() {
  try {
    const purchases = await db.subscriptionPurchase.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(purchases);
  } catch (error) {
    console.error('[SUBSCRIPTION_PURCHASES_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription purchases' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/purchases — Create a new subscription purchase
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      planId,
      planName,
      priceUsd,
      tokenAllowance,
      tokensUsed = 0,
      purchaseDate,
      expiryDate,
      manualExpiryOverride = false,
      validityDays = 90,
      provider = 'byteplus',
      billingCurrency = 'USD',
      status = 'active',
      notes,
    } = body;

    if (!planName || priceUsd === undefined || tokenAllowance === undefined) {
      return NextResponse.json(
        { error: 'planName, priceUsd, and tokenAllowance are required' },
        { status: 400 }
      );
    }

    // Default purchaseDate and expiryDate if not provided
    const now = new Date();
    const resolvedPurchaseDate = purchaseDate ? new Date(purchaseDate) : now;
    const resolvedExpiryDate = expiryDate
      ? new Date(expiryDate)
      : new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const purchase = await db.subscriptionPurchase.create({
      data: {
        planId,
        planName,
        priceUsd,
        tokenAllowance,
        tokensUsed,
        purchaseDate: resolvedPurchaseDate,
        expiryDate: resolvedExpiryDate,
        manualExpiryOverride,
        validityDays,
        provider,
        billingCurrency,
        status,
        notes,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('[SUBSCRIPTION_PURCHASES_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create subscription purchase' },
      { status: 500 }
    );
  }
}
