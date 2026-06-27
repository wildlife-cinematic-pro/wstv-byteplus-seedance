import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/dashboard-settings — Get dashboard settings
export async function GET() {
  try {
    // There should typically be only one DashboardSettings row
    let settings = await db.dashboardSettings.findFirst();

    // If no settings exist yet, create default settings
    if (!settings) {
      settings = await db.dashboardSettings.create({
        data: {
          safeMode: true,
          outputFolder: '/Users/acharyabimal/Movies/WSTV/SeedanceVideos',
          defaultFps: 24,
          defaultModel: 'seedance-2.0',
          defaultResolution: '720p',
          intelligentModeWarning: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[DASHBOARD_SETTINGS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard settings' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard-settings — Update dashboard settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Find existing settings
    let settings = await db.dashboardSettings.findFirst();

    // Build update data from provided fields only
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'safeMode',
      'outputFolder',
      'defaultFps',
      'defaultModel',
      'defaultResolution',
      'intelligentModeWarning',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (settings) {
      // Update existing settings
      settings = await db.dashboardSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      // Create settings if none exist
      settings = await db.dashboardSettings.create({
        data: {
          safeMode: (updateData.safeMode as boolean) ?? true,
          outputFolder: (updateData.outputFolder as string) ?? '/Users/acharyabimal/Movies/WSTV/SeedanceVideos',
          defaultFps: (updateData.defaultFps as number) ?? 24,
          defaultModel: (updateData.defaultModel as string) ?? 'seedance-2.0',
          defaultResolution: (updateData.defaultResolution as string) ?? '720p',
          intelligentModeWarning: (updateData.intelligentModeWarning as boolean) ?? true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[DASHBOARD_SETTINGS_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard settings' },
      { status: 500 }
    );
  }
}
