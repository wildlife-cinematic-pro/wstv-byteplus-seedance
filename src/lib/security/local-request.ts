import type { NextRequest } from 'next/server';
import path from 'node:path';
import { isSameOriginRequest } from './origin';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function isLoopbackRequest(request: NextRequest): boolean {
  const url = new URL(request.url);
  if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) return false;

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor && !forwardedFor.split(',').every(value => LOOPBACK_HOSTS.has(value.trim()))) return false;
  return isSameOriginRequest(request);
}

export function getOutputRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.WSTV_OUTPUT_ROOT || 'outputs');
}

export function getCollectionRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.WSTV_COLLECTION_ROOT || 'outputs/collection');
}
