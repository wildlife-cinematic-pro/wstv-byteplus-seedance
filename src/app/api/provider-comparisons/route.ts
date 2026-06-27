import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/provider-comparisons — List provider comparisons
export async function GET() {
  try {
    const providerComparisons = await db.providerComparison.findMany({
      orderBy: [{ category: 'asc' }, { provider: 'asc' }],
    });
    return NextResponse.json(providerComparisons);
  } catch (error) {
    console.error('[PROVIDER_COMPARISONS_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider comparisons' },
      { status: 500 }
    );
  }
}

// POST /api/provider-comparisons — Create or update a provider comparison
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If id is provided, update existing
    if (body.id) {
      const existing = await db.providerComparison.findUnique({ where: { id: body.id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Provider comparison not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {};
      const allowedFields = ['provider', 'category', 'rating', 'notes'];

      for (const field of allowedFields) {
        if (field in body) {
          updateData[field] = body[field];
        }
      }

      const updated = await db.providerComparison.update({
        where: { id: body.id },
        data: updateData,
      });

      return NextResponse.json(updated);
    }

    // Check if entry with same provider+category exists (upsert by unique combo)
    if (body.provider && body.category) {
      const existing = await db.providerComparison.findFirst({
        where: { provider: body.provider, category: body.category },
      });

      if (existing) {
        const updateData: Record<string, unknown> = {};
        if ('rating' in body) updateData.rating = body.rating;
        if ('notes' in body) updateData.notes = body.notes;

        const updated = await db.providerComparison.update({
          where: { id: existing.id },
          data: updateData,
        });

        return NextResponse.json(updated);
      }
    }

    // Create new entry
    const {
      provider,
      category,
      rating,
      notes,
    } = body;

    if (!provider || !category) {
      return NextResponse.json(
        { error: 'provider and category are required' },
        { status: 400 }
      );
    }

    const providerComparison = await db.providerComparison.create({
      data: {
        provider,
        category,
        rating,
        notes,
      },
    });

    return NextResponse.json(providerComparison, { status: 201 });
  } catch (error) {
    console.error('[PROVIDER_COMPARISONS_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create/update provider comparison' },
      { status: 500 }
    );
  }
}
