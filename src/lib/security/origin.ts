import type { NextRequest } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = ['http://127.0.0.1:3000', 'http://localhost:3000'];

function normaliseOrigin(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    return parsed.origin === 'null' ? null : parsed.origin;
  } catch {
    return null;
  }
}

export function getAllowedOrigins(): string[] {
  const configured = process.env.ASTV_ALLOWED_ORIGINS;
  const candidates = configured?.split(',').map(value => value.trim()).filter(Boolean) ?? DEFAULT_ALLOWED_ORIGINS;
  const origins = candidates.map(normaliseOrigin).filter((value): value is string => value !== null);
  return origins.length ? [...new Set(origins)] : DEFAULT_ALLOWED_ORIGINS;
}

export function isAllowedOrigin(origin: string | null): boolean {
  const normalised = origin ? normaliseOrigin(origin) : null;
  return normalised !== null && getAllowedOrigins().includes(normalised);
}

export function mutationRequestError(request: Request, options: { requireJson?: boolean } = {}): string | null {
  const origin = request.headers.get('origin');
  if (!origin || !isAllowedOrigin(origin)) return 'Invalid request origin';

  if (options.requireJson !== false) {
    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('application/json')) return 'Content-Type must be application/json';
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return 'Cross-site request rejected';
  return null;
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return normaliseOrigin(origin) === new URL(request.url).origin;
}
