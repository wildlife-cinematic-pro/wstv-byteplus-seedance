import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/content-calendar — List calendar entries (optional: ?month=2026-06)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // e.g., "2026-06"

    const where: Record<string, unknown> = {};
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1);
      where.scheduledDate = { gte: startDate, lt: endDate };
    }

    const calendarEntries = await db.contentCalendar.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json(calendarEntries);
  } catch (error) {
    console.error('[CONTENT_CALENDAR_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar entries' },
      { status: 500 }
    );
  }
}

// POST /api/content-calendar — Create a calendar entry
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      scheduledDate,
      projectTitle,
      animalStoryName,
      status = 'idea',
      presetId,
      promptVersionId,
      qaId,
      postProductionId,
      performanceId,
      notes,
    } = body;

    if (!scheduledDate) {
      return NextResponse.json(
        { error: 'scheduledDate is required' },
        { status: 400 }
      );
    }

    const calendarEntry = await db.contentCalendar.create({
      data: {
        scheduledDate: new Date(scheduledDate),
        projectTitle,
        animalStoryName,
        status,
        presetId,
        promptVersionId,
        qaId,
        postProductionId,
        performanceId,
        notes,
      },
    });

    return NextResponse.json(calendarEntry, { status: 201 });
  } catch (error) {
    console.error('[CONTENT_CALENDAR_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create calendar entry' },
      { status: 500 }
    );
  }
}
