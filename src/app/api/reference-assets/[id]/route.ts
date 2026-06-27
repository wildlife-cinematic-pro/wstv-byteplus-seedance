import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/reference-assets/[id] — Update a reference asset
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.referenceAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Reference asset not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'projectId', 'assetType', 'role', 'url', 'label', 'notes',
      'isActive', 'sortOrder',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.referenceAsset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[REFERENCE_ASSETS_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update reference asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/reference-assets/[id] — Delete a reference asset
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.referenceAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Reference asset not found' },
        { status: 404 }
      );
    }

    await db.referenceAsset.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[REFERENCE_ASSETS_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete reference asset' },
      { status: 500 }
    );
  }
}
