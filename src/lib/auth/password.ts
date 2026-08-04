import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
const KEY_LENGTH = 64;
const DEFAULT_N = 16_384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;

type PasswordHashParts = {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
};

function scrypt(password: string, salt: Buffer, keyLength: number, options: { N: number; r: number; p: number; maxmem: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}

function parsePasswordHash(value: string): PasswordHashParts | null {
  const [algorithm, nText, rText, pText, saltText, hashText] = value.split('$');
  const n = Number(nText);
  const r = Number(rText);
  const p = Number(pText);

  if (
    algorithm !== 'scrypt' ||
    !Number.isInteger(n) || n < 2 || (n & (n - 1)) !== 0 ||
    !Number.isInteger(r) || r < 1 ||
    !Number.isInteger(p) || p < 1 ||
    !saltText || !hashText
  ) {
    return null;
  }

  try {
    const salt = Buffer.from(saltText, 'base64url');
    const hash = Buffer.from(hashText, 'base64url');
    if (salt.length < 16 || hash.length !== KEY_LENGTH) return null;
    return { n, r, p, salt, hash };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error('Password must not be empty');

  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P,
    maxmem: 64 * 1024 * 1024,
  });

  return [
    'scrypt',
    DEFAULT_N,
    DEFAULT_R,
    DEFAULT_P,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const parts = parsePasswordHash(encodedHash);
  if (!parts || !password) return false;

  try {
    const derived = await scrypt(password, parts.salt, parts.hash.length, {
      N: parts.n,
      r: parts.r,
      p: parts.p,
      maxmem: 64 * 1024 * 1024,
    });
    return derived.length === parts.hash.length && timingSafeEqual(derived, parts.hash);
  } catch {
    return false;
  }
}
