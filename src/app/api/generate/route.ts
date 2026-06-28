import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSeedanceMediaUri } from '@/lib/seedance-validation';
import {
  estimateSeedancePlanningCost,
  resolveOfficialSeedanceModelId,
} from '@/lib/seedance-pricing';

// PHASE5.1 simulation route only.
// This route never calls BytePlus / ModelArk and must remain behind Safe Mode.

function getCharLimit(modelType: string) {
  return modelType === 'mini' ? 1500 : 2000;
}

const SIMULATION_CONFIRMATION = 'CONFIRM_SIMULATED_GENERATION';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      taskId,
      confirmation,
      storyboardRiskAcknowledged,
      audioRiskAcknowledged,
      videoRiskAcknowledged,
    } = body;

    // Gate 1: Confirmation token
    if (confirmation !== SIMULATION_CONFIRMATION) {
      return NextResponse.json(
        { success: false, error: `Confirmation token does not match. Type ${SIMULATION_CONFIRMATION} exactly.` },
        { status: 400 }
      );
    }

    // Gate 2: Task must exist
    const task = await db.videoTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Gate 3: Safe Mode must be OFF before the simulation can run
    const settings = await db.dashboardSettings.findFirst();
    if (settings?.safeMode) {
      return NextResponse.json(
        { success: false, error: 'Safe Mode is ON. Simulated paid generation is disabled. No real BytePlus call is available in PHASE5.1.' },
        { status: 403 }
      );
    }

    // Gate 4: Dry run must have passed
    if (!task.dryRunPassed) {
      return NextResponse.json(
        { success: false, error: 'Dry run has not passed. Run a successful dry run first.' },
        { status: 400 }
      );
    }

    // Gate 5: Prompt length warning only.
    // PHASE5.1 treats char limits as recommended ranges, not hard API blocks.
    const charLimit = getCharLimit(task.modelType);
    const promptLengthWarning = task.prompt.length > charLimit
      ? `Prompt exceeds recommended ${charLimit} characters (${task.prompt.length}). Warning only; PHASE5.1 simulation is not blocked.`
      : null;

    // Gate 6: Reference image URIs must be official API-ready media URIs.
    if (task.masterImageUrl && !validateSeedanceMediaUri('image', task.masterImageUrl).valid) {
      const result = validateSeedanceMediaUri('image', task.masterImageUrl);
      return NextResponse.json(
        { success: false, error: `Master image URI is invalid: ${result.error}` },
        { status: 400 }
      );
    }
    if (task.storyboardImageUrl && !validateSeedanceMediaUri('image', task.storyboardImageUrl).valid) {
      const result = validateSeedanceMediaUri('image', task.storyboardImageUrl);
      return NextResponse.json(
        { success: false, error: `Storyboard image URI is invalid: ${result.error}` },
        { status: 400 }
      );
    }

    // Gate 7: Storyboard risk acknowledgement
    if (task.storyboardImageUrl && !storyboardRiskAcknowledged) {
      return NextResponse.json(
        { success: false, error: 'Storyboard/reference risk must be acknowledged' },
        { status: 400 }
      );
    }

    // Gate 7b: Audio URL validation + risk acknowledgement
    const audioUrls = [task.audioUrl1, task.audioUrl2, task.audioUrl3].filter(Boolean) as string[];
    for (const url of audioUrls) {
      const result = validateSeedanceMediaUri('audio', url);
      if (!result.valid) {
        return NextResponse.json(
          { success: false, error: `Audio reference URI is invalid: ${result.error}` },
          { status: 400 }
        );
      }
    }
    if (audioUrls.length > 0 && !audioRiskAcknowledged) {
      return NextResponse.json(
        { success: false, error: 'Audio reference risk must be acknowledged when audio URLs are provided' },
        { status: 400 }
      );
    }

    // Gate 7c: Video URL validation + risk acknowledgement
    const videoUrls = [task.videoUrl1, task.videoUrl2, task.videoUrl3].filter(Boolean) as string[];
    for (const url of videoUrls) {
      const result = validateSeedanceMediaUri('video', url);
      if (!result.valid) {
        return NextResponse.json(
          { success: false, error: `Video reference URI is invalid: ${result.error}` },
          { status: 400 }
        );
      }
    }
    if (videoUrls.length > 0 && !videoRiskAcknowledged) {
      return NextResponse.json(
        { success: false, error: 'Video reference risk must be acknowledged when video URLs are provided' },
        { status: 400 }
      );
    }

    // Gate 8: Budget check
    const budget = await db.budgetSetting.findFirst();
    const officialModelId = resolveOfficialSeedanceModelId(task.modelId, task.modelType);
    const pricingEstimate = estimateSeedancePlanningCost({
      modelId: officialModelId,
      resolution: task.resolution,
      aspectRatio: task.aspectRatio,
      outputDurationSec: task.duration,
      inputMode: videoUrls.length > 0 ? 'with_video' : 'without_video',
      inputVideoDurationSec: 0,
    });
    const estimatedCost = pricingEstimate.estimatedCostUsd;

    if (budget) {
      const remaining = budget.monthlyLimit - budget.spentThisMonth;
      if (estimatedCost > remaining) {
        return NextResponse.json(
          { success: false, error: `Estimated cost ($${estimatedCost.toFixed(2)}) exceeds remaining budget ($${remaining.toFixed(2)})` },
          { status: 400 }
        );
      }
    }

    // Gate 9: Max-cost check
    if (task.maxCostUsd && estimatedCost > task.maxCostUsd) {
      return NextResponse.json(
        { success: false, error: `Estimated cost ($${estimatedCost.toFixed(2)}) exceeds max cost cap ($${task.maxCostUsd})` },
        { status: 400 }
      );
    }

    // Gate 10: Duplicate prevention
    const duplicate = await db.videoTask.findFirst({
      where: {
        prompt: task.prompt,
        modelType: task.modelType,
        resolution: task.resolution,
        duration: task.duration,
        status: { in: ['submitted', 'processing'] },
        id: { not: task.id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'Duplicate submission detected — a task with the same parameters is already in progress' },
        { status: 409 }
      );
    }

    // All gates passed - simulate submission only
    const updatedTask = await db.videoTask.update({
      where: { id: task.id },
      data: {
        status: 'submitted',
        paidConfirmation: true,
        costEstimate: estimatedCost,
        audioRiskAcknowledged: audioRiskAcknowledged || false,
        videoRiskAcknowledged: videoRiskAcknowledged || false,
        taskId: `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      },
    });

    // Record simulated cost in ledger
    await db.costLedger.create({
      data: {
        taskId: updatedTask.id,
        modelType: task.modelType,
        resolution: task.resolution,
        duration: task.duration,
        costUsd: estimatedCost,
        description: `Simulated generation (no BytePlus API call) - ${officialModelId} ${task.resolution} ${task.duration}s; ${pricingEstimate.pricingMode}`,
      },
    });

    // Update budget spent
    if (budget) {
      await db.budgetSetting.update({
        where: { id: budget.id },
        data: { spentThisMonth: budget.spentThisMonth + estimatedCost },
      });
    }

    // Simulate task completion after short delay
    setTimeout(async () => {
      try {
        await db.videoTask.update({
          where: { id: updatedTask.id },
          data: {
            status: 'succeeded',
            videoFileName: `seedance_${task.modelType}_${task.resolution}_${Date.now()}.mp4`,
            costActual: estimatedCost,
          },
        });
      } catch {
        // Silent fail for simulated update
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      simulation: true,
      realApiConnected: false,
      dryRunMode: true,
      paidApiBlocked: true,
      message: 'DRY RUN / PLANNING MODE — no paid BytePlus API calls were made.',
      pricingMode: 'official_token_estimate_only',
      pricingEstimate: {
        ...pricingEstimate,
        estimatedCostUsd: Math.round(pricingEstimate.estimatedCostUsd * 10000) / 10000,
      },
      actualBilling: 'Actual billing requires usage.completion_tokens returned by the real BytePlus API after generation.',
      warnings: promptLengthWarning ? [promptLengthWarning] : [],
      task: {
        id: updatedTask.id,
        status: updatedTask.status,
        costEstimate: estimatedCost,
        estimatedTokens: pricingEstimate.estimatedTokens,
        taskId: updatedTask.taskId,
      },
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
