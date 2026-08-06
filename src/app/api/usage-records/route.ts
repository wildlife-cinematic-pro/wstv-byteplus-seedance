import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { usageRecordCreateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// GET /api/usage-records — List all usage records
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const { searchParams } = new URL(request.url);
    const purchaseId = searchParams.get('purchaseId');
    const status = searchParams.get('status');

    if (purchaseId && (purchaseId.length < 1 || purchaseId.length > 120)) {
      return privateJson({ error: 'Invalid purchaseId' }, { status: 400 });
    }
    if (status && (status.length < 1 || status.length > 40)) {
      return privateJson({ error: 'Invalid status' }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (purchaseId) where.purchaseId = purchaseId;
    if (status) where.status = status;

    const usageRecords = await db.usageRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return privateJson(usageRecords);
  } catch (error) {
    console.error('[USAGE_RECORDS_LIST]', error);
    return privateJson(
      { error: 'Failed to fetch usage records' },
      { status: 500 }
    );
  }
}

// POST /api/usage-records — Create a new usage record
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = usageRecordCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const usageRecord = await db.usageRecord.create({
      data: {
        purchaseId: data.purchaseId ?? null,
        projectTitle: data.projectTitle ?? null,
        animalStoryName: data.animalStoryName ?? null,
        pricingModelId: data.pricingModelId ?? null,
        modelId: data.modelId,
        modelName: data.modelName,
        mode: data.mode,
        width: data.width,
        height: data.height,
        fps: data.fps,
        durationSeconds: data.durationSeconds,
        videoCount: data.videoCount,
        pricingMode: data.pricingMode,
        ratePerKTokens: data.ratePerKTokens,
        estimatedTokens: data.estimatedTokens,
        estimatedCostUsd: data.estimatedCostUsd,
        actualTokens: data.actualTokens ?? null,
        actualCostUsd: data.actualCostUsd ?? null,
        status: data.status,
        notes: data.notes ?? null,
        generatedAt: data.generatedAt ? new Date(data.generatedAt) : null,
      },
    });

    return privateJson(usageRecord, { status: 201 });
  } catch (error) {
    console.error('[USAGE_RECORDS_CREATE]', error);
    return privateJson(
      { error: 'Failed to create usage record' },
      { status: 500 }
    );
  }
}
