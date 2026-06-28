import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const DEFAULT_OUTPUT_FOLDER = '/Users/acharyabimal/Movies/WSTV/SeedanceVideos';
const execFileAsync = promisify(execFile);

export async function POST() {
  let folder = DEFAULT_OUTPUT_FOLDER;

  try {
    const settings = await db.dashboardSettings.findFirst();
    folder = settings?.outputFolder || DEFAULT_OUTPUT_FOLDER;

    // Local-only helper: opens the configured output folder and never calls
    // BytePlus / ModelArk or submits paid generation tasks.
    await mkdir(folder, { recursive: true });

    if (process.platform === 'darwin') {
      await execFileAsync('open', [folder]);
    } else if (process.platform === 'win32') {
      await execFileAsync('explorer', [folder]);
    } else {
      await execFileAsync('xdg-open', [folder]);
    }

    return NextResponse.json({
      success: true,
      folder,
      message: 'Opened output folder',
    });
  } catch (error) {
    console.error('Open folder error:', error);
    const message = error instanceof Error ? error.message : 'Failed to open folder';
    return NextResponse.json(
      { success: false, folder, error: message },
      { status: 500 }
    );
  }
}
