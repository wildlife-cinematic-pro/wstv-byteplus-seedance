import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Minimal, safe video proxy used ONLY to let the dashboard <video> player load
// a remote/signed generated-video URL that the browser cannot fetch directly
// (CORS, expiring signatures, auth headers). It performs no generation, does
// not call BytePlus / ModelArk / any submit endpoint, and never touches the
// local filesystem. It is a pure streaming passthrough for a single video URL.

const VIDEO_CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.ogv': 'video/ogg',
};

function inferContentType(url: string, fallback: string | null): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    for (const [ext, type] of Object.entries(VIDEO_CONTENT_TYPES)) {
      if (pathname.endsWith(ext)) return type;
    }
  } catch {
    // ignore — fall back to upstream content-type
  }
  return fallback || 'application/octet-stream';
}

// Returns a safe basename for the Content-Disposition filename, or null if the
// candidate is not a plausible filename. Used for the download flag.
function safeFilename(candidate: string | null, fallbackUrl: string): string | null {
  let base = candidate && candidate.trim() ? candidate : '';
  if (!base) {
    try {
      base = new URL(fallbackUrl).pathname.split('/').pop() || '';
    } catch {
      return null;
    }
  }
  const cleaned = (base.split('/').pop() || '').replace(/["\\]/g, '').trim();
  if (!cleaned || cleaned === '.' || cleaned === '..' || cleaned.includes('..')) return null;
  return cleaned;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // SECURITY: only allow absolute http/https URLs. Reject file://, relative
  // paths, and any non-http scheme. This prevents proxying local files.
  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
  }

  try {
    // Forward the Range header so the browser can seek / stream the video in
    // chunks instead of downloading the whole file up front.
    const headers = new Headers({ 'User-Agent': 'WSTV-VideoProxy/1.0' });
    const range = request.headers.get('range');
    if (range) headers.set('Range', range);

    const upstream = await fetch(targetUrl.toString(), {
      headers,
      redirect: 'follow',
    });

    // Allow 200 (full) and 206 (partial / range) responses through.
    if (upstream.status !== 200 && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = inferContentType(
      targetUrl.toString(),
      upstream.headers.get('content-type')
    );

    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    });

    // When download=1, force the browser to save the file instead of playing
    // it. The filename comes from the optional `filename` param (validated) or
    // is inferred from the upstream URL.
    const download = new URL(request.url).searchParams.get('download') === '1';
    if (download) {
      const name = safeFilename(
        new URL(request.url).searchParams.get('filename'),
        targetUrl.toString()
      );
      responseHeaders.set(
        'Content-Disposition',
        `attachment; filename="${name || 'video.mp4'}"`
      );
    }

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    // Stream the upstream body straight back to the client.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy video' }, { status: 502 });
  }
}
