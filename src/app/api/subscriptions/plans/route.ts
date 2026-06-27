import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/subscriptions/plans — List all subscription plans
export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('[SUBSCRIPTION_PLANS_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/plans — Create a new subscription plan
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      priceUsd,
      tokenAllowance,
      validityDays = 90,
      provider = 'byteplus',
      description,
      status = 'active',
      notes,
    } = body;

    if (!name || priceUsd === undefined || tokenAllowance === undefined) {
      return NextResponse.json(
        { error: 'name, priceUsd, and tokenAllowance are required' },
        { status: 400 }
      );
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name,
        priceUsd,
        tokenAllowance,
        validityDays,
        provider,
        description,
        status,
        notes,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('[SUBSCRIPTION_PLANS_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}
