import { describe, it, after } from 'node:test';
import strictAssert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { mutationRequestError } from './origin';

const originalAllowedOrigins = process.env.ASTV_ALLOWED_ORIGINS;

after(() => {
  if (originalAllowedOrigins === undefined) delete process.env.ASTV_ALLOWED_ORIGINS;
  else process.env.ASTV_ALLOWED_ORIGINS = originalAllowedOrigins;
});

function jsonRequest(url: string, origin: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin, ...headers },
  });
}

describe('mutationRequestError origin checks', () => {
  it('allows a same-origin localhost request', () => {
    delete process.env.ASTV_ALLOWED_ORIGINS;
    const request = jsonRequest('http://localhost:3000/api/auth/login', 'http://localhost:3000');
    strictAssert.equal(mutationRequestError(request), null);
  });

  it('allows a same-origin Vercel preview request without an allow-list entry', () => {
    delete process.env.ASTV_ALLOWED_ORIGINS;
    const request = jsonRequest(
      'https://astv-preview-abc123.vercel.app/api/auth/login',
      'https://astv-preview-abc123.vercel.app'
    );
    strictAssert.equal(mutationRequestError(request), null);
  });

  it('allows a configured allowed origin that is not the request origin', () => {
    process.env.ASTV_ALLOWED_ORIGINS = 'https://trusted.example.com';
    const request = jsonRequest('https://app.example.com/api/auth/login', 'https://trusted.example.com');
    strictAssert.equal(mutationRequestError(request), null);
  });

  it('rejects a cross-origin request that is neither same-origin nor allow-listed', () => {
    process.env.ASTV_ALLOWED_ORIGINS = 'https://trusted.example.com';
    const request = jsonRequest('https://app.example.com/api/auth/login', 'https://evil.example.com');
    strictAssert.ok(typeof mutationRequestError(request) === 'string');
  });

  it('rejects a request with no Origin header', () => {
    delete process.env.ASTV_ALLOWED_ORIGINS;
    const request = new NextRequest('https://astv-preview-abc123.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    strictAssert.ok(typeof mutationRequestError(request) === 'string');
  });

  it('still requires a JSON content type for same-origin requests', () => {
    delete process.env.ASTV_ALLOWED_ORIGINS;
    const request = jsonRequest(
      'https://astv-preview-abc123.vercel.app/api/auth/login',
      'https://astv-preview-abc123.vercel.app',
      { 'content-type': 'text/plain' }
    );
    strictAssert.ok(typeof mutationRequestError(request) === 'string');
  });

  it('still rejects same-origin requests flagged as cross-site', () => {
    delete process.env.ASTV_ALLOWED_ORIGINS;
    const request = jsonRequest(
      'https://astv-preview-abc123.vercel.app/api/auth/login',
      'https://astv-preview-abc123.vercel.app',
      { 'sec-fetch-site': 'cross-site' }
    );
    strictAssert.ok(typeof mutationRequestError(request) === 'string');
  });
});
