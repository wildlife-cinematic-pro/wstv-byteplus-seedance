import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.dashboardSettings.findFirst();

    if (!settings) {
      settings = await db.dashboardSettings.create({
        data: {
          safeMode: true,
          outputFolder: '/Users/acharyabimal/Movies/WSTV/SeedanceVideos',
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { safeMode, outputFolder } = body;

    let settings = await db.dashboardSettings.findFirst();

    if (!settings) {
      settings = await db.dashboardSettings.create({
        data: {
          safeMode: safeMode !== undefined ? safeMode : true,
          outputFolder: outputFolder || '/Users/acharyabimal/Movies/WSTV/SeedanceVideos',
        },
      });
    } else {
      settings = await db.dashboardSettings.update({
        where: { id: settings.id },
        data: {
          ...(safeMode !== undefined && { safeMode }),
          ...(outputFolder !== undefined && { outputFolder }),
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
