import { getAuthConfiguration } from './session';

const NONCE_LIFETIME_SECONDS = 5 * 60;

type ConfirmationPayload = {
  v: 1;
  u: string;
  taskId: string;
  modelId: string;
  maxCostMicros: number;
  exp: number;
  nonce: string;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function costToMicros(cost: number): number {
  return Math.round(cost * 1_000_000);
}

export async function createPaidConfirmationNonce(input: {
  username: string;
  taskId: string;
  modelId: string;
  maxCostUsd: number;
}): Promise<string> {
  const config = getAuthConfiguration();
  if (!config.enabled || config.issue || !config.sessionSecret) throw new Error('Authentication is unavailable');
  const random = new Uint8Array(16);
  crypto.getRandomValues(random);
  const payload: ConfirmationPayload = {
    v: 1,
    u: input.username,
    taskId: input.taskId,
    modelId: input.modelId,
    maxCostMicros: costToMicros(input.maxCostUsd),
    exp: Math.floor(Date.now() / 1000) + NONCE_LIFETIME_SECONDS,
    nonce: bytesToBase64Url(random),
  };
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${encoded}.${await sign(encoded, config.sessionSecret)}`;
}

export async function verifyPaidConfirmationNonce(token: string, expected: {
  username: string;
  taskId: string;
  modelId: string;
  maxCostUsd: number;
}): Promise<boolean> {
  const config = getAuthConfiguration();
  if (!config.enabled || config.issue || !config.sessionSecret) return false;
  const [encoded, suppliedSignature, ...extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra.length) return false;
  const actual = base64UrlToBytes(suppliedSignature);
  const expectedSignature = base64UrlToBytes(await sign(encoded, config.sessionSecret));
  const payloadBytes = base64UrlToBytes(encoded);
  if (!actual || !expectedSignature || !payloadBytes || !equalBytes(actual, expectedSignature)) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<ConfirmationPayload>;
    return payload.v === 1 &&
      payload.u === expected.username &&
      payload.taskId === expected.taskId &&
      payload.modelId === expected.modelId &&
      payload.maxCostMicros === costToMicros(expected.maxCostUsd) &&
      typeof payload.nonce === 'string' && payload.nonce.length >= 16 &&
      typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
