import { NextRequest, NextResponse } from 'next/server';
import { requireProtectedMutation } from '@/lib/auth/guards';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;

  const response = NextResponse.json({ authenticated: false }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
