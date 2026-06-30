import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const DEFAULT_OUTPUT_FOLDER = '/Users/acharyabimal/Movies/WSTV/SeedanceVideos';
const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

function isNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function streamResponse(
  filePath: string,
  start: number,
  end: number,
  headers: Headers,
  includeBody: boolean,
  status = 200
) {
  if (!includeBody) {
    return new Response(null, { status, headers });
  }

  const fileStream = createReadStream(filePath, { start, end });
  return new Response(Readable.toWeb(fileStream) as ReadableStream, { status, headers });
}

export async function GET(request: NextRequest) {
  return handleVideoRequest(request, true);
}

export async function HEAD(request: NextRequest) {
  return handleVideoRequest(request, false);
}

async function handleVideoRequest(request: NextRequest, includeBody: boolean) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const safeName = path.basename(name);
    if (
      safeName !== name ||
      safeName === '' ||
      safeName === '..' ||
      name.includes('..') ||
      name.includes('/') ||
      name.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const extension = path.extname(safeName).toLowerCase();
    const contentType = ALLOWED_VIDEO_TYPES[extension];
    if (!contentType) {
      return NextResponse.json({ error: 'Unsupported video extension' }, { status: 400 });
    }

    // When download=1 is present, tell the browser to save the file instead of
    // playing it inline. The filename is derived from the validated basename.
    const download = searchParams.get('download') === '1';
    const contentDisposition = download
      ? `attachment; filename="${safeName.replace(/["\\]/g, '')}"`
      : null;

    const settings = await db.dashboardSettings.findFirst();
    const folder = settings?.outputFolder || DEFAULT_OUTPUT_FOLDER;
    const resolvedFolder = path.resolve(/* turbopackIgnore: true */ folder);
    const resolvedFile = path.resolve(/* turbopackIgnore: true */ resolvedFolder, safeName);

    if (!resolvedFile.startsWith(resolvedFolder + path.sep)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    let fileStats;
    try {
      fileStats = await stat(resolvedFile);
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json(
          { error: 'Video file not found', filename: safeName, folder: resolvedFolder },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!fileStats.isFile()) {
      return NextResponse.json(
        { error: 'Video file not found', filename: safeName, folder: resolvedFolder },
        { status: 404 }
      );
    }

    // Streams local saved files only. This route does not generate video,
    // call BytePlus / ModelArk, or submit paid generation tasks.
    const fileSize = fileStats.size;
    const range = request.headers.get('range');

    if (fileSize === 0) {
      return new Response(null, {
        headers: {
          'Content-Length': '0',
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
        },
      });
    }

    if (range) {
      const match = range.match(/^bytes=(\d*)-(\d*)$/);
      if (!match || (!match[1] && !match[2])) {
        return new Response(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      const startText = match[1];
      const endText = match[2];
      let start = startText ? Number.parseInt(startText, 10) : 0;
      let end = endText ? Number.parseInt(endText, 10) : fileSize - 1;

      if (!startText && endText) {
        const suffixLength = Number.parseInt(endText, 10);
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
      }

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 0 ||
        end < start ||
        start >= fileSize
      ) {
        return new Response(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      end = Math.min(end, fileSize - 1);
      const contentLength = end - start + 1;

      const rangeHeaders = new Headers({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(contentLength),
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      });
      if (contentDisposition) rangeHeaders.set('Content-Disposition', contentDisposition);
      return streamResponse(resolvedFile, start, end, rangeHeaders, includeBody, 206);
    }

    const fullHeaders = new Headers({
      'Content-Length': String(fileSize),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });
    if (contentDisposition) fullHeaders.set('Content-Disposition', contentDisposition);
    return streamResponse(resolvedFile, 0, fileSize - 1, fullHeaders, includeBody);
  } catch (error) {
    console.error('Video stream error:', error);
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    );
  }
}
