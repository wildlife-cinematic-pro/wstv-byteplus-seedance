import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { getArkEndpoints, requireArkApiKey } from './seedance-config';

export const REAL_BYTEPLUS_CONFIRMATION = 'CONFIRM_REAL_PAID_BYTEPLUS_GENERATION';

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

export interface NormalizedBytePlusTaskStatus {
  providerTaskId: string;
  status: 'submitted' | 'queued' | 'running' | 'pending' | 'processing' | 'in_progress' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
  rawStatus: string;
  videoUrl: string | null;
  lastFrameUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  completionTokens: number | null;
  totalTokens: number | null;
  raw: unknown;
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

export async function createBytePlusSeedanceTask(payload: Record<string, unknown>) {
  assertRealBytePlusAllowed();
  const response = await fetch(getArkEndpoints().createTask, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireArkApiKey()}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.json().catch(() => null) as BytePlusCreateTaskResponse | null;
  if (!response.ok) {
    throw new Error(`BytePlus create task failed with HTTP ${response.status}.`);
  }

  // Official docs in this repo describe create-task as returning `task_id`.
  // TODO: If BytePlus Console/API Explorer shows an envelope wrapper for this
  // account, unwrap it here while keeping this route server-side only.
  const providerTaskId = raw?.task_id ?? raw?.id;
  if (!providerTaskId) {
    throw new Error('BytePlus create task response did not include task_id.');
  }

  return { providerTaskId, raw };
}

export async function getBytePlusSeedanceTaskStatus(providerTaskId: string): Promise<NormalizedBytePlusTaskStatus> {
  // Status retrieval does not create a paid task. It requires only the
  // server-side API key and never exposes that key to the browser.
  const key = requireArkApiKey();
  const response = await fetch(getArkEndpoints().getTask(providerTaskId), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  const raw = await response.json().catch(() => null) as BytePlusTaskStatusResponse | null;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`BytePlus authentication failed with HTTP ${response.status}. Check the server-side API key and ModelArk permissions.`);
    }
    if (response.status === 404) {
      throw new Error(`BytePlus task not found: ${providerTaskId}.`);
    }
    throw new Error(`BytePlus task status failed with HTTP ${response.status}.`);
  }

  // Official docs in this repo reference `status`, `content.video_url`, and
  // `usage.completion_tokens`. Keep this adapter narrow until API Explorer
  // confirms any account-specific envelope shape.
  const rawStatus = (raw?.status ?? 'submitted').toLowerCase();
  const normalizedStatus: NormalizedBytePlusTaskStatus['status'] =
    rawStatus === 'succeeded' ? 'succeeded' :
    rawStatus === 'failed' ? 'failed' :
    rawStatus === 'expired' ? 'expired' :
    rawStatus === 'cancelled' ? 'cancelled' :
    rawStatus === 'queued' ? 'queued' :
    rawStatus === 'running' ? 'running' :
    rawStatus === 'pending' ? 'pending' :
    rawStatus === 'processing' ? 'processing' :
    rawStatus === 'in_progress' ? 'in_progress' :
    'submitted';

  return {
    providerTaskId: raw?.task_id ?? raw?.id ?? providerTaskId,
    status: normalizedStatus,
    rawStatus,
    videoUrl: raw?.content?.video_url ?? null,
    lastFrameUrl: raw?.content?.last_frame_url ?? null,
    errorCode: raw?.error?.code ?? null,
    errorMessage: raw?.error?.message ?? null,
    completionTokens: typeof raw?.usage?.completion_tokens === 'number' ? raw.usage.completion_tokens : null,
    totalTokens: typeof raw?.usage?.total_tokens === 'number' ? raw.usage.total_tokens : null,
    raw,
  };
}

export function safeVideoFilename(input: string | null | undefined, fallbackPrefix: string) {
  const base = (input || '').trim() || `${fallbackPrefix}-${Date.now()}.mp4`;
  const withExtension = path.extname(base) ? base : `${base}.mp4`;
  const safe = path.basename(withExtension).replace(/[^a-zA-Z0-9._-]/g, '-');
  return safe.endsWith('.mp4') || safe.endsWith('.mov') || safe.endsWith('.webm') ? safe : `${safe}.mp4`;
}

export async function downloadVideoToOutputFolder(params: {
  videoUrl: string;
  outputFolder: string;
  filename: string;
}) {
  await mkdir(params.outputFolder, { recursive: true });
  const resolvedFolder = path.resolve(params.outputFolder);
  const safeName = safeVideoFilename(params.filename, 'seedance-real');
  const resolvedFile = path.resolve(resolvedFolder, safeName);
  if (!resolvedFile.startsWith(resolvedFolder + path.sep)) {
    throw new Error('Resolved output video path is outside the configured output folder.');
  }

  const response = await fetch(params.videoUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Video download failed with HTTP ${response.status}.`);
  }

  const webStream = response.body as Parameters<typeof Readable.fromWeb>[0];
  await pipeline(Readable.fromWeb(webStream), createWriteStream(resolvedFile));
  return { filename: safeName, filePath: resolvedFile };
}
