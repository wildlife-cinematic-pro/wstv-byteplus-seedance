import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic — this route reads/writes the DB and must never be cached.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let budget = await db.budgetSetting.findFirst();

    if (!budget) {
      budget = await db.budgetSetting.create({
        data: {
          monthlyLimit: 50,
          spentThisMonth: 0,
          currency: 'USD',
          alertThreshold: 0.8,
        },
      });
    }

    return NextResponse.json(
      { budget },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Budget GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyLimit, spentThisMonth, currency, alertThreshold } = body;

    let budget = await db.budgetSetting.findFirst();

    if (!budget) {
      budget = await db.budgetSetting.create({
        data: {
          monthlyLimit: monthlyLimit || 50,
          spentThisMonth: spentThisMonth || 0,
          currency: currency || 'USD',
          alertThreshold: alertThreshold || 0.8,
        },
      });
    } else {
      budget = await db.budgetSetting.update({
        where: { id: budget.id },
        data: {
          ...(monthlyLimit !== undefined && { monthlyLimit }),
          ...(spentThisMonth !== undefined && { spentThisMonth }),
          ...(currency !== undefined && { currency }),
          ...(alertThreshold !== undefined && { alertThreshold }),
        },
      });
    }

    return NextResponse.json(
      { budget },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Budget PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
