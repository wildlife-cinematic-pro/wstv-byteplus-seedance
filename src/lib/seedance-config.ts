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
 *   ARK_BASE_URL  — optional override for the ModelArk base URL.
 *
 * Nothing here makes a network call. It only reads/validates env config so the
 * rest of the app can ask "is the key configured?" without touching the value.
 */

const DEFAULT_ARK_BASE_URL = 'https://ark.ap-southeast.bytepluses.com';

/** Raw API key from the environment (server-side only). Empty string if unset. */
export function getArkApiKey(): string {
  return (process.env.ARK_API_KEY ?? '').trim();
}

/** Base URL for the ModelArk API, overridable via ARK_BASE_URL. */
export function getArkBaseUrl(): string {
  const fromEnv = (process.env.ARK_BASE_URL ?? '').trim();
  return (fromEnv || DEFAULT_ARK_BASE_URL).replace(/\/+$/, '');
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
  const base = getArkBaseUrl();
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
