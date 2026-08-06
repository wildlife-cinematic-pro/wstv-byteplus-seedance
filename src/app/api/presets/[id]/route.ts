import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import { presetUpdateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// PUT /api/presets/[id] — Update a WSTVPreset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = presetUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const { id } = await params;
    const data = parsed.data;

    const existing = await db.wSTVPreset.findUnique({ where: { id } });
    if (!existing) {
      return privateJson(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.promptTemplate !== undefined) updateData.promptTemplate = data.promptTemplate;
    if (data.hookTemplate !== undefined) updateData.hookTemplate = data.hookTemplate;
    if (data.structureNotes !== undefined) updateData.structureNotes = data.structureNotes;
    if (data.safetyRules !== undefined) updateData.safetyRules = data.safetyRules;
    if (data.captionStyle !== undefined) updateData.captionStyle = data.captionStyle;
    if (data.hashtagStyle !== undefined) updateData.hashtagStyle = data.hashtagStyle;
    if (data.defaultModel !== undefined) updateData.defaultModel = data.defaultModel;
    if (data.defaultResolution !== undefined) updateData.defaultResolution = data.defaultResolution;
    if (data.defaultDuration !== undefined) updateData.defaultDuration = data.defaultDuration;
    if (data.defaultFps !== undefined) updateData.defaultFps = data.defaultFps;
    if (data.animalType !== undefined) updateData.animalType = data.animalType;
    if (data.biome !== undefined) updateData.biome = data.biome;
    if (data.dangerType !== undefined) updateData.dangerType = data.dangerType;
    if (data.emotionalBeat !== undefined) updateData.emotionalBeat = data.emotionalBeat;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await db.wSTVPreset.update({
      where: { id },
      data: updateData,
    });

    return privateJson(updated);
  } catch (error) {
    console.error('[PRESETS_UPDATE]', error);
    return privateJson(
      { error: 'Failed to update preset' },
      { status: 500 }
    );
  }
}

// DELETE /api/presets/[id] — Delete a WSTVPreset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  try {
    const { id } = await params;

    const existing = await db.wSTVPreset.findUnique({ where: { id } });
    if (!existing) {
      return privateJson(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    await db.wSTVPreset.delete({ where: { id } });

    return privateJson({ success: true, id });
  } catch (error) {
    console.error('[PRESETS_DELETE]', error);
    return privateJson(
      { error: 'Failed to delete preset' },
      { status: 500 }
    );
  }
}
