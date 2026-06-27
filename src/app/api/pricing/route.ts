import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/pricing — List all pricing models
export async function GET() {
  try {
    const pricingModels = await db.pricingModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(pricingModels);
  } catch (error) {
    console.error('[PRICING_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing models' },
      { status: 500 }
    );
  }
}

// POST /api/pricing — Create a new pricing model
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      modelId,
      userLabel,
      provider = 'byteplus',
      pricingMode = 'token-based',
      rate480p = 0,
      rate720p = 0,
      rate1080p = 0,
      rate4k = 0,
      perVideoCost,
      supports480p = true,
      supports720p = true,
      supports1080p = true,
      supports4k = false,
      minDurationSec = 4,
      maxDurationSec = 15,
      supportedModes = 'text-to-video,first-frame,first-and-last-frame,reference,extension',
      status = 'active',
      notes,
    } = body;

    if (!name || !modelId) {
      return NextResponse.json(
        { error: 'name and modelId are required' },
        { status: 400 }
      );
    }

    const pricingModel = await db.pricingModel.create({
      data: {
        name,
        modelId,
        userLabel,
        provider,
        pricingMode,
        rate480p,
        rate720p,
        rate1080p,
        rate4k,
        perVideoCost,
        supports480p,
        supports720p,
        supports1080p,
        supports4k,
        minDurationSec,
        maxDurationSec,
        supportedModes,
        status,
        notes,
      },
    });

    return NextResponse.json(pricingModel, { status: 201 });
  } catch (error) {
    console.error('[PRICING_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create pricing model' },
      { status: 500 }
    );
  }
}
