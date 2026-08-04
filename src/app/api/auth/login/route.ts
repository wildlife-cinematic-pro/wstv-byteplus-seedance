import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth/password';
import { getAuthConfiguration, createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/auth/session';
import { InMemoryLoginRateLimiter } from '@/lib/auth/login-rate-limit';
import { mutationRequestError } from '@/lib/security/origin';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(256),
  password: z.string().min(1).max(4_096),
}).strict();

const loginRateLimiter = new InMemoryLoginRateLimiter();

function privateJson(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function clientKey(request: NextRequest): string {
  // Forwarded headers are user-controlled on a direct connection. They are
  // considered only when an operator explicitly configures a trusted proxy.
  if (process.env.WSTV_TRUST_PROXY === 'true') {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded && isIP(forwarded)) return `forwarded:${forwarded}`;
  }

  // The normal deployment is loopback-only, so this safe fallback deliberately
  // shares one bucket instead of trusting spoofable request headers or Host.
  return 'direct-loopback';
}

export async function POST(request: NextRequest) {
  const originError = mutationRequestError(request);
  if (originError) {
    return privateJson({ error: 'Invalid login request' }, 403);
  }

  const config = getAuthConfiguration();
  if (!config.enabled || config.issue || !config.username || !config.passwordHash) {
    return privateJson({ error: 'Authentication is unavailable' }, 503);
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: 'Invalid username or password' }, 401);
  }

  const key = clientKey(request);
  const reservation = loginRateLimiter.tryReserve(key);
  if (!reservation) {
    return privateJson({ error: 'Too many login attempts. Please try again later.' }, 429);
  }

  try {
    const validUsername = parsed.data.username === config.username;
    const validPassword = await verifyPassword(parsed.data.password, config.passwordHash);
    if (!validUsername || !validPassword) {
      if (reservation.recordFailure()) {
        return privateJson({ error: 'Too many login attempts. Please try again later.' }, 429);
      }
      return privateJson({ error: 'Invalid username or password' }, 401);
    }

    reservation.recordSuccess();
    const session = await createSessionToken(config.username);
    const response = privateJson({ authenticated: true }, 200);
    response.cookies.set(SESSION_COOKIE_NAME, session.token, sessionCookieOptions(session.maxAge));
    return response;
  } finally {
    reservation.release();
  }
}
