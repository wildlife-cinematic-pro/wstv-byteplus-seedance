import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/presets/[id] — Update a WSTVPreset
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.wSTVPreset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'icon', 'category', 'promptTemplate', 'hookTemplate',
      'structureNotes', 'safetyRules', 'captionStyle', 'hashtagStyle',
      'defaultModel', 'defaultResolution', 'defaultDuration', 'defaultFps',
      'animalType', 'biome', 'dangerType', 'emotionalBeat',
      'sortOrder', 'isActive',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.wSTVPreset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PRESETS_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update preset' },
      { status: 500 }
    );
  }
}

// DELETE /api/presets/[id] — Delete a WSTVPreset
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.wSTVPreset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    await db.wSTVPreset.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[PRESETS_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 }
    );
  }
}
