import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import { usageRecordUpdateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// PUT /api/usage-records/[id] — Update a usage record
// Especially for actualTokens and actualCostUsd manual entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = usageRecordUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const { id } = await params;
    const data = parsed.data;

    // Check if the usage record exists
    const existing = await db.usageRecord.findUnique({ where: { id } });
    if (!existing) {
      return privateJson(
        { error: 'Usage record not found' },
        { status: 404 }
      );
    }

    // Build update data from provided (validated) fields only
    const updateData: Record<string, unknown> = {};

    if (data.purchaseId !== undefined) updateData.purchaseId = data.purchaseId;
    if (data.projectTitle !== undefined) updateData.projectTitle = data.projectTitle;
    if (data.animalStoryName !== undefined) updateData.animalStoryName = data.animalStoryName;
    if (data.pricingModelId !== undefined) updateData.pricingModelId = data.pricingModelId;
    if (data.modelId !== undefined) updateData.modelId = data.modelId;
    if (data.modelName !== undefined) updateData.modelName = data.modelName;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.fps !== undefined) updateData.fps = data.fps;
    if (data.durationSeconds !== undefined) updateData.durationSeconds = data.durationSeconds;
    if (data.videoCount !== undefined) updateData.videoCount = data.videoCount;
    if (data.pricingMode !== undefined) updateData.pricingMode = data.pricingMode;
    if (data.ratePerKTokens !== undefined) updateData.ratePerKTokens = data.ratePerKTokens;
    if (data.estimatedTokens !== undefined) updateData.estimatedTokens = data.estimatedTokens;
    if (data.estimatedCostUsd !== undefined) updateData.estimatedCostUsd = data.estimatedCostUsd;
    if (data.actualTokens !== undefined) updateData.actualTokens = data.actualTokens;
    if (data.actualCostUsd !== undefined) updateData.actualCostUsd = data.actualCostUsd;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.generatedAt !== undefined) updateData.generatedAt = data.generatedAt ? new Date(data.generatedAt) : null;

    // If actualTokens or actualCostUsd are being set, this indicates
    // the record is being updated with real generation data
    if (data.actualTokens !== undefined || data.actualCostUsd !== undefined) {
      // Auto-set generatedAt if not provided and status allows
      if (data.generatedAt === undefined && existing.status !== 'cancelled') {
        updateData.generatedAt = new Date();
      }
      // Auto-update status to 'generated-manually' if still 'planned' or 'dry-run'
      if (data.status === undefined && (existing.status === 'planned' || existing.status === 'dry-run')) {
        updateData.status = 'generated-manually';
      }
    }

    const updated = await db.usageRecord.update({
      where: { id },
      data: updateData,
    });

    // If actualTokens was updated and the record is linked to a purchase,
    // recalculate the purchase's total tokensUsed
    if (data.actualTokens !== undefined && updated.purchaseId) {
      const allRecords = await db.usageRecord.findMany({
        where: { purchaseId: updated.purchaseId },
        select: { actualTokens: true, estimatedTokens: true },
      });

      const totalTokensUsed = allRecords.reduce((sum, r) => {
        return sum + (r.actualTokens ?? r.estimatedTokens ?? 0);
      }, 0);

      await db.subscriptionPurchase.update({
        where: { id: updated.purchaseId },
        data: { tokensUsed: totalTokensUsed },
      });
    }

    return privateJson(updated);
  } catch (error) {
    console.error('[USAGE_RECORDS_UPDATE]', error);
    return privateJson(
      { error: 'Failed to update usage record' },
      { status: 500 }
    );
  }
}
