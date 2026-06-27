import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/retry-strategies — List retry strategies
export async function GET() {
  try {
    const retryStrategies = await db.retryStrategy.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(retryStrategies);
  } catch (error) {
    console.error('[RETRY_STRATEGIES_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch retry strategies' },
      { status: 500 }
    );
  }
}

// POST /api/retry-strategies — Create a retry strategy
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      projectId,
      failureReason,
      suggestedFix,
      fixDetails,
      attempted = false,
      succeeded,
      notes,
    } = body;

    if (!failureReason || !suggestedFix) {
      return NextResponse.json(
        { error: 'failureReason and suggestedFix are required' },
        { status: 400 }
      );
    }

    const retryStrategy = await db.retryStrategy.create({
      data: {
        projectId,
        failureReason,
        suggestedFix,
        fixDetails,
        attempted,
        succeeded,
        notes,
      },
    });

    return NextResponse.json(retryStrategy, { status: 201 });
  } catch (error) {
    console.error('[RETRY_STRATEGIES_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create retry strategy' },
      { status: 500 }
    );
  }
}
