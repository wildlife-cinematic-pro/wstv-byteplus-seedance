import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  downloadVideoToOutputFolder,
  getBytePlusSeedanceTaskStatus,
  safeVideoFilename,
} from '@/lib/byteplus-seedance-real';
import { getArkApiKey } from '@/lib/seedance-config';
import {
  estimateSeedanceCostUsd,
  getSeedanceUsdPerMillionTokens,
  resolveOfficialSeedanceModelId,
} from '@/lib/seedance-pricing';

export const runtime = 'nodejs';

const DEFAULT_OUTPUT_FOLDER = '/Users/acharyabimal/Movies/WSTV/SeedanceVideos';

async function readIds(request: NextRequest) {
  const url = new URL(request.url);
  let localTaskId = url.searchParams.get('taskId');
  let providerTaskId = url.searchParams.get('providerTaskId');

  if (request.method !== 'GET') {
    const body = await request.json().catch(() => null) as { taskId?: string; providerTaskId?: string } | null;
    localTaskId = body?.taskId ?? localTaskId;
    providerTaskId = body?.providerTaskId ?? providerTaskId;
  }

  return { localTaskId, providerTaskId };
}

async function handleStatus(request: NextRequest) {
  try {
    if (!getArkApiKey()) {
      return NextResponse.json(
        { success: false, blocked: true, error: 'Server-side API key is missing.' },
        { status: 401 }
      );
    }

    const { localTaskId, providerTaskId: requestedProviderTaskId } = await readIds(request);
    let task = localTaskId
      ? await db.videoTask.findUnique({ where: { id: localTaskId } })
      : null;

    if (!task && requestedProviderTaskId) {
      task = await db.videoTask.findFirst({ where: { taskId: requestedProviderTaskId } });
    }
    if (!task) {
      return NextResponse.json({ success: false, error: 'Local task not found' }, { status: 404 });
    }

    const providerTaskId = task.taskId || requestedProviderTaskId;
    if (!providerTaskId) {
      return NextResponse.json({ success: false, error: 'BytePlus task id is missing for this local task.' }, { status: 400 });
    }

    const provider = await getBytePlusSeedanceTaskStatus(providerTaskId);
    const settings = await db.dashboardSettings.findFirst();
    const outputFolder = settings?.outputFolder || DEFAULT_OUTPUT_FOLDER;
    const inputMode = [task.videoUrl1, task.videoUrl2, task.videoUrl3].some(Boolean) ? 'with_video' : 'without_video';
    const rate = getSeedanceUsdPerMillionTokens({
      modelId: resolveOfficialSeedanceModelId(task.modelId, task.modelType),
      resolution: task.resolution,
      inputMode,
    });
    const actualCost = provider.completionTokens != null && rate != null
      ? estimateSeedanceCostUsd(provider.completionTokens, rate)
      : null;

    let videoFileName = task.videoFileName;
    let videoUrl = task.videoUrl;
    if (provider.status === 'succeeded' && provider.videoUrl && !videoFileName) {
      const filename = safeVideoFilename(task.outputFilename, `seedance-real-${task.id}`);
      const saved = await downloadVideoToOutputFolder({
        videoUrl: provider.videoUrl,
        outputFolder,
        filename,
      });
      videoFileName = saved.filename;
      videoUrl = `/api/video?name=${encodeURIComponent(saved.filename)}`;
    }

    const previousActualCost = task.costActual;
    const updatedTask = await db.videoTask.update({
      where: { id: task.id },
      data: {
        status: provider.status,
        taskId: provider.providerTaskId,
        videoFileName,
        videoUrl,
        providerResultVideoUrl: provider.videoUrl,
        providerLastFrameUrl: provider.lastFrameUrl,
        errorMessage: provider.errorMessage,
        lastCheckedAt: new Date(),
        pollCount: { increment: 1 },
        actualTokens: provider.completionTokens,
        costActual: actualCost,
        actualBillingStatus: provider.completionTokens != null
          ? 'actual_from_provider_completion_tokens'
          : 'unknown_provider_usage_missing',
      },
    });

    if (actualCost != null && previousActualCost == null) {
      const budget = await db.budgetSetting.findFirst();
      if (budget) {
        await db.budgetSetting.update({
          where: { id: budget.id },
          data: { spentThisMonth: budget.spentThisMonth + actualCost },
        });
      }
      await db.costLedger.create({
        data: {
          taskId: updatedTask.id,
          modelType: updatedTask.modelType,
          resolution: updatedTask.resolution,
          duration: updatedTask.duration,
          costUsd: actualCost,
          description: `Actual BytePlus usage from completion_tokens=${provider.completionTokens}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        status: updatedTask.status,
        providerTaskId: updatedTask.taskId,
        videoFileName: updatedTask.videoFileName,
        videoUrl: updatedTask.videoUrl,
        resultVideoUrl: updatedTask.providerResultVideoUrl,
        lastFrameUrl: updatedTask.providerLastFrameUrl,
        lastCheckedAt: updatedTask.lastCheckedAt,
        pollCount: updatedTask.pollCount,
        errorMessage: updatedTask.errorMessage,
        actualTokens: updatedTask.actualTokens,
        costActual: updatedTask.costActual,
        actualBillingStatus: updatedTask.actualBillingStatus,
      },
      provider: {
        status: provider.rawStatus,
        hasVideoUrl: Boolean(provider.videoUrl),
        completionTokens: provider.completionTokens,
        totalTokens: provider.totalTokens,
      },
    });
  } catch (error) {
    console.error('[real-task-status] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Real task status check failed.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleStatus(request);
}

export async function POST(request: NextRequest) {
  return handleStatus(request);
}
