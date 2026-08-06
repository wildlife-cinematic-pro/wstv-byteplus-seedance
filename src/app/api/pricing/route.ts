import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { pricingModelCreateSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// GET /api/pricing — List all pricing models
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const pricingModels = await db.pricingModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return privateJson(pricingModels);
  } catch (error) {
    console.error('[PRICING_LIST]', error);
    return privateJson(
      { error: 'Failed to fetch pricing models' },
      { status: 500 }
    );
  }
}

// POST /api/pricing — Create a new pricing model
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = pricingModelCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const pricingModel = await db.pricingModel.create({
      data: {
        name: data.name,
        modelId: data.modelId,
        userLabel: data.userLabel ?? null,
        provider: data.provider,
        pricingMode: data.pricingMode,
        rate480p: data.rate480p,
        rate720p: data.rate720p,
        rate1080p: data.rate1080p,
        rate4k: data.rate4k,
        perVideoCost: data.perVideoCost ?? null,
        supports480p: data.supports480p,
        supports720p: data.supports720p,
        supports1080p: data.supports1080p,
        supports4k: data.supports4k,
        minDurationSec: data.minDurationSec,
        maxDurationSec: data.maxDurationSec,
        supportedModes: data.supportedModes,
        status: data.status,
        notes: data.notes ?? null,
      },
    });

    return privateJson(pricingModel, { status: 201 });
  } catch (error) {
    console.error('[PRICING_CREATE]', error);
    return privateJson(
      { error: 'Failed to create pricing model' },
      { status: 500 }
    );
  }
}
