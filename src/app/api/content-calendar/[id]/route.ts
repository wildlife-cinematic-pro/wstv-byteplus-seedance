import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/content-calendar/[id] — Update a calendar entry (especially status)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.contentCalendar.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Calendar entry not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'scheduledDate', 'projectTitle', 'animalStoryName', 'status',
      'presetId', 'promptVersionId', 'qaId', 'postProductionId',
      'performanceId', 'notes',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = field === 'scheduledDate'
          ? new Date(body[field])
          : body[field];
      }
    }

    const updated = await db.contentCalendar.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[CONTENT_CALENDAR_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update calendar entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/content-calendar/[id] — Delete a calendar entry
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.contentCalendar.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Calendar entry not found' },
        { status: 404 }
      );
    }

    await db.contentCalendar.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[CONTENT_CALENDAR_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar entry' },
      { status: 500 }
    );
  }
}
