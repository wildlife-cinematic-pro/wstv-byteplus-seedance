import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { pricingModelUpdateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// GET /api/pricing/[id] — Get a single pricing model
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const { id } = await params;
    const pricingModel = await db.pricingModel.findUnique({
      where: { id },
    });

    if (!pricingModel) {
      return privateJson(
        { error: 'Pricing model not found' },
        { status: 404 }
      );
    }

    return privateJson(pricingModel);
  } catch (error) {
    console.error('[PRICING_GET]', error);
    return privateJson(
      { error: 'Failed to fetch pricing model' },
      { status: 500 }
    );
  }
}

// PUT /api/pricing/[id] — Update a pricing model
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = pricingModelUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const { id } = await params;
    const data = parsed.data;

    // Check if the pricing model exists
    const existing = await db.pricingModel.findUnique({ where: { id } });
    if (!existing) {
      return privateJson(
        { error: 'Pricing model not found' },
        { status: 404 }
      );
    }

    // Build update data from provided (validated) fields only
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.modelId !== undefined) updateData.modelId = data.modelId;
    if (data.userLabel !== undefined) updateData.userLabel = data.userLabel;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.pricingMode !== undefined) updateData.pricingMode = data.pricingMode;
    if (data.rate480p !== undefined) updateData.rate480p = data.rate480p;
    if (data.rate720p !== undefined) updateData.rate720p = data.rate720p;
    if (data.rate1080p !== undefined) updateData.rate1080p = data.rate1080p;
    if (data.rate4k !== undefined) updateData.rate4k = data.rate4k;
    if (data.perVideoCost !== undefined) updateData.perVideoCost = data.perVideoCost;
    if (data.supports480p !== undefined) updateData.supports480p = data.supports480p;
    if (data.supports720p !== undefined) updateData.supports720p = data.supports720p;
    if (data.supports1080p !== undefined) updateData.supports1080p = data.supports1080p;
    if (data.supports4k !== undefined) updateData.supports4k = data.supports4k;
    if (data.minDurationSec !== undefined) updateData.minDurationSec = data.minDurationSec;
    if (data.maxDurationSec !== undefined) updateData.maxDurationSec = data.maxDurationSec;
    if (data.supportedModes !== undefined) updateData.supportedModes = data.supportedModes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await db.pricingModel.update({
      where: { id },
      data: updateData,
    });

    return privateJson(updated);
  } catch (error) {
    console.error('[PRICING_UPDATE]', error);
    return privateJson(
      { error: 'Failed to update pricing model' },
      { status: 500 }
    );
  }
}

// DELETE /api/pricing/[id] — Delete a pricing model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  try {
    const { id } = await params;

    const existing = await db.pricingModel.findUnique({ where: { id } });
    if (!existing) {
      return privateJson(
        { error: 'Pricing model not found' },
        { status: 404 }
      );
    }

    await db.pricingModel.delete({ where: { id } });

    return privateJson({ success: true, id });
  } catch (error) {
    console.error('[PRICING_DELETE]', error);
    return privateJson(
      { error: 'Failed to delete pricing model' },
      { status: 500 }
    );
  }
}
