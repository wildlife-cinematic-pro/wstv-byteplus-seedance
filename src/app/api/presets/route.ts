import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/presets — List all WSTVPresets ordered by sortOrder
export async function GET() {
  try {
    const presets = await db.wSTVPreset.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(presets);
  } catch (error) {
    console.error('[PRESETS_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}

// POST /api/presets — Create a new WSTVPreset
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      icon = '🎬',
      category = 'wildlife',
      promptTemplate,
      hookTemplate,
      structureNotes,
      safetyRules,
      captionStyle,
      hashtagStyle,
      defaultModel = 'seedance-2.0',
      defaultResolution = '720p',
      defaultDuration = 15,
      defaultFps = 24,
      animalType,
      biome,
      dangerType,
      emotionalBeat,
      sortOrder = 0,
      isActive = true,
    } = body;

    if (!name || !promptTemplate) {
      return NextResponse.json(
        { error: 'name and promptTemplate are required' },
        { status: 400 }
      );
    }

    const preset = await db.wSTVPreset.create({
      data: {
        name,
        icon,
        category,
        promptTemplate,
        hookTemplate,
        structureNotes,
        safetyRules,
        captionStyle,
        hashtagStyle,
        defaultModel,
        defaultResolution,
        defaultDuration,
        defaultFps,
        animalType,
        biome,
        dangerType,
        emotionalBeat,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    console.error('[PRESETS_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 }
    );
  }
}
