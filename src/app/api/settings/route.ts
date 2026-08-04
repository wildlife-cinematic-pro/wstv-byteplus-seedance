import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';

const settingsSchema = z.object({ safeMode: z.boolean() }).strict();

function settingsDto(settings: { safeMode: boolean; defaultFps: number; defaultModel: string; defaultResolution: string; intelligentModeWarning: boolean }) {
  return {
    safeMode: settings.safeMode,
    defaultFps: settings.defaultFps,
    defaultModel: settings.defaultModel,
    defaultResolution: settings.defaultResolution,
    intelligentModeWarning: settings.intelligentModeWarning,
  };
}

async function getOrCreateSettings() {
  const existing = await db.dashboardSettings.findFirst();
  if (existing) return existing;
  return db.dashboardSettings.create({
    data: { safeMode: true, outputFolder: 'outputs' },
  });
}

export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    return privateJson({ settings: settingsDto(await getOrCreateSettings()) });
  } catch {
    console.error('Settings GET failed');
    return privateJson({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: 'Invalid settings input' }, { status: 400 });

  try {
    const settings = await getOrCreateSettings();
    const updated = await db.dashboardSettings.update({
      where: { id: settings.id },
      data: { safeMode: parsed.data.safeMode },
    });
    return privateJson({ settings: settingsDto(updated) });
  } catch {
    console.error('Settings PUT failed');
    return privateJson({ error: 'Failed to update settings' }, { status: 500 });
  }
}
