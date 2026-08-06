import { describe, it, after } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getAuthConfiguration, SESSION_COOKIE_NAME } from './session';
import { getAllowedOrigins } from '../security/origin';
import { verifyPassword } from './password';

// ─── Environment helpers ───

const AUTH_ENV_KEYS = [
  'NODE_ENV',
  'ASTV_AUTH_ENABLED',
  'ASTV_AUTH_USER',
  'ASTV_AUTH_PASSWORD',
  'ASTV_AUTH_PASSWORD_HASH',
  'ASTV_SESSION_SECRET',
  'ASTV_SESSION_HOURS',
  'ASTV_ALLOWED_ORIGINS',
  'WSTV_AUTH_ENABLED',
  'WSTV_AUTH_USER',
  'WSTV_AUTH_PASSWORD',
  'WSTV_AUTH_PASSWORD_HASH',
  'WSTV_SESSION_SECRET',
  'WSTV_SESSION_HOURS',
  'WSTV_ALLOWED_ORIGINS',
];

const originalEnv: Record<string, string | undefined> = {};
for (const key of AUTH_ENV_KEYS) originalEnv[key] = process.env[key];

after(() => {
  for (const key of AUTH_ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function setEnv(values: Record<string, string>) {
  for (const key of AUTH_ENV_KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
}

const VALID_SESSION_SECRET = 'a'.repeat(32);
const VALID_PASSWORD_HASH =
  'scrypt$16384$8$1$c2FsdHNhbHRzYWx0c2FsdA$aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g';

function validAuthEnv(overrides: Record<string, string> = {}) {
  return {
    ASTV_AUTH_ENABLED: 'true',
    ASTV_AUTH_USER: 'operator',
    ASTV_AUTH_PASSWORD_HASH: VALID_PASSWORD_HASH,
    ASTV_SESSION_SECRET: VALID_SESSION_SECRET,
    ASTV_SESSION_HOURS: '8',
    ASTV_ALLOWED_ORIGINS: 'http://127.0.0.1:3000,http://localhost:3000',
    ...overrides,
  };
}

// ─── Namespace contract tests ───

describe('ASTV authentication namespace', () => {
  it('uses astv_session as the session cookie name', () => {
    strictAssert.equal(SESSION_COOKIE_NAME, 'astv_session');
  });

  it('uses ASTV_AUTH_ENABLED to enable authentication', () => {
    setEnv(validAuthEnv());
    const enabled = getAuthConfiguration();
    strictAssert.equal(enabled.enabled, true);
    strictAssert.equal(enabled.issue, null);

    setEnv({ ...validAuthEnv(), ASTV_AUTH_ENABLED: 'false' });
    const disabled = getAuthConfiguration();
    strictAssert.equal(disabled.enabled, false);
  });

  it('uses ASTV_AUTH_USER as the authenticated username', () => {
    setEnv(validAuthEnv({ ASTV_AUTH_USER: 'astv-operator' }));
    strictAssert.equal(getAuthConfiguration().username, 'astv-operator');
  });

  it('uses ASTV_AUTH_PASSWORD_HASH (scrypt) as the stored credential', () => {
    setEnv(validAuthEnv());
    strictAssert.equal(getAuthConfiguration().passwordHash, VALID_PASSWORD_HASH);
  });

  it('uses ASTV_SESSION_SECRET (min 32 chars) for token signing', () => {
    setEnv(validAuthEnv());
    strictAssert.equal(getAuthConfiguration().sessionSecret, VALID_SESSION_SECRET);

    setEnv(validAuthEnv({ ASTV_SESSION_SECRET: 'short' }));
    const short = getAuthConfiguration();
    strictAssert.equal(short.sessionSecret, 'short');
    strictAssert.ok(short.issue, 'short session secret must produce a configuration issue');
  });

  it('uses ASTV_SESSION_HOURS (1..8) for session duration', () => {
    setEnv(validAuthEnv({ ASTV_SESSION_HOURS: '4' }));
    strictAssert.equal(getAuthConfiguration().sessionHours, 4);

    setEnv(validAuthEnv({ ASTV_SESSION_HOURS: '0' }));
    strictAssert.ok(getAuthConfiguration().issue, '0 hours must fail closed');

    setEnv(validAuthEnv({ ASTV_SESSION_HOURS: '9' }));
    strictAssert.ok(getAuthConfiguration().issue, '9 hours must fail closed');
  });

  it('uses ASTV_ALLOWED_ORIGINS for the origin allow-list', () => {
    setEnv({ ASTV_ALLOWED_ORIGINS: 'https://astv.example.com, https://alt.example.com' });
    const origins = getAllowedOrigins();
    strictAssert.ok(origins.includes('https://astv.example.com'));
    strictAssert.ok(origins.includes('https://alt.example.com'));
  });

  it('does not read a plaintext ASTV_AUTH_PASSWORD variable', async () => {
    // A plaintext password variable must never satisfy the credential requirement.
    setEnv(validAuthEnv({ ASTV_AUTH_PASSWORD: 'hunter2', ASTV_AUTH_PASSWORD_HASH: '' }));
    strictAssert.equal(getAuthConfiguration().passwordHash, null);

    // And a plaintext string is not a valid scrypt hash, so it cannot verify.
    strictAssert.equal(await verifyPassword('hunter2', 'hunter2'), false);
  });

  it('old WSTV auth variable names are absent from the auth sources', () => {
    for (const path of ['./session.ts', '../security/origin.ts']) {
      const source = readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
      strictAssert.ok(!source.includes('WSTV_AUTH_'), `${path} must not reference WSTV_AUTH_`);
      strictAssert.ok(!source.includes('WSTV_SESSION_'), `${path} must not reference WSTV_SESSION_`);
      strictAssert.ok(!source.includes('WSTV_ALLOWED_ORIGINS'), `${path} must not reference WSTV_ALLOWED_ORIGINS`);
      strictAssert.ok(!source.includes('wstv_session'), `${path} must not reference wstv_session`);
    }
  });

  it('ignores legacy WSTV env vars when ASTV vars are missing', () => {
    setEnv({
      WSTV_AUTH_ENABLED: 'true',
      WSTV_AUTH_USER: 'legacy-user',
      WSTV_AUTH_PASSWORD_HASH: VALID_PASSWORD_HASH,
      WSTV_SESSION_SECRET: VALID_SESSION_SECRET,
      WSTV_SESSION_HOURS: '8',
    });
    const config = getAuthConfiguration();
    strictAssert.equal(config.username, null, 'legacy WSTV_AUTH_USER must not be read');
    strictAssert.equal(config.passwordHash, null, 'legacy WSTV_AUTH_PASSWORD_HASH must not be read');
    strictAssert.equal(config.sessionSecret, null, 'legacy WSTV_SESSION_SECRET must not be read');
    strictAssert.equal(config.sessionHours, 8);
  });

  it('invalid or missing production auth still fails closed', () => {
    setEnv({ NODE_ENV: 'production' });
    const missing = getAuthConfiguration();
    strictAssert.equal(missing.enabled, true);
    strictAssert.ok(missing.issue, 'production without ASTV_AUTH_ENABLED must fail closed');

    setEnv({ NODE_ENV: 'production', ...validAuthEnv(), ASTV_SESSION_SECRET: 'too-short' });
    const invalidSecret = getAuthConfiguration();
    strictAssert.equal(invalidSecret.enabled, true);
    strictAssert.ok(invalidSecret.issue, 'production with a short session secret must fail closed');

    setEnv({ NODE_ENV: 'production', ...validAuthEnv() });
    const valid = getAuthConfiguration();
    strictAssert.equal(valid.enabled, true);
    strictAssert.equal(valid.issue, null);
  });
});
