import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  buildSeedancePayload,
  validateSeedancePayload,
  type GenerationMode,
  type SeedanceReferences,
} from '@/lib/seedance-validation';
import {
  estimateSeedancePlanningCost,
  resolveOfficialSeedanceModelId,
} from '@/lib/seedance-pricing';
import {
  createBytePlusSeedanceTask,
  getRealApiBlockReason,
  getRealApiEnvStatus,
  REAL_BYTEPLUS_CONFIRMATION,
} from '@/lib/byteplus-seedance-real';

export const runtime = 'nodejs';

interface StoredDryRunResult {
  references?: SeedanceReferences;
  generationMode?: GenerationMode;
  seedanceModelId?: string;
}

function parseStoredDryRunResult(value: string | null): StoredDryRunResult {
  if (!value) return {};
  try {
    return JSON.parse(value) as StoredDryRunResult;
  } catch {
    return {};
  }
}

function refsFromTask(task: {
  masterImageUrl: string | null;
  storyboardImageUrl: string | null;
  audioUrl1: string | null;
  audioUrl2: string | null;
  audioUrl3: string | null;
  videoUrl1: string | null;
  videoUrl2: string | null;
  videoUrl3: string | null;
}): SeedanceReferences {
  return {
    images: [
      task.masterImageUrl ? { role: 'reference_image', url: task.masterImageUrl } : null,
      task.storyboardImageUrl ? { role: 'reference_image', url: task.storyboardImageUrl } : null,
    ].filter(Boolean) as SeedanceReferences['images'],
    videos: [task.videoUrl1, task.videoUrl2, task.videoUrl3]
      .filter(Boolean)
      .map(url => ({ role: 'reference_video', url: url as string })),
    audios: [task.audioUrl1, task.audioUrl2, task.audioUrl3]
      .filter(Boolean)
      .map(url => ({ role: 'reference_audio', url: url as string })),
  };
}

export async function GET() {
  return NextResponse.json({
    ...getRealApiEnvStatus(),
    message: getRealApiBlockReason() ?? 'Real BytePlus generation is enabled server-side. Use the confirmation token for one paid submission.',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const taskId = typeof body.taskId === 'string' ? body.taskId : '';
    const confirmation = typeof body.confirmation === 'string' ? body.confirmation : '';

    if (confirmation !== REAL_BYTEPLUS_CONFIRMATION) {
      return NextResponse.json(
        { success: false, blocked: true, error: `Type ${REAL_BYTEPLUS_CONFIRMATION} exactly to allow one real paid BytePlus submission.` },
        { status: 400 }
      );
    }

    const blockReason = getRealApiBlockReason();
    if (blockReason) {
      console.warn(`[real-generate] blocked before BytePlus call: ${blockReason}`);
      return NextResponse.json(
        { success: false, blocked: true, error: blockReason, env: getRealApiEnvStatus() },
        { status: 403 }
      );
    }

    const task = await db.videoTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const settings = await db.dashboardSettings.findFirst();
    if (settings?.safeMode) {
      return NextResponse.json(
        { success: false, blocked: true, error: 'Safe Mode is ON. Turn Safe Mode OFF before any real paid BytePlus submission.' },
        { status: 403 }
      );
    }

    if (!task.dryRunPassed) {
      return NextResponse.json(
        { success: false, error: 'Dry run has not passed. Run a successful dry run first.' },
        { status: 400 }
      );
    }

    if (task.maxCostUsd == null || !Number.isFinite(task.maxCostUsd) || task.maxCostUsd <= 0) {
      return NextResponse.json(
        { success: false, error: 'maxCostUsd is required for Real Paid Submit. It is a maximum cost cap for this one paid generation, not a setup fee.' },
        { status: 400 }
      );
    }

    const budget = await db.budgetSetting.findFirst();
    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget settings are required before real paid generation.' },
        { status: 400 }
      );
    }

    const dryRun = parseStoredDryRunResult(task.dryRunResult);
    const references = dryRun.references ?? refsFromTask(task);
    const generationMode = dryRun.generationMode ?? 'reference_mode';
    const officialModelId = resolveOfficialSeedanceModelId(dryRun.seedanceModelId ?? task.modelId, task.modelType);
    const inputMode = references.videos.some(ref => ref.url.trim()) ? 'with_video' : 'without_video';
    const pricingEstimate = estimateSeedancePlanningCost({
      modelId: officialModelId,
      resolution: task.resolution,
      aspectRatio: task.aspectRatio,
      outputDurationSec: task.duration,
      inputMode,
    });

    const remaining = budget.monthlyLimit - budget.spentThisMonth;
    if (pricingEstimate.estimatedCostUsd > remaining) {
      return NextResponse.json(
        { success: false, error: `Estimated cost ($${pricingEstimate.estimatedCostUsd.toFixed(2)}) exceeds remaining budget ($${remaining.toFixed(2)}).` },
        { status: 400 }
      );
    }
    if (pricingEstimate.estimatedCostUsd > task.maxCostUsd) {
      return NextResponse.json(
        { success: false, error: `Estimated cost ($${pricingEstimate.estimatedCostUsd.toFixed(2)}) exceeds maxCostUsd cap ($${task.maxCostUsd.toFixed(2)}). Increase the one-task cap before Real Paid Submit.` },
        { status: 400 }
      );
    }

    const duplicate = await db.videoTask.findFirst({
      where: {
        prompt: task.prompt,
        modelId: task.modelId,
        resolution: task.resolution,
        duration: task.duration,
        status: { in: ['submitted', 'queued', 'running', 'pending', 'processing', 'in_progress'] },
        id: { not: task.id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'Duplicate real submission blocked: a matching submitted/processing task already exists.' },
        { status: 409 }
      );
    }

    const payload = buildSeedancePayload({
      modelId: officialModelId,
      prompt: task.prompt,
      ratio: task.aspectRatio,
      duration: task.duration,
      resolution: task.resolution,
      generationMode,
      references,
      watermark: false,
      generateAudio: true,
      returnLastFrame: true,
    });

    const validation = validateSeedancePayload({
      modelId: officialModelId,
      prompt: task.prompt,
      ratio: task.aspectRatio,
      duration: task.duration,
      resolution: task.resolution,
      generationMode,
      references,
    });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Seedance payload failed validation.', details: validation.errors },
        { status: 400 }
      );
    }

    const provider = await createBytePlusSeedanceTask(payload);
    const updatedTask = await db.videoTask.update({
      where: { id: task.id },
      data: {
        status: 'submitted',
        taskId: provider.providerTaskId,
        paidConfirmation: true,
        costEstimate: pricingEstimate.estimatedCostUsd,
        actualBillingStatus: 'pending_provider_usage',
        lastCheckedAt: null,
        pollCount: 0,
        providerResultVideoUrl: null,
        providerLastFrameUrl: null,
        errorMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      realApiSubmitted: true,
      message: 'Real BytePlus task submitted once. No polling loop was started.',
      task: {
        id: updatedTask.id,
        status: updatedTask.status,
        providerTaskId: provider.providerTaskId,
        createdAt: updatedTask.createdAt,
        model: updatedTask.modelId,
        ratio: updatedTask.aspectRatio,
        duration: updatedTask.duration,
        resolution: updatedTask.resolution,
        maxCostUsd: updatedTask.maxCostUsd,
        estimatedCostUsd: pricingEstimate.estimatedCostUsd,
        estimatedTokens: pricingEstimate.estimatedTokens,
      },
    });
  } catch (error) {
    console.error('[real-generate] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Real generation failed before completion.' },
      { status: 500 }
    );
  }
}
