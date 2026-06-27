import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const settings = await db.dashboardSettings.findFirst();
    const folder = settings?.outputFolder || '/Users/acharyabimal/Movies/WSTV/SeedanceVideos';

    // In sandbox, we can't actually open folders
    // This is a local-only action
    return NextResponse.json({
      success: true,
      message: 'Open folder command issued (local-only)',
      folder,
      note: 'In production, this would open the folder in Finder/Explorer',
    });
  } catch (error) {
    console.error('Open folder error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to open folder' },
      { status: 500 }
    );
  }
}
