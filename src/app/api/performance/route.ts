import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/performance — List performance records
export async function GET() {
  try {
    const performanceRecords = await db.performanceRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(performanceRecords);
  } catch (error) {
    console.error('[PERFORMANCE_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance records' },
      { status: 500 }
    );
  }
}

// POST /api/performance — Create a performance record
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      projectId,
      views,
      threeSecRetention,
      avgWatchTime,
      shares,
      comments,
      saves,
      negativeComments,
      bestComment,
      reasonWorked,
      reasonFailed,
      postedAt,
      notes,
    } = body;

    const performanceRecord = await db.performanceRecord.create({
      data: {
        projectId,
        views,
        threeSecRetention,
        avgWatchTime,
        shares,
        comments,
        saves,
        negativeComments,
        bestComment,
        reasonWorked,
        reasonFailed,
        postedAt: postedAt ? new Date(postedAt) : null,
        notes,
      },
    });

    return NextResponse.json(performanceRecord, { status: 201 });
  } catch (error) {
    console.error('[PERFORMANCE_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create performance record' },
      { status: 500 }
    );
  }
}
