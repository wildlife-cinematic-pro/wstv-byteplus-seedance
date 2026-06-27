import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Cost estimation table (USD per second)
const COST_TABLE: Record<string, Record<string, number>> = {
  mini: { '480p': 0.02, '720p': 0.04 },
  full: { '480p': 0.03, '720p': 0.06, '1080p': 0.10, '4K': 0.18 },
};

function getCharLimit(modelType: string) {
  return modelType === 'mini' ? 1500 : 2000;
}

function isValidAudioUrl(url: string) {
  return url.startsWith('https://') && /\.(mp3|wav|m4a)(\?|$)/i.test(url);
}

function isValidVideoUrl(url: string) {
  return url.startsWith('https://') && /\.(mp4|mov)(\?|$)/i.test(url);
}

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
    if (confirmation !== 'SUBMIT_ONE_PAID_TASK') {
      return NextResponse.json(
        { success: false, error: 'Confirmation token does not match. Type SUBMIT_ONE_PAID_TASK exactly.' },
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

    // Gate 3: Safe Mode must be OFF
    const settings = await db.dashboardSettings.findFirst();
    if (settings?.safeMode) {
      return NextResponse.json(
        { success: false, error: 'Safe Mode is ON. Paid generation is disabled.' },
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

    // Gate 5: Prompt within limit
    const charLimit = getCharLimit(task.modelType);
    if (task.prompt.length > charLimit) {
      return NextResponse.json(
        { success: false, error: `Prompt exceeds ${charLimit} characters` },
        { status: 400 }
      );
    }

    // Gate 6: Reference image URLs must be valid HTTPS
    if (task.masterImageUrl && !task.masterImageUrl.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'Master image URL must be HTTPS' },
        { status: 400 }
      );
    }
    if (task.storyboardImageUrl && !task.storyboardImageUrl.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'Storyboard image URL must be HTTPS' },
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
      if (!isValidAudioUrl(url)) {
        return NextResponse.json(
          { success: false, error: `Audio URL must be HTTPS with .mp3/.wav/.m4a extension: ${url}` },
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
      if (!isValidVideoUrl(url)) {
        return NextResponse.json(
          { success: false, error: `Video URL must be HTTPS with .mp4/.mov extension: ${url}` },
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
    const costPerSecond = COST_TABLE[task.modelType]?.[task.resolution] || 0;
    const estimatedCost = costPerSecond * task.duration;

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

    // All gates passed — simulate submission
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

    // Record cost in ledger
    await db.costLedger.create({
      data: {
        taskId: updatedTask.id,
        modelType: task.modelType,
        resolution: task.resolution,
        duration: task.duration,
        costUsd: estimatedCost,
        description: `Paid generation — ${task.modelType} ${task.resolution} ${task.duration}s`,
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
      task: {
        id: updatedTask.id,
        status: updatedTask.status,
        costEstimate: estimatedCost,
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
