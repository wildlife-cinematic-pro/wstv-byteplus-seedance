import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSeedanceMediaUri } from '@/lib/seedance-validation';
import {
  estimateSeedancePlanningCost,
  resolveOfficialSeedanceModelId,
} from '@/lib/seedance-pricing';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';

// PHASE5.1 simulation route only.
// This route never calls BytePlus / ModelArk and must remain behind Safe Mode.
//
// Reliability contract:
// Simulated submission AND simulated completion happen deterministically inside
// this request, inside a single db.$transaction. No in-memory background timer
// (setTimeout / setInterval) is used to finish the task, so a serverless
// restart or process termination can never leave a task permanently stuck in
// 'submitted'. Persistent server state is final when the response is sent.

function getCharLimit(modelType: string) {
  return modelType === 'mini' ? 1500 : 2000;
}

const SIMULATION_CONFIRMATION = 'CONFIRM_SIMULATED_GENERATION';

// Statuses that mean a simulation has already been claimed or completed.
// A task in any of these states must never be charged or recorded again.
const CLAIMED_OR_FINAL_STATUSES = ['submitted', 'processing', 'succeeded'];

// Thrown inside the transaction when the atomic claim loses (task already
// simulated) so the caller can respond 409 without exposing a raw Prisma error.
class SimulationAlreadyClaimedError extends Error {}

function buildSimulationTaskId(): string {
  return `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
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

    // Gate 10: Duplicate prevention (other tasks with identical parameters
    // currently in flight are rejected).
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

    // All gates passed — run the deterministic, transactional simulation.
    //
    // The atomic claim below (updateMany guarded by paidConfirmation=false and a
    // non-final status) makes duplicate/repeated accounting impossible:
    //   - only one concurrent request can win the claim (the other gets 409);
    //   - re-submitting the same task returns 409 instead of double-charging;
    //   - the task state flip, CostLedger row and budget increment commit or
    //     roll back together in a single transaction.
    //
    // videoFileName is intentionally NOT set: a simulated task never produced a
    // real file, so the preview/download UI must never claim one exists.
    const simulationTaskId = buildSimulationTaskId();
    let finalTask: { id: string; status: string; costEstimate: number | null; costActual: number | null };

    try {
      finalTask = await db.$transaction(async (tx) => {
        const claim = await tx.videoTask.updateMany({
          where: {
            id: task.id,
            paidConfirmation: false,
            status: { notIn: CLAIMED_OR_FINAL_STATUSES },
          },
          data: {
            status: 'succeeded',
            paidConfirmation: true,
            costEstimate: estimatedCost,
            costActual: estimatedCost,
            taskId: simulationTaskId,
            audioRiskAcknowledged: audioRiskAcknowledged || false,
            videoRiskAcknowledged: videoRiskAcknowledged || false,
            safetyPassed: true,
            dryRunPassed: true,
          },
        });
        if (claim.count !== 1) {
          throw new SimulationAlreadyClaimedError();
        }

        await tx.costLedger.create({
          data: {
            taskId: task.id,
            modelType: task.modelType,
            resolution: task.resolution,
            duration: task.duration,
            costUsd: estimatedCost,
            description: `Simulated generation (no BytePlus API call) - ${officialModelId} ${task.resolution} ${task.duration}s; ${pricingEstimate.pricingMode}`,
          },
        });

        if (budget) {
          await tx.budgetSetting.update({
            where: { id: budget.id },
            data: { spentThisMonth: { increment: estimatedCost } },
          });
        }

        const completed = await tx.videoTask.findUnique({
          where: { id: task.id },
          select: { id: true, status: true, costEstimate: true, costActual: true },
        });
        if (!completed) throw new Error('Simulated task state is missing after claim');
        return completed;
      });
    } catch (error) {
      if (error instanceof SimulationAlreadyClaimedError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Simulation already claimed — this task has already been simulated. No duplicate budget charge or ledger entry was created.',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      simulation: true,
      providerCalled: false,
      realApiConnected: false,
      dryRunMode: true,
      paidApiBlocked: true,
      noProviderBilling: true,
      message: 'DRY RUN / PLANNING MODE — no paid BytePlus API calls were made.',
      pricingMode: 'official_token_estimate_only',
      pricingEstimate: {
        ...pricingEstimate,
        estimatedCostUsd: Math.round(pricingEstimate.estimatedCostUsd * 10000) / 10000,
      },
      actualBilling: 'Actual billing requires usage.completion_tokens returned by the real BytePlus API after generation.',
      warnings: promptLengthWarning ? [promptLengthWarning] : [],
      task: {
        id: finalTask.id,
        status: finalTask.status,
        costEstimate: estimatedCost,
        costActual: finalTask.costActual,
        estimatedTokens: pricingEstimate.estimatedTokens,
        simulation: true,
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
