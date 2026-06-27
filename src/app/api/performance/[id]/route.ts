import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/performance/[id] — Update a performance record
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.performanceRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Performance record not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'projectId', 'views', 'threeSecRetention', 'avgWatchTime',
      'shares', 'comments', 'saves', 'negativeComments',
      'bestComment', 'reasonWorked', 'reasonFailed', 'postedAt', 'notes',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = field === 'postedAt' && body[field]
          ? new Date(body[field])
          : body[field];
      }
    }

    const updated = await db.performanceRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PERFORMANCE_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update performance record' },
      { status: 500 }
    );
  }
}
