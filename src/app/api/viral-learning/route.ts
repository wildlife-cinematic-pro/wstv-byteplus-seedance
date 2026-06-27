import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/viral-learning — List viral learning entries (optional: ?category=xxx)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const viralLearningEntries = await db.viralLearning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(viralLearningEntries);
  } catch (error) {
    console.error('[VIRAL_LEARNING_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch viral learning entries' },
      { status: 500 }
    );
  }
}

// POST /api/viral-learning — Create or update a viral learning entry
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If id is provided, update existing
    if (body.id) {
      const existing = await db.viralLearning.findUnique({ where: { id: body.id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Viral learning entry not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {};
      const allowedFields = [
        'category', 'value', 'performanceScore', 'occurrenceCount',
        'avgViews', 'avgRetention', 'notes',
      ];

      for (const field of allowedFields) {
        if (field in body) {
          updateData[field] = body[field];
        }
      }

      const updated = await db.viralLearning.update({
        where: { id: body.id },
        data: updateData,
      });

      return NextResponse.json(updated);
    }

    // Check if entry with same category+value exists (upsert by unique combo)
    if (body.category && body.value) {
      const existing = await db.viralLearning.findFirst({
        where: { category: body.category, value: body.value },
      });

      if (existing) {
        const updated = await db.viralLearning.update({
          where: { id: existing.id },
          data: {
            occurrenceCount: existing.occurrenceCount + 1,
            performanceScore: body.performanceScore ?? existing.performanceScore,
            avgViews: body.avgViews ?? existing.avgViews,
            avgRetention: body.avgRetention ?? existing.avgRetention,
            notes: body.notes ?? existing.notes,
          },
        });

        return NextResponse.json(updated);
      }
    }

    // Create new entry
    const {
      category,
      value,
      performanceScore,
      occurrenceCount = 1,
      avgViews,
      avgRetention,
      notes,
    } = body;

    if (!category || !value) {
      return NextResponse.json(
        { error: 'category and value are required' },
        { status: 400 }
      );
    }

    const viralLearning = await db.viralLearning.create({
      data: {
        category,
        value,
        performanceScore,
        occurrenceCount,
        avgViews,
        avgRetention,
        notes,
      },
    });

    return NextResponse.json(viralLearning, { status: 201 });
  } catch (error) {
    console.error('[VIRAL_LEARNING_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create/update viral learning entry' },
      { status: 500 }
    );
  }
}
