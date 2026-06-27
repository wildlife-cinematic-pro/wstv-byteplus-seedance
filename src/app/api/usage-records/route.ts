import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/usage-records — List all usage records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const purchaseId = searchParams.get('purchaseId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (purchaseId) where.purchaseId = purchaseId;
    if (status) where.status = status;

    const usageRecords = await db.usageRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(usageRecords);
  } catch (error) {
    console.error('[USAGE_RECORDS_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage records' },
      { status: 500 }
    );
  }
}

// POST /api/usage-records — Create a new usage record
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      purchaseId,
      projectTitle,
      animalStoryName,
      pricingModelId,
      modelId,
      modelName,
      mode = 'text-to-video',
      width,
      height,
      fps = 24,
      durationSeconds,
      videoCount = 1,
      pricingMode = 'token-based',
      ratePerKTokens,
      estimatedTokens,
      estimatedCostUsd,
      actualTokens,
      actualCostUsd,
      status = 'planned',
      notes,
      generatedAt,
    } = body;

    if (!modelId || !modelName || width === undefined || height === undefined || durationSeconds === undefined) {
      return NextResponse.json(
        { error: 'modelId, modelName, width, height, and durationSeconds are required' },
        { status: 400 }
      );
    }

    const usageRecord = await db.usageRecord.create({
      data: {
        purchaseId,
        projectTitle,
        animalStoryName,
        pricingModelId,
        modelId,
        modelName,
        mode,
        width,
        height,
        fps,
        durationSeconds,
        videoCount,
        pricingMode,
        ratePerKTokens: ratePerKTokens ?? 0,
        estimatedTokens: estimatedTokens ?? 0,
        estimatedCostUsd: estimatedCostUsd ?? 0,
        actualTokens,
        actualCostUsd,
        status,
        notes,
        generatedAt: generatedAt ? new Date(generatedAt) : null,
      },
    });

    return NextResponse.json(usageRecord, { status: 201 });
  } catch (error) {
    console.error('[USAGE_RECORDS_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create usage record' },
      { status: 500 }
    );
  }
}
