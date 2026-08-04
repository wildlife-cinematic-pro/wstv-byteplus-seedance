import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfiguration, SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const config = getAuthConfiguration();
  if (config.issue) {
    return NextResponse.json({ authenticated: false }, {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  if (!config.enabled) {
    return NextResponse.json({ authenticated: true, developmentAuthDisabled: true }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  return NextResponse.json({ authenticated: Boolean(session) }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
