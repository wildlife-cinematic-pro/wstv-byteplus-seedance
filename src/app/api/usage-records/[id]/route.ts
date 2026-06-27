import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/usage-records/[id] — Update a usage record
// Especially for actualTokens and actualCostUsd manual entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if the usage record exists
    const existing = await db.usageRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Usage record not found' },
        { status: 404 }
      );
    }

    // Build update data from provided fields only
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'purchaseId', 'projectTitle', 'animalStoryName', 'pricingModelId',
      'modelId', 'modelName', 'mode', 'width', 'height', 'fps',
      'durationSeconds', 'videoCount', 'pricingMode', 'ratePerKTokens',
      'estimatedTokens', 'estimatedCostUsd', 'actualTokens', 'actualCostUsd',
      'status', 'notes',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Handle generatedAt separately (date field)
    if ('generatedAt' in body) {
      updateData.generatedAt = body.generatedAt ? new Date(body.generatedAt) : null;
    }

    // If actualTokens or actualCostUsd are being set, this indicates
    // the record is being updated with real generation data
    if (body.actualTokens !== undefined || body.actualCostUsd !== undefined) {
      // Auto-set generatedAt if not provided and status allows
      if (!('generatedAt' in body) && existing.status !== 'cancelled') {
        updateData.generatedAt = new Date();
      }
      // Auto-update status to 'generated-manually' if still 'planned' or 'dry-run'
      if (!('status' in body) && (existing.status === 'planned' || existing.status === 'dry-run')) {
        updateData.status = 'generated-manually';
      }
    }

    const updated = await db.usageRecord.update({
      where: { id },
      data: updateData,
    });

    // If actualTokens was updated and the record is linked to a purchase,
    // recalculate the purchase's total tokensUsed
    if (body.actualTokens !== undefined && updated.purchaseId) {
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[USAGE_RECORDS_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update usage record' },
      { status: 500 }
    );
  }
}
