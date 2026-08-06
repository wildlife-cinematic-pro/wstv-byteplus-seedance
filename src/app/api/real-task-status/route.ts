import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import { downloadVideoToOutputFolder, getBytePlusSeedanceTaskStatus, safeVideoFilename } from '@/lib/byteplus-seedance-real';
import { estimateSeedanceCostUsd, getSeedanceUsdPerMillionTokens, resolveOfficialSeedanceModelId } from '@/lib/seedance-pricing';
import { getOutputRoot } from '@/lib/security/local-request';

export const runtime = 'nodejs';
const statusSchema = z.object({ taskId: z.string().trim().min(1).max(120) }).strict();

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ success: false, error: 'Invalid task status request' }, { status: 400 });

  try {
    const task = await db.videoTask.findUnique({ where: { id: parsed.data.taskId } });
    if (!task || !task.taskId) return privateJson({ success: false, error: 'Local task not found' }, { status: 404 });

    const provider = await getBytePlusSeedanceTaskStatus(task.taskId);
    const inputMode = [task.videoUrl1, task.videoUrl2, task.videoUrl3].some(Boolean) ? 'with_video' : 'without_video';
    const rate = getSeedanceUsdPerMillionTokens({
      modelId: resolveOfficialSeedanceModelId(task.modelId, task.modelType), resolution: task.resolution, inputMode,
    });
    const actualCost = provider.completionTokens != null && rate != null ? estimateSeedanceCostUsd(provider.completionTokens, rate) : null;

    let videoFileName = task.videoFileName;
    let videoUrl = task.videoUrl;
    if (provider.status === 'succeeded' && provider.videoUrl && !videoFileName) {
      const saved = await downloadVideoToOutputFolder({
        videoUrl: provider.videoUrl,
        outputFolder: getOutputRoot(),
        filename: safeVideoFilename(task.outputFilename, `seedance-${task.id}`),
      });
      videoFileName = saved.filename;
      videoUrl = `/api/video?name=${encodeURIComponent(saved.filename)}`;
    }

    const updated = await db.$transaction(async transaction => {
      const next = await transaction.videoTask.update({
        where: { id: task.id },
        data: {
          status: provider.status,
          videoFileName,
          videoUrl,
          providerResultVideoUrl: provider.videoUrl,
          providerLastFrameUrl: provider.lastFrameUrl,
          errorMessage: provider.status === 'failed'
            ? ['Provider reported task failure', provider.errorCode && `(${provider.errorCode})`, provider.errorMessage].filter(Boolean).join(' ')
            : null,
          lastCheckedAt: new Date(), pollCount: { increment: 1 }, actualTokens: provider.completionTokens,
          costActual: actualCost,
          actualBillingStatus: provider.completionTokens != null ? 'actual_from_provider_completion_tokens' : 'unknown_provider_usage_missing',
        },
      });
      if (actualCost != null && task.costActual == null) {
        const budget = await transaction.budgetSetting.findFirst();
        if (budget) await transaction.budgetSetting.update({ where: { id: budget.id }, data: { spentThisMonth: budget.spentThisMonth + actualCost } });
        await transaction.costLedger.create({
          data: {
            taskId: next.id, modelType: next.modelType, resolution: next.resolution, duration: next.duration,
            costUsd: actualCost, description: 'Actual provider usage recorded',
          },
        });
      }
      return next;
    });

    return privateJson({
      success: true,
      task: {
        id: updated.id, status: updated.status, videoFileName: updated.videoFileName,
        localVideoUrl: updated.videoFileName ? `/api/video?name=${encodeURIComponent(updated.videoFileName)}` : null,
        lastCheckedAt: updated.lastCheckedAt, pollCount: updated.pollCount, costActual: updated.costActual,
        actualTokens: updated.actualTokens, actualBillingStatus: updated.actualBillingStatus,
      },
    });
  } catch (error) {
    // Only the sanitized provider message is logged (never the API key or raw
    // provider body); the client always receives a generic response.
    console.error('Real task status check failed:', error instanceof Error ? error.message : 'unknown');
    return privateJson({ success: false, error: 'Status check failed' }, { status: 502 });
  }
}
