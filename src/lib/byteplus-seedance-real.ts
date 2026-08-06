import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { getArkEndpoints, requireArkApiKey } from './seedance-config';

// ─── Timeouts (server-side HTTP reliability) ───
// No official request-level timeout is documented; these prevent an
// uncontrolled hanging request on an unresponsive provider.
export const ARK_REQUEST_TIMEOUT_MS = 30_000;
export const ARK_DOWNLOAD_TIMEOUT_MS = 120_000;

export interface BytePlusCreateTaskResponse {
  id?: string;
  task_id?: string;
}

export interface BytePlusTaskStatusResponse {
  id?: string;
  task_id?: string;
  status?: string;
  content?: {
    video_url?: string;
    last_frame_url?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
  usage?: {
    total_tokens?: number;
    completion_tokens?: number;
  };
}

/**
 * Official status values (Retrieve a video generation task): queued, running,
 * cancelled, succeeded, failed, expired. `submitted`/`pending`/`processing`/
 * `in_progress` are accepted as legacy pass-through values. Anything else maps
 * to `unknown` so the app never mislabels an unrecognized provider state as a
 * known one (previously unknown states silently became `submitted`).
 */
export type ArkNormalizedStatus =
  | 'submitted' | 'queued' | 'running' | 'pending' | 'processing' | 'in_progress'
  | 'succeeded' | 'failed' | 'cancelled' | 'expired' | 'unknown';

export interface NormalizedBytePlusTaskStatus {
  providerTaskId: string;
  status: ArkNormalizedStatus;
  rawStatus: string;
  videoUrl: string | null;
  lastFrameUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

/**
 * Narrow transport options. `fetchImpl` is the injection seam used by the
 * offline mock contract tests; production callers omit it and use the global
 * fetch. `timeoutMs` overrides the default request timeout.
 */
export interface ArkTransportOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Provider error with sanitized, server-side-only metadata. */
export class BytePlusProviderError extends Error {
  readonly statusCode: number | null;
  readonly providerCode: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    options: { statusCode?: number | null; providerCode?: string | null; retryAfterSeconds?: number | null } = {},
  ) {
    super(message);
    this.name = 'BytePlusProviderError';
    this.statusCode = options.statusCode ?? null;
    this.providerCode = options.providerCode ?? null;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

/** Strips control characters, collapses whitespace, and caps provider messages (sanitization). */
function sanitizeProviderMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, 300) : null;
}

/** AbortController-backed fetch with an explicit timeout. */
async function arkFetch(input: string, init: RequestInit, options: ArkTransportOptions): Promise<Response> {
  const fetcher = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? ARK_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new BytePlusProviderError(`BytePlus request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Extracts only documented error fields from a provider response body. */
function parseProviderErrorDetails(raw: unknown, status: number, headers: Headers): {
  providerCode: string | null;
  providerMessage: string | null;
  retryAfterSeconds: number | null;
} {
  const error = (raw as { error?: { code?: unknown; message?: unknown } } | null)?.error;
  const providerCode = typeof error?.code === 'string' && error.code.trim() ? error.code.trim() : null;
  const providerMessage = sanitizeProviderMessage(error?.message);
  let retryAfterSeconds: number | null = null;
  if (status === 429) {
    const retryAfter = headers.get('retry-after');
    if (retryAfter) {
      const parsed = Number(retryAfter);
      retryAfterSeconds = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
    }
  }
  return { providerCode, providerMessage, retryAfterSeconds };
}

export function getRealApiEnvStatus() {
  const dryRun = (process.env.DRY_RUN ?? 'true').trim().toLowerCase() !== 'false';
  const enableRealApi = (process.env.ENABLE_REAL_API ?? '').trim().toLowerCase() === 'true';
  const allowPaidCalls = (process.env.ALLOW_PAID_CALLS ?? '').trim().toLowerCase() === 'true';
  const keyConfigured = (process.env.ARK_API_KEY ?? '').trim().length > 0;

  return {
    dryRun,
    enableRealApi,
    allowPaidCalls,
    keyConfigured,
    realApiAllowed: !dryRun && enableRealApi && allowPaidCalls && keyConfigured,
  };
}

export function getRealApiBlockReason(): string | null {
  const status = getRealApiEnvStatus();
  if (status.dryRun) return 'Real BytePlus API is blocked because DRY_RUN is not false.';
  if (!status.enableRealApi) return 'Real BytePlus API is blocked because ENABLE_REAL_API is not true.';
  if (!status.allowPaidCalls) return 'Real BytePlus API is blocked because ALLOW_PAID_CALLS is not true.';
  if (!status.keyConfigured) return 'Real BytePlus API is blocked because the server-side API key is missing.';
  return null;
}

export function assertRealBytePlusAllowed() {
  const reason = getRealApiBlockReason();
  if (reason) {
    throw new Error(reason);
  }
}

export async function createBytePlusSeedanceTask(
  payload: Record<string, unknown>,
  options: ArkTransportOptions = {},
) {
  assertRealBytePlusAllowed();
  const response = await arkFetch(getArkEndpoints().createTask, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireArkApiKey()}`,
    },
    body: JSON.stringify(payload),
  }, options);

  const raw = await response.json().catch(() => null) as
    | BytePlusCreateTaskResponse
    | { error?: { code?: unknown; message?: unknown } }
    | null;

  if (!response.ok) {
    const { providerCode, providerMessage, retryAfterSeconds } = parseProviderErrorDetails(raw, response.status, response.headers);
    const parts = [`BytePlus create task failed with HTTP ${response.status}.`];
    if (providerCode) parts.push(`code=${providerCode}.`);
    if (providerMessage) parts.push(providerMessage);
    if (retryAfterSeconds != null) parts.push(`retry-after=${retryAfterSeconds}s.`);
    throw new BytePlusProviderError(parts.join(' '), {
      statusCode: response.status,
      providerCode,
      retryAfterSeconds,
    });
  }

  // Official docs return the task identifier as `id` (e.g. "cgt-2026***").
  // `task_id` is accepted for compatibility. No fabricated IDs: the value must
  // come from the provider response.
  const createResponse = raw as BytePlusCreateTaskResponse | null;
  const providerTaskId = createResponse?.task_id ?? createResponse?.id;
  if (typeof providerTaskId !== 'string' || !providerTaskId.trim()) {
    throw new BytePlusProviderError('BytePlus create task response did not include a valid task id.');
  }

  return { providerTaskId: providerTaskId.trim() };
}

export async function getBytePlusSeedanceTaskStatus(
  providerTaskId: string,
  options: ArkTransportOptions = {},
): Promise<NormalizedBytePlusTaskStatus> {
  // Status retrieval does not create a paid task. It requires only the
  // server-side API key and never exposes that key to the browser.
  const key = requireArkApiKey();
  const response = await arkFetch(getArkEndpoints().getTask(providerTaskId), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
    },
  }, options);

  const raw = await response.json().catch(() => null) as BytePlusTaskStatusResponse | null;

  if (!response.ok) {
    const { providerCode, providerMessage, retryAfterSeconds } = parseProviderErrorDetails(raw, response.status, response.headers);
    if (response.status === 401 || response.status === 403) {
      throw new BytePlusProviderError(
        'BytePlus authentication failed. Check the server-side API key and ModelArk permissions.',
        { statusCode: response.status, providerCode },
      );
    }
    if (response.status === 404) {
      throw new BytePlusProviderError(`BytePlus task not found: ${providerTaskId}.`, {
        statusCode: response.status,
        providerCode,
      });
    }
    const parts = [`BytePlus task status failed with HTTP ${response.status}.`];
    if (providerCode) parts.push(`code=${providerCode}.`);
    if (providerMessage) parts.push(providerMessage);
    if (retryAfterSeconds != null) parts.push(`retry-after=${retryAfterSeconds}s.`);
    throw new BytePlusProviderError(parts.join(' '), {
      statusCode: response.status,
      providerCode,
      retryAfterSeconds,
    });
  }

  const rawStatus = (raw?.status ?? '').trim().toLowerCase();
  const normalizedStatus: ArkNormalizedStatus =
    rawStatus === 'succeeded' ? 'succeeded' :
    rawStatus === 'failed' ? 'failed' :
    rawStatus === 'expired' ? 'expired' :
    rawStatus === 'cancelled' ? 'cancelled' :
    rawStatus === 'queued' ? 'queued' :
    rawStatus === 'running' ? 'running' :
    rawStatus === 'pending' ? 'pending' :
    rawStatus === 'processing' ? 'processing' :
    rawStatus === 'in_progress' ? 'in_progress' :
    rawStatus === 'submitted' ? 'submitted' :
    'unknown';

  return {
    providerTaskId: raw?.task_id ?? raw?.id ?? providerTaskId,
    status: normalizedStatus,
    rawStatus: rawStatus || 'unknown',
    videoUrl: raw?.content?.video_url ?? null,
    lastFrameUrl: raw?.content?.last_frame_url ?? null,
    errorCode: typeof raw?.error?.code === 'string' && raw.error.code ? raw.error.code : null,
    errorMessage: sanitizeProviderMessage(raw?.error?.message),
    completionTokens: typeof raw?.usage?.completion_tokens === 'number' ? raw.usage.completion_tokens : null,
    totalTokens: typeof raw?.usage?.total_tokens === 'number' ? raw.usage.total_tokens : null,
  };
}

export function safeVideoFilename(input: string | null | undefined, fallbackPrefix: string) {
  const base = (input || '').trim() || `${fallbackPrefix}-${Date.now()}.mp4`;
  const withExtension = path.extname(base) ? base : `${base}.mp4`;
  const safe = path.basename(withExtension).replace(/[^a-zA-Z0-9._-]/g, '-');
  return safe.endsWith('.mp4') || safe.endsWith('.mov') || safe.endsWith('.webm') ? safe : `${safe}.mp4`;
}

export async function downloadVideoToOutputFolder(
  params: {
    videoUrl: string;
    outputFolder: string;
    filename: string;
  },
  options: ArkTransportOptions = {},
) {
  await mkdir(params.outputFolder, { recursive: true });
  const resolvedFolder = path.resolve(params.outputFolder);
  const safeName = safeVideoFilename(params.filename, 'seedance-real');
  const resolvedFile = path.resolve(resolvedFolder, safeName);
  if (!resolvedFile.startsWith(resolvedFolder + path.sep)) {
    throw new Error('Resolved output video path is outside the configured output folder.');
  }

  // Provider output URLs are HTTPS and expire after 24 hours (official docs);
  // reject anything else before fetching so a malformed/compromised provider
  // response can never point the downloader at a non-HTTPS destination.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(params.videoUrl);
  } catch {
    throw new Error('Provider returned an invalid video URL.');
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Provider video URL must be HTTPS.');
  }

  const response = await arkFetch(params.videoUrl, {}, {
    ...options,
    timeoutMs: options.timeoutMs ?? ARK_DOWNLOAD_TIMEOUT_MS,
  });
  if (!response.ok || !response.body) {
    throw new Error(`Video download failed with HTTP ${response.status}.`);
  }

  const webStream = response.body as Parameters<typeof Readable.fromWeb>[0];
  await pipeline(Readable.fromWeb(webStream), createWriteStream(resolvedFile));
  return { filename: safeName, filePath: resolvedFile };
}
