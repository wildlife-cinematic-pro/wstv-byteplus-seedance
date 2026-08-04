import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthConfiguration, SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';
import { mutationRequestError } from '@/lib/security/origin';

const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/auth/session']);

function privateResponse(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function unauthenticatedResponse(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return privateResponse({ error: 'Authentication required' }, 401);
  }

  const loginUrl = new URL('/login', request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('next', next);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const originError = mutationRequestError(request);
    if (originError) return privateResponse({ error: originError }, 403);
  }

  const config = getAuthConfiguration();
  if (!config.enabled) return NextResponse.next();
  if (config.issue) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return privateResponse({ error: 'Authentication is unavailable' }, 503);
    }
    return new NextResponse('Authentication is unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return unauthenticatedResponse(request);

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
