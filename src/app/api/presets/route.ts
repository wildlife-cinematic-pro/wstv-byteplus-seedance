import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { presetCreateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// GET /api/presets — List all WSTVPresets ordered by sortOrder
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const presets = await db.wSTVPreset.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return privateJson(presets);
  } catch (error) {
    console.error('[PRESETS_LIST]', error);
    return privateJson(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}

// POST /api/presets — Create a new WSTVPreset
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = presetCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const preset = await db.wSTVPreset.create({
      data: {
        name: data.name,
        icon: data.icon,
        category: data.category,
        promptTemplate: data.promptTemplate,
        hookTemplate: data.hookTemplate ?? null,
        structureNotes: data.structureNotes ?? null,
        safetyRules: data.safetyRules ?? null,
        captionStyle: data.captionStyle ?? null,
        hashtagStyle: data.hashtagStyle ?? null,
        defaultModel: data.defaultModel,
        defaultResolution: data.defaultResolution,
        defaultDuration: data.defaultDuration,
        defaultFps: data.defaultFps,
        animalType: data.animalType ?? null,
        biome: data.biome ?? null,
        dangerType: data.dangerType ?? null,
        emotionalBeat: data.emotionalBeat ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    return privateJson(preset, { status: 201 });
  } catch (error) {
    console.error('[PRESETS_CREATE]', error);
    return privateJson(
      { error: 'Failed to create preset' },
      { status: 500 }
    );
  }
}
