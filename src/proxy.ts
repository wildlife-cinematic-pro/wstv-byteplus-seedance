import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const REALM = 'WSTV Dashboard';

function authEnabled(): boolean {
  const value = (process.env.WSTV_AUTH_ENABLED ?? '').trim().toLowerCase();

  // Local dev: auth is off unless explicitly enabled.
  if (process.env.NODE_ENV !== 'production') {
    return value === 'true';
  }

  // Production: auth is on by default unless explicitly disabled.
  return value !== 'false';
}

function unauthorized(message = 'Authentication required') {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  });
}

function authNotConfigured() {
  return new NextResponse('Auth not configured', {
    status: 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function parseBasicAuth(header: string | null): { user: string; password: string } | null {
  if (!header?.startsWith('Basic ')) return null;

  try {
    const decoded = atob(header.slice('Basic '.length));
    const separator = decoded.indexOf(':');

    if (separator < 0) return null;

    return {
      user: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.next();
  }

  const expectedUser = process.env.WSTV_AUTH_USER;
  const expectedPassword = process.env.WSTV_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return authNotConfigured();
  }

  const credentials = parseBasicAuth(request.headers.get('authorization'));

  if (!credentials) {
    return unauthorized();
  }

  if (credentials.user !== expectedUser || credentials.password !== expectedPassword) {
    return unauthorized('Invalid credentials');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect all pages and /api routes.
     * Exclude only Next.js static/image assets and basic metadata files.
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
