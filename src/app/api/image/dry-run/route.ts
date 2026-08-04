import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import {
  seedreamDryRunRequestSchema,
  deriveSeedreamMode,
  resolveSeedreamSize,
  resolveProjectScope,
  validateReferenceAssetSelection,
  buildSeedreamRequestPreview,
  promptWordWarning,
  SEEDREAM_MODEL_ID,
  SEEDREAM_PROVIDER,
} from '@/lib/seedream-image-validation';
import { estimateSeedreamImageCost } from '@/lib/seedream-image-pricing';

// POST /api/image/dry-run — Seedream 5.0 Pro image DRY-RUN only.
// Never calls BytePlus, never reads ARK_API_KEY, never creates a provider
// task, never increments actual spend/budget. Phase 1 scope only.
export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;

  const parsed = seedreamDryRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: 'Invalid image dry-run request' }, { status: 400 });

  const { prompt, referenceAssetIds, size, customWidth, customHeight, outputFormat, watermark, optimizeMode } = parsed.data;
  // Resolved once and reused for both the reference-asset lookup and the
  // ImageTask create below — see resolveProjectScope's doc comment for why
  // this repo has no deeper per-project ACL to check.
  const projectId = resolveProjectScope(parsed.data.projectId);

  try {
    const found = referenceAssetIds.length
      ? await db.referenceAsset.findMany({
          where: { id: { in: referenceAssetIds }, projectId },
          select: { id: true, assetType: true, projectId: true },
        })
      : [];
    const selection = validateReferenceAssetSelection(referenceAssetIds, found);
    if (!selection.valid) return privateJson({ error: selection.error }, { status: 400 });

    const mode = deriveSeedreamMode(selection.imageAssetIds.length);
    const resolved = resolveSeedreamSize(size, customWidth, customHeight);
    const cost = estimateSeedreamImageCost({
      referenceImageCount: selection.imageAssetIds.length,
      outputPixelCount: resolved.width * resolved.height,
      pricingBasis: resolved.pricingBasis,
    });
    const preview = buildSeedreamRequestPreview({
      prompt,
      referenceAssetIds: selection.imageAssetIds,
      size,
      width: resolved.width,
      height: resolved.height,
      outputFormat,
      watermark,
      optimizeMode,
    });

    const task = await db.imageTask.create({
      data: {
        projectId,
        provider: SEEDREAM_PROVIDER,
        modelId: SEEDREAM_MODEL_ID,
        mode,
        prompt,
        referenceImageCount: selection.imageAssetIds.length,
        size,
        width: resolved.width,
        height: resolved.height,
        outputFormat,
        watermark,
        optimizeMode,
        estimatedInputCostUsd: cost.inputReferenceCostUsd,
        estimatedOutputCostUsd: cost.outputCostUsd,
        estimatedTotalCostUsd: cost.estimatedTotalCostUsd,
        status: 'DRY_RUN',
        dryRunRequestJson: JSON.stringify(preview),
      },
    });

    const warning = promptWordWarning(prompt);

    return privateJson(
      {
        dryRun: true,
        providerCalled: false,
        paidCallMade: false,
        task: {
          id: task.id,
          status: task.status,
          mode: task.mode,
          modelId: task.modelId,
          size: task.size,
          width: task.width,
          height: task.height,
          outputFormat: task.outputFormat,
          watermark: task.watermark,
          optimizeMode: task.optimizeMode,
          referenceImageCount: task.referenceImageCount,
          createdAt: task.createdAt,
        },
        preview,
        cost,
        warnings: warning ? [warning] : [],
      },
      { status: 201 }
    );
  } catch {
    console.error('Seedream image dry-run failed');
    return privateJson({ error: 'Failed to run image dry-run' }, { status: 500 });
  }
}
