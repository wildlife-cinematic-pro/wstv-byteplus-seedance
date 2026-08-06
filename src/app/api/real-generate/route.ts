import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { createPaidConfirmationNonce, verifyPaidConfirmationNonce } from '@/lib/auth/paid-confirmation';
import { buildSeedancePayload, validateSeedancePayload, type GenerationMode, type SeedanceReferences } from '@/lib/seedance-validation';
import { estimateSeedancePlanningCost, resolveOfficialSeedanceModelId } from '@/lib/seedance-pricing';
import { createBytePlusSeedanceTask, getRealApiBlockReason, getRealApiEnvStatus } from '@/lib/byteplus-seedance-real';

export const runtime = 'nodejs';

const requestSchema = z.object({
  taskId: z.string().trim().min(1).max(120),
  confirmationNonce: z.string().trim().min(32).max(4_096),
}).strict();

type StoredDryRunResult = {
  references?: SeedanceReferences;
  generationMode?: GenerationMode;
  seedanceModelId?: string;
};

function parseStoredDryRunResult(value: string | null): StoredDryRunResult {
  if (!value) return {};
  try { return JSON.parse(value) as StoredDryRunResult; } catch { return {}; }
}

function refsFromTask(task: {
  masterImageUrl: string | null; storyboardImageUrl: string | null;
  audioUrl1: string | null; audioUrl2: string | null; audioUrl3: string | null;
  videoUrl1: string | null; videoUrl2: string | null; videoUrl3: string | null;
}): SeedanceReferences {
  return {
    images: [task.masterImageUrl, task.storyboardImageUrl].filter(Boolean).map(url => ({ role: 'reference_image', url: url as string })),
    videos: [task.videoUrl1, task.videoUrl2, task.videoUrl3].filter(Boolean).map(url => ({ role: 'reference_video', url: url as string })),
    audios: [task.audioUrl1, task.audioUrl2, task.audioUrl3].filter(Boolean).map(url => ({ role: 'reference_audio', url: url as string })),
  };
}

function publicApiStatus() {
  const status = getRealApiEnvStatus();
  return {
    ...status,
    message: status.realApiAllowed ? 'Real paid generation is enabled server-side.' : 'Real paid generation is disabled server-side.',
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  const taskId = new URL(request.url).searchParams.get('taskId');
  const status = publicApiStatus();
  if (!taskId || !status.realApiAllowed) return privateJson(status);

  try {
    const task = await db.videoTask.findUnique({ where: { id: taskId } });
    if (!task || !task.dryRunPassed || task.status !== 'dry_run_passed' || task.maxCostUsd == null) {
      return privateJson({ ...status, error: 'Task is not ready for paid submission' }, { status: 400 });
    }
    const modelId = resolveOfficialSeedanceModelId(task.modelId, task.modelType);
    const confirmationNonce = await createPaidConfirmationNonce({
      username: guard.user.username,
      taskId: task.id,
      modelId,
      maxCostUsd: task.maxCostUsd,
    });
    return privateJson({ ...status, confirmationNonce });
  } catch {
    console.error('Paid confirmation nonce failed');
    return privateJson({ ...status, error: 'Unable to prepare paid confirmation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ success: false, error: 'Invalid paid submission request' }, { status: 400 });

  if (getRealApiBlockReason()) {
    return privateJson({ success: false, blocked: true, error: 'Real paid generation is disabled server-side.' }, { status: 403 });
  }

  try {
    const task = await db.videoTask.findUnique({ where: { id: parsed.data.taskId } });
    if (!task) return privateJson({ success: false, error: 'Task not found' }, { status: 404 });
    if (task.status !== 'dry_run_passed' || !task.dryRunPassed || task.paidConfirmation) {
      return privateJson({ success: false, error: 'Task is not eligible for paid submission' }, { status: 409 });
    }
    if (task.maxCostUsd == null || !Number.isFinite(task.maxCostUsd) || task.maxCostUsd <= 0) {
      return privateJson({ success: false, error: 'A maximum cost is required' }, { status: 400 });
    }

    const settings = await db.dashboardSettings.findFirst();
    if (settings?.safeMode !== false) {
      return privateJson({ success: false, blocked: true, error: 'Safe Mode must be disabled before a paid submission.' }, { status: 403 });
    }
    const budget = await db.budgetSetting.findFirst();
    if (!budget) return privateJson({ success: false, error: 'Budget settings are required' }, { status: 400 });

    const dryRun = parseStoredDryRunResult(task.dryRunResult);
    const references = dryRun.references ?? refsFromTask(task);
    const generationMode = dryRun.generationMode ?? 'reference_mode';
    const modelId = resolveOfficialSeedanceModelId(dryRun.seedanceModelId ?? task.modelId, task.modelType);
    const nonceValid = await verifyPaidConfirmationNonce(parsed.data.confirmationNonce, {
      username: guard.user.username,
      taskId: task.id,
      modelId,
      maxCostUsd: task.maxCostUsd,
    });
    if (!nonceValid) return privateJson({ success: false, error: 'Paid confirmation expired or invalid' }, { status: 403 });

    const inputMode = references.videos.some(reference => reference.url.trim()) ? 'with_video' : 'without_video';
    const estimate = estimateSeedancePlanningCost({
      modelId, resolution: task.resolution, aspectRatio: task.aspectRatio,
      outputDurationSec: task.duration, inputMode,
    });
    if (estimate.estimatedCostUsd > task.maxCostUsd || estimate.estimatedCostUsd > budget.monthlyLimit - budget.spentThisMonth) {
      return privateJson({ success: false, error: 'The estimated cost exceeds an approved limit' }, { status: 400 });
    }

    const duplicate = await db.videoTask.findFirst({
      where: {
        id: { not: task.id }, prompt: task.prompt, modelId: task.modelId, resolution: task.resolution, duration: task.duration,
        status: { in: ['submitting', 'submitted', 'queued', 'running', 'pending', 'processing', 'in_progress'] },
      },
      select: { id: true },
    });
    if (duplicate) return privateJson({ success: false, error: 'A matching paid submission is already active' }, { status: 409 });

    const validation = validateSeedancePayload({
      modelId, prompt: task.prompt, ratio: task.aspectRatio, duration: task.duration, resolution: task.resolution,
      generationMode, references,
    });
    if (!validation.valid) return privateJson({ success: false, error: 'Task validation failed' }, { status: 400 });

    // Atomic claim makes the nonce effectively one-time for this task: a replay
    // cannot pass once this task has moved out of dry_run_passed.
    const claimed = await db.videoTask.updateMany({
      where: { id: task.id, status: 'dry_run_passed', paidConfirmation: false, taskId: null, dryRunPassed: true },
      data: { status: 'submitting', paidConfirmation: true, costEstimate: estimate.estimatedCostUsd },
    });
    if (claimed.count !== 1) return privateJson({ success: false, error: 'Task was already claimed for submission' }, { status: 409 });

    const payload = buildSeedancePayload({
      modelId, prompt: task.prompt, ratio: task.aspectRatio, duration: task.duration, resolution: task.resolution,
      generationMode, references, watermark: false, generateAudio: true, returnLastFrame: true,
    });

    // This is the only provider submission path. It is never invoked by tests
    // and cannot automatically retry after an ambiguous response or timeout.
    const provider = await createBytePlusSeedanceTask(payload);
    const updated = await db.videoTask.update({
      where: { id: task.id },
      data: {
        status: 'submitted', taskId: provider.providerTaskId, actualBillingStatus: 'pending_provider_usage',
        lastCheckedAt: null, pollCount: 0, providerResultVideoUrl: null, providerLastFrameUrl: null, errorMessage: null,
      },
    });

    return privateJson({
      success: true,
      task: {
        id: updated.id, status: updated.status, createdAt: updated.createdAt,
        model: updated.modelId, ratio: updated.aspectRatio, duration: updated.duration, resolution: updated.resolution,
        maxCostUsd: updated.maxCostUsd, estimatedCostUsd: estimate.estimatedCostUsd, estimatedTokens: estimate.estimatedTokens,
      },
    });
  } catch (error) {
    // Keep the task in submitting state after an ambiguous provider failure so
    // the server never retries or accidentally creates a duplicate paid job.
    // Only the sanitized provider message is logged (never the API key or raw
    // provider body); the client always receives a generic response.
    console.error('Real paid submission failed:', error instanceof Error ? error.message : 'unknown');
    return privateJson({ success: false, error: 'Paid submission result is unknown; do not retry automatically.' }, { status: 502 });
  }
}
