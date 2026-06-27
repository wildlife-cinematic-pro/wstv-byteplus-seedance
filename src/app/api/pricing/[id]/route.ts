import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/pricing/[id] — Get a single pricing model
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pricingModel = await db.pricingModel.findUnique({
      where: { id },
    });

    if (!pricingModel) {
      return NextResponse.json(
        { error: 'Pricing model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pricingModel);
  } catch (error) {
    console.error('[PRICING_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing model' },
      { status: 500 }
    );
  }
}

// PUT /api/pricing/[id] — Update a pricing model
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if the pricing model exists
    const existing = await db.pricingModel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Pricing model not found' },
        { status: 404 }
      );
    }

    // Build update data from provided fields only
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'modelId', 'userLabel', 'provider', 'pricingMode',
      'rate480p', 'rate720p', 'rate1080p', 'rate4k', 'perVideoCost',
      'supports480p', 'supports720p', 'supports1080p', 'supports4k',
      'minDurationSec', 'maxDurationSec', 'supportedModes', 'status', 'notes',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.pricingModel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PRICING_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update pricing model' },
      { status: 500 }
    );
  }
}

// DELETE /api/pricing/[id] — Delete a pricing model
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.pricingModel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Pricing model not found' },
        { status: 404 }
      );
    }

    await db.pricingModel.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[PRICING_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete pricing model' },
      { status: 500 }
    );
  }
}
