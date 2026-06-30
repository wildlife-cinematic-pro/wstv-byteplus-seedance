import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { mkdir, stat, copyFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// Hardcoded final-video collection folder. This route NEVER accepts a folder
// path from the client, so it cannot be abused to open / copy to arbitrary
// locations. It performs no generation and never calls BytePlus / ModelArk.
const COLLECTION_FOLDER = '/Users/acharyabimal/seedance api final video collection';
const DEFAULT_OUTPUT_FOLDER = '/Users/acharyabimal/Movies/WSTV/SeedanceVideos';
const execFileAsync = promisify(execFile);

const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);

// Reduce a client-supplied filename to a bare basename with an allowed video
// extension. Returns null if it looks unsafe (traversal / weird input).
function safeVideoBasename(name: string): string | null {
  const base = path.basename(name || '');
  if (!base || base === '.' || base === '..') return null;
  if (base.includes('..') || base.includes('/') || base.includes('\\')) return null;
  if (!ALLOWED_VIDEO_EXTS.has(path.extname(base).toLowerCase())) return null;
  return base;
}

export async function POST(request: Request) {
  try {
    // Ensure the collection folder exists (create if missing).
    await mkdir(COLLECTION_FOLDER, { recursive: true });

    let copied = false;
    let copyNote: string | undefined;

    // Optionally copy a completed video from the local output folder into the
    // collection folder. Best-effort: a missing source never fails the request.
    let filename: string | undefined;
    try {
      const body = await request.json();
      filename = typeof body?.filename === 'string' ? body.filename : undefined;
    } catch {
      // No body / invalid JSON — that's fine, just open the folder.
    }

    if (filename) {
      const safe = safeVideoBasename(filename);
      if (safe) {
        try {
          const settings = await db.dashboardSettings.findFirst();
          const outputFolder = path.resolve(settings?.outputFolder || DEFAULT_OUTPUT_FOLDER);
          const src = path.resolve(outputFolder, safe);
          const dest = path.resolve(COLLECTION_FOLDER, safe);
          // Defence-in-depth: confirm both paths stay inside their intended folders.
          if (
            src.startsWith(outputFolder + path.sep) &&
            dest.startsWith(COLLECTION_FOLDER + path.sep)
          ) {
            const info = await stat(src);
            if (info.isFile()) {
              await copyFile(src, dest);
              copied = true;
            } else {
              copyNote = 'Source is not a file';
            }
          } else {
            copyNote = 'Invalid filename';
          }
        } catch {
          // Most likely ENOENT — the source video is not present locally yet.
          copyNote = 'Source video not found locally';
        }
      } else {
        copyNote = 'Invalid filename';
      }
    }

    // Open the collection folder using the OS launcher. execFile does NOT go
    // through a shell, so the folder path (which contains spaces) is safe and
    // cannot be used for command injection.
    if (process.platform === 'darwin') {
      await execFileAsync('open', [COLLECTION_FOLDER]);
    } else if (process.platform === 'win32') {
      await execFileAsync('explorer', [COLLECTION_FOLDER]);
    } else {
      await execFileAsync('xdg-open', [COLLECTION_FOLDER]);
    }

    return NextResponse.json({
      success: true,
      folder: COLLECTION_FOLDER,
      copied,
      copyNote,
      message: copied
        ? 'Video saved to collection — folder opened'
        : 'Collection folder opened',
    });
  } catch (error) {
    console.error('Open video folder error:', error);
    const message = error instanceof Error ? error.message : 'Failed to open folder';
    return NextResponse.json(
      { success: false, folder: COLLECTION_FOLDER, error: message },
      { status: 500 }
    );
  }
}
