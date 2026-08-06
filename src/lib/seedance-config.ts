/**
 * Seedance / BytePlus ModelArk server-side configuration.
 * ======================================================
 *
 * SERVER-ONLY. Never import this from a Client Component — `ARK_API_KEY` must
 * never reach the browser bundle. Read it only inside API routes / server code.
 *
 * Values come from environment variables (see `.env.example`):
 *   ARK_API_KEY   — the BytePlus ModelArk API key (Bearer token). Required for
 *                   real generation; absent in dry-run / Safe Mode planning.
 *   ARK_BASE_URL  — optional override for the ModelArk base URL. Must be HTTPS
 *                   and (by default) an approved BytePlus host.
 *   ARK_ALLOW_CUSTOM_HOST — set to "true" to allow a non-approved host in
 *                   ARK_BASE_URL (private endpoint you fully control).
 *
 * Nothing here makes a network call. It only reads/validates env config so the
 * rest of the app can ask "is the key configured?" without touching the value.
 */

const DEFAULT_ARK_BASE_URL = 'https://ark.ap-southeast.bytepluses.com';

/**
 * Approved BytePlus ModelArk regional hosts, from the official Region
 * availability documentation (docs.byteplus.com ModelArk 2191806):
 *   ap-southeast-1  → https://ark.ap-southeast.bytepluses.com
 *   eu-west-1       → https://ark.eu-west.bytepluses.com
 * The Bearer API key is only ever sent to these hosts (or an operator-approved
 * private endpoint via ARK_ALLOW_CUSTOM_HOST=true).
 */
export const APPROVED_ARK_HOSTS = new Set([
  'ark.ap-southeast.bytepluses.com',
  'ark.eu-west.bytepluses.com',
]);

/** Raw API key from the environment (server-side only). Empty string if unset. */
export function getArkApiKey(): string {
  return (process.env.ARK_API_KEY ?? '').trim();
}

/** Base URL for the ModelArk API, overridable via ARK_BASE_URL. */
export function getArkBaseUrl(): string {
  const fromEnv = (process.env.ARK_BASE_URL ?? '').trim();
  return (fromEnv || DEFAULT_ARK_BASE_URL).replace(/\/+$/, '');
}

/**
 * Validates the effective base URL and returns it, throwing on failure.
 * - The URL must parse and use HTTPS (the Bearer key must never travel over
 *   plain HTTP).
 * - The host must be an approved BytePlus ModelArk host unless the operator
 *   explicitly opts in via ARK_ALLOW_CUSTOM_HOST=true.
 * Fails closed: a misconfigured ARK_BASE_URL blocks real API calls instead of
 * sending the key to an arbitrary endpoint.
 */
export function assertSecureArkBaseUrl(): string {
  const base = getArkBaseUrl();
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    throw new Error('ARK_BASE_URL is not a valid URL. Real BytePlus API calls are blocked.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('ARK_BASE_URL must use HTTPS. Real BytePlus API calls are blocked.');
  }
  const customAllowed = (process.env.ARK_ALLOW_CUSTOM_HOST ?? '').trim().toLowerCase() === 'true';
  if (!customAllowed && !APPROVED_ARK_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `ARK_BASE_URL host "${parsed.hostname}" is not an approved BytePlus ModelArk host. ` +
      'Set ARK_ALLOW_CUSTOM_HOST=true only for a private endpoint you fully control.'
    );
  }
  return base;
}

/** True when an ARK_API_KEY is present in the environment. Does not expose it. */
export function isArkConfigured(): boolean {
  return getArkApiKey().length > 0;
}

/**
 * Returns the key for an authenticated request, or throws if it is missing.
 * Use this at the point of a real API call so callers fail loudly rather than
 * sending an empty Bearer token.
 */
export function requireArkApiKey(): string {
  const key = getArkApiKey();
  if (!key) {
    throw new Error('ARK_API_KEY is not configured. Set it in .env.local (server-side only).');
  }
  return key;
}

/** Official ModelArk generation-task endpoints (built from the base URL). */
export function getArkEndpoints() {
  const base = assertSecureArkBaseUrl();
  return {
    base,
    createTask: `${base}/api/v3/contents/generations/tasks`,
    getTask: (id: string) => `${base}/api/v3/contents/generations/tasks/${id}`,
    listTasks: `${base}/api/v3/contents/generations/tasks`,
    cancelTask: (id: string) => `${base}/api/v3/contents/generations/tasks/${id}`,
  };
}

/**
 * A non-secret summary of the current config, safe to return to the client.
 * NEVER include the key itself.
 */
export function getArkConfigStatus(): { configured: boolean; baseUrl: string } {
  return {
    configured: isArkConfigured(),
    baseUrl: getArkBaseUrl(),
  };
}
