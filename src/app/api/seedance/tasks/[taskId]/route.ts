import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getArkApiKey } from '@/lib/seedance-config';
import {
  downloadVideoToOutputFolder,
  getBytePlusSeedanceTaskStatus,
  safeVideoFilename,
} from '@/lib/byteplus-seedance-real';
import {
  estimateSeedanceCostUsd,
  getSeedanceUsdPerMillionTokens,
  resolveOfficialSeedanceModelId,
} from '@/lib/seedance-pricing';

export const runtime = 'nodejs';

const DEFAULT_OUTPUT_FOLDER = '/Users/acharyabimal/Movies/WSTV/SeedanceVideos';

function isFinalStatus(status: string) {
  return ['succeeded', 'failed', 'cancelled', 'expired'].includes(status);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;
  const providerTaskId = decodeURIComponent(taskId || '').trim();
  const localTaskId = new URL(request.url).searchParams.get('localTaskId');

  if (!providerTaskId) {
    return NextResponse.json({ success: false, error: 'Missing Seedance task id.' }, { status: 400 });
  }

  if (!getArkApiKey()) {
    return NextResponse.json({ success: false, error: 'Server-side API key is missing.' }, { status: 401 });
  }

  try {
    const provider = await getBytePlusSeedanceTaskStatus(providerTaskId);
    const settings = await db.dashboardSettings.findFirst();
    const outputFolder = settings?.outputFolder || DEFAULT_OUTPUT_FOLDER;

    let task = localTaskId
      ? await db.videoTask.findUnique({ where: { id: localTaskId } })
      : await db.videoTask.findFirst({ where: { taskId: providerTaskId } });

    let videoFileName = task?.videoFileName ?? null;
    let localVideoUrl = task?.videoUrl ?? null;
    let actualCost: number | null = null;

    if (task) {
      const inputMode = [task.videoUrl1, task.videoUrl2, task.videoUrl3].some(Boolean) ? 'with_video' : 'without_video';
      const rate = getSeedanceUsdPerMillionTokens({
        modelId: resolveOfficialSeedanceModelId(task.modelId, task.modelType),
        resolution: task.resolution,
        inputMode,
      });
      actualCost = provider.completionTokens != null && rate != null
        ? estimateSeedanceCostUsd(provider.completionTokens, rate)
        : null;

      if (provider.status === 'succeeded' && provider.videoUrl && !videoFileName) {
        const filename = safeVideoFilename(task.outputFilename, `seedance-real-${task.id}`);
        const saved = await downloadVideoToOutputFolder({
          videoUrl: provider.videoUrl,
          outputFolder,
          filename,
        });
        videoFileName = saved.filename;
        localVideoUrl = `/api/video?name=${encodeURIComponent(saved.filename)}`;
      }

      task = await db.videoTask.update({
        where: { id: task.id },
        data: {
          status: provider.status,
          taskId: provider.providerTaskId,
          videoFileName,
          videoUrl: localVideoUrl,
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
    }

    return NextResponse.json({
      success: true,
      task: {
        localTaskId: task?.id ?? localTaskId ?? null,
        providerTaskId: provider.providerTaskId,
        status: provider.status,
        rawStatus: provider.rawStatus,
        createdAt: task?.createdAt ?? null,
        model: task?.modelId ?? null,
        ratio: task?.aspectRatio ?? null,
        duration: task?.duration ?? null,
        resolution: task?.resolution ?? null,
        maxCostUsd: task?.maxCostUsd ?? null,
        lastCheckedAt: task?.lastCheckedAt ?? new Date(),
        pollCount: task?.pollCount ?? null,
        resultVideoUrl: provider.videoUrl,
        localVideoUrl,
        videoFileName,
        lastFrameUrl: provider.lastFrameUrl,
        errorCode: provider.errorCode,
        errorMessage: provider.errorMessage,
        actualTokens: provider.completionTokens,
        costActual: actualCost,
        isFinal: isFinalStatus(provider.status),
      },
      message: 'Status check only. No paid generation task was created.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve Seedance task status.' },
      { status: 500 }
    );
  }
}
