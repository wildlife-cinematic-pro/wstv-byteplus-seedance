import { NextResponse, type NextRequest } from 'next/server';
import { getAuthConfiguration, SESSION_COOKIE_NAME, verifySessionToken, type SessionUser } from './session';
import { mutationRequestError } from '@/lib/security/origin';

export type GuardResult = { user: SessionUser } | { response: NextResponse };

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };

export function privateJson(data: unknown, init: ResponseInit = {}): NextResponse {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(PRIVATE_HEADERS)) headers.set(name, value);
  return NextResponse.json(data, {
    ...init,
    headers,
  });
}

export async function requireAuthenticatedUser(request: NextRequest): Promise<GuardResult> {
  const config = getAuthConfiguration();
  if (!config.enabled) {
    return { user: { username: 'local-development', issuedAt: 0, expiresAt: Number.MAX_SAFE_INTEGER } };
  }
  if (config.issue) {
    return { response: privateJson({ error: 'Authentication is unavailable' }, { status: 503 }) };
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return { response: privateJson({ error: 'Authentication required' }, { status: 401 }) };
  return { user: session };
}

export async function requireProtectedMutation(request: NextRequest): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) return auth;
  const originError = mutationRequestError(request);
  if (originError) return { response: privateJson({ error: originError }, { status: 403 }) };
  return auth;
}
