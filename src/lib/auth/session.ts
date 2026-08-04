export const SESSION_COOKIE_NAME = 'wstv_session';
const MAX_SESSION_HOURS = 8;

export type AuthConfiguration = {
  enabled: boolean;
  issue: string | null;
  username: string | null;
  passwordHash: string | null;
  sessionSecret: string | null;
  sessionHours: number;
};

export type SessionUser = {
  username: string;
  issuedAt: number;
  expiresAt: number;
};

type SessionPayload = {
  v: 1;
  u: string;
  iat: number;
  exp: number;
};

function envTrue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

function parseSessionHours(value: string | undefined): number | null {
  if (value == null || value.trim() === '') return MAX_SESSION_HOURS;
  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_SESSION_HOURS) return null;
  return hours;
}

export function getAuthConfiguration(): AuthConfiguration {
  const production = process.env.NODE_ENV === 'production';
  const requested = envTrue(process.env.WSTV_AUTH_ENABLED);

  if (!production && !requested) {
    return {
      enabled: false,
      issue: null,
      username: null,
      passwordHash: null,
      sessionSecret: null,
      sessionHours: MAX_SESSION_HOURS,
    };
  }

  const username = process.env.WSTV_AUTH_USER?.trim() || null;
  const passwordHash = process.env.WSTV_AUTH_PASSWORD_HASH?.trim() || null;
  const sessionSecret = process.env.WSTV_SESSION_SECRET?.trim() || null;
  const sessionHours = parseSessionHours(process.env.WSTV_SESSION_HOURS);
  const issues: string[] = [];

  if (production && !requested) issues.push('WSTV_AUTH_ENABLED=true is required in production');
  if (!username) issues.push('WSTV_AUTH_USER is required');
  if (!passwordHash) issues.push('WSTV_AUTH_PASSWORD_HASH is required');
  if (!sessionSecret || sessionSecret.length < 32) issues.push('WSTV_SESSION_SECRET must be at least 32 characters');
  if (sessionHours == null) issues.push(`WSTV_SESSION_HOURS must be an integer from 1 to ${MAX_SESSION_HOURS}`);

  return {
    enabled: true,
    issue: issues.length ? 'Authentication configuration is invalid' : null,
    username,
    passwordHash,
    sessionSecret,
    sessionHours: sessionHours ?? MAX_SESSION_HOURS,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  try {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
    const decoded = atob(base64);
    return Uint8Array.from(decoded, char => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function createSessionToken(username: string): Promise<{ token: string; maxAge: number }> {
  const config = getAuthConfiguration();
  if (!config.enabled || config.issue || !config.sessionSecret) throw new Error('Authentication is unavailable');

  const issuedAt = Math.floor(Date.now() / 1000);
  const maxAge = config.sessionHours * 60 * 60;
  const payload: SessionPayload = { v: 1, u: username, iat: issuedAt, exp: issuedAt + maxAge };
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload, config.sessionSecret);
  return { token: `${encodedPayload}.${signature}`, maxAge };
}

export async function verifySessionToken(token: string | undefined): Promise<SessionUser | null> {
  const config = getAuthConfiguration();
  if (!config.enabled || config.issue || !config.sessionSecret || !config.username || !token) return null;

  const [encodedPayload, encodedSignature, ...extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra.length) return null;
  const suppliedSignature = base64UrlToBytes(encodedSignature);
  if (!suppliedSignature) return null;

  const expectedSignature = base64UrlToBytes(await sign(encodedPayload, config.sessionSecret));
  if (!expectedSignature || !equalBytes(suppliedSignature, expectedSignature)) return null;

  const payloadBytes = base64UrlToBytes(encodedPayload);
  if (!payloadBytes) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    const issuedAt = payload.iat;
    const expiresAt = payload.exp;
    if (
      payload.v !== 1 ||
      payload.u !== config.username ||
      typeof issuedAt !== 'number' || !Number.isInteger(issuedAt) ||
      typeof expiresAt !== 'number' || !Number.isInteger(expiresAt) ||
      expiresAt <= now ||
      expiresAt - issuedAt > MAX_SESSION_HOURS * 60 * 60
    ) {
      return null;
    }
    return { username: payload.u, issuedAt, expiresAt };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}
