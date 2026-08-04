import { describe, it, after } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NextRequest } from 'next/server';
import {
  seedreamDryRunRequestSchema,
  deriveSeedreamMode,
  resolveSeedreamSize,
  resolveProjectScope,
  validateCustomSizePixels,
  validateReferenceAssetSelection,
  buildSeedreamRequestPreview,
  promptWordWarning,
  countPromptWords,
  SEEDREAM_MODEL_ID,
  SEEDREAM_UNSUPPORTED_FIELDS,
  SEEDREAM_SIZE_LABELS,
  MAX_REFERENCE_IMAGES,
  PROMPT_WORD_WARNING_THRESHOLD,
} from './seedream-image-validation';
import {
  estimateSeedreamImageCost,
  estimateInputReferenceCostUsd,
  estimateOutputCostUsd,
  SEEDREAM_OUTPUT_PIXEL_THRESHOLD,
  SEEDREAM_OUTPUT_COST_LOW_USD,
  SEEDREAM_OUTPUT_COST_HIGH_USD,
} from './seedream-image-pricing';
import { requireAuthenticatedUser } from './auth/guards';
import { mutationRequestError } from './security/origin';

// ─── Fixtures ───

function baseRequestBody(overrides: Record<string, unknown> = {}) {
  return {
    prompt: 'A lioness at dawn',
    referenceAssetIds: [] as string[],
    size: '1K',
    outputFormat: 'png',
    watermark: false,
    optimizeMode: 'standard',
    ...overrides,
  };
}

function makeIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `asset-${i}`);
}

describe('seedreamDryRunRequestSchema — reference image counts', () => {
  it('accepts 0 reference images (text-to-image)', () => {
    const result = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ referenceAssetIds: [] }));
    strictAssert.equal(result.success, true);
  });

  it('accepts 1 reference image', () => {
    const result = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ referenceAssetIds: makeIds(1) }));
    strictAssert.equal(result.success, true);
  });

  it('accepts 10 reference images (the max)', () => {
    const result = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ referenceAssetIds: makeIds(10) }));
    strictAssert.equal(result.success, true);
    strictAssert.equal(MAX_REFERENCE_IMAGES, 10);
  });

  it('rejects 11 reference images', () => {
    const result = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ referenceAssetIds: makeIds(11) }));
    strictAssert.equal(result.success, false);
  });

  it('rejects duplicate reference asset IDs', () => {
    const result = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ referenceAssetIds: ['same-id', 'same-id'] }));
    strictAssert.equal(result.success, false);
  });
});

describe('deriveSeedreamMode', () => {
  it('derives text_to_image for 0 references', () => {
    strictAssert.equal(deriveSeedreamMode(0), 'text_to_image');
  });
  it('derives single_reference for 1 reference', () => {
    strictAssert.equal(deriveSeedreamMode(1), 'single_reference');
  });
  it('derives multi_reference for 2-10 references', () => {
    strictAssert.equal(deriveSeedreamMode(2), 'multi_reference');
    strictAssert.equal(deriveSeedreamMode(10), 'multi_reference');
  });
});

describe('validateReferenceAssetSelection — ownership and type', () => {
  it('rejects a non-image reference asset', () => {
    const result = validateReferenceAssetSelection(
      ['vid-1'],
      [{ id: 'vid-1', assetType: 'video', projectId: null }]
    );
    strictAssert.equal(result.valid, false);
  });

  it('rejects an asset belonging to another project (query already scoped it out, so it is absent here)', () => {
    // The route queries ReferenceAsset with `projectId` in the WHERE clause,
    // so a cross-project asset simply will not be present in `foundAssets`.
    const result = validateReferenceAssetSelection(['other-project-asset'], []);
    strictAssert.equal(result.valid, false);
  });

  it('rejects an unknown asset id', () => {
    const result = validateReferenceAssetSelection(
      ['does-not-exist'],
      [{ id: 'img-1', assetType: 'image', projectId: null }]
    );
    strictAssert.equal(result.valid, false);
  });

  it('accepts a valid set of owned image assets', () => {
    const result = validateReferenceAssetSelection(
      ['img-1', 'img-2'],
      [
        { id: 'img-1', assetType: 'image', projectId: null },
        { id: 'img-2', assetType: 'image', projectId: null },
      ]
    );
    strictAssert.equal(result.valid, true);
    strictAssert.deepEqual(result.imageAssetIds, ['img-1', 'img-2']);
  });
});

describe('allowed size labels', () => {
  it('contains exactly 1K, 1.5K, 2K, and custom', () => {
    strictAssert.deepEqual([...SEEDREAM_SIZE_LABELS].sort(), ['1.5K', '1K', '2K', 'custom'].sort());
  });
});

describe('size — 1K / 1.5K / 2K / custom', () => {
  it('resolves 1K to its documented estimate dimensions', () => {
    const resolved = resolveSeedreamSize('1K');
    strictAssert.equal(resolved.pricingBasis, 'label_estimate_1k');
    strictAssert.equal(resolved.width, 1024);
    strictAssert.equal(resolved.height, 1024);
    strictAssert.equal(resolved.sizeValue, '1K');
  });

  it('resolves 1.5K to 1536x1536', () => {
    const resolved = resolveSeedreamSize('1.5K');
    strictAssert.equal(resolved.pricingBasis, 'label_estimate_1_5k');
    strictAssert.equal(resolved.width, 1536);
    strictAssert.equal(resolved.height, 1536);
    strictAssert.equal(resolved.sizeValue, '1.5K');
  });

  it('resolves 2K to its documented estimate dimensions (the provider default size)', () => {
    const resolved = resolveSeedreamSize('2K');
    strictAssert.equal(resolved.pricingBasis, 'label_estimate_2k');
    strictAssert.equal(resolved.width, 2048);
    strictAssert.equal(resolved.height, 2048);
    strictAssert.equal(resolved.sizeValue, '2K');
    strictAssert.ok(resolved.width * resolved.height > resolveSeedreamSize('1K').width * resolveSeedreamSize('1K').height);
  });

  it('a 1.5K request preview contains size: "1.5K"', () => {
    const resolved = resolveSeedreamSize('1.5K');
    const preview = buildSeedreamRequestPreview({
      prompt: 'Test prompt',
      referenceAssetIds: [],
      size: '1.5K',
      width: resolved.width,
      height: resolved.height,
      outputFormat: 'png',
      watermark: false,
      optimizeMode: 'standard',
    });
    strictAssert.equal(preview.size, '1.5K');
  });

  it('accepts a valid custom size', () => {
    const check = validateCustomSizePixels(1280, 960);
    strictAssert.equal(check.valid, true);
    const parsed = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ size: 'custom', customWidth: 1280, customHeight: 960 }));
    strictAssert.equal(parsed.success, true);
  });

  it('rejects a custom pixel count below the minimum', () => {
    const check = validateCustomSizePixels(200, 200); // 40,000 px
    strictAssert.equal(check.valid, false);
    const parsed = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ size: 'custom', customWidth: 200, customHeight: 200 }));
    strictAssert.equal(parsed.success, false);
  });

  it('rejects a custom pixel count above the maximum', () => {
    const check = validateCustomSizePixels(5000, 5000); // 25,000,000 px
    strictAssert.equal(check.valid, false);
  });

  it('rejects a custom aspect ratio outside 1/16-16', () => {
    // 3860 x 240 = 926,400 px (within the pixel bounds) but aspect ~16.08 (outside bounds)
    const check = validateCustomSizePixels(3860, 240);
    strictAssert.equal(check.valid, false);
  });

  it('accepts the "1.5K" label — 1K, 1.5K, 2K, and custom are the only allowed sizes', () => {
    const parsed = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ size: '1.5K' }));
    strictAssert.equal(parsed.success, true);
  });

  it('rejects any other size label, e.g. "3K"', () => {
    const parsed = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ size: '3K' }));
    strictAssert.equal(parsed.success, false);
  });
});

describe('unsupported provider fields are rejected by strict validation', () => {
  const unsupportedValues: Record<string, unknown> = {
    seed: 42,
    ratio: '16:9',
    n: 4,
    quantity: 2,
    callback_url: 'https://example.com/hook',
    stream: true,
    guidance_scale: 7.5,
    sequential_image_generation: 'auto',
    sequential_image_generation_options: { max_images: 4 },
  };

  for (const field of SEEDREAM_UNSUPPORTED_FIELDS) {
    it(`rejects "${field}"`, () => {
      const body = baseRequestBody({ [field]: unsupportedValues[field] });
      const result = seedreamDryRunRequestSchema.safeParse(body);
      strictAssert.equal(result.success, false);
    });
  }

  it('rejects a client-supplied modelId (server-locked, not part of the schema)', () => {
    const result = seedreamDryRunRequestSchema.safeParse(baseRequestBody({ modelId: 'some-other-model' }));
    strictAssert.equal(result.success, false);
  });
});

describe('cost estimator', () => {
  it('the verified threshold is 2,610,000 pixels', () => {
    strictAssert.equal(SEEDREAM_OUTPUT_PIXEL_THRESHOLD, 2_610_000);
  });

  it('prices exactly 2,610,000 pixels as the low tier (inclusive lower bound)', () => {
    strictAssert.equal(estimateOutputCostUsd(2_610_000), 0.045);
    strictAssert.equal(estimateOutputCostUsd(SEEDREAM_OUTPUT_PIXEL_THRESHOLD), SEEDREAM_OUTPUT_COST_LOW_USD);
  });

  it('prices 2,610,001 pixels as the high tier', () => {
    strictAssert.equal(estimateOutputCostUsd(2_610_001), 0.09);
    strictAssert.equal(estimateOutputCostUsd(SEEDREAM_OUTPUT_PIXEL_THRESHOLD + 1), SEEDREAM_OUTPUT_COST_HIGH_USD);
  });

  it('1024x1024 (1K, 1,048,576 px) prices at USD 0.045', () => {
    strictAssert.equal(estimateOutputCostUsd(1024 * 1024), 0.045);
  });

  it('1536x1536 (1.5K, 2,359,296 px) prices at USD 0.045 — same price as 1K', () => {
    strictAssert.equal(estimateOutputCostUsd(1536 * 1536), 0.045);
  });

  it('2048x2048 (2K, 4,194,304 px) prices at USD 0.090', () => {
    strictAssert.equal(estimateOutputCostUsd(2048 * 2048), 0.09);
  });

  it('1600x1600 (2,560,000 px) prices at USD 0.045', () => {
    strictAssert.equal(estimateOutputCostUsd(1600 * 1600), 0.045);
  });

  it('1700x1600 (2,720,000 px) prices at USD 0.090', () => {
    strictAssert.equal(estimateOutputCostUsd(1700 * 1600), 0.09);
  });

  it('end-to-end: resolveSeedreamSize("1K") -> estimateSeedreamImageCost gives USD 0.045', () => {
    const resolved = resolveSeedreamSize('1K');
    const estimate = estimateSeedreamImageCost({ referenceImageCount: 0, outputPixelCount: resolved.width * resolved.height, pricingBasis: resolved.pricingBasis });
    strictAssert.equal(estimate.outputCostUsd, 0.045);
  });

  it('end-to-end: resolveSeedreamSize("1.5K") -> estimateSeedreamImageCost gives USD 0.045 (same price as 1K)', () => {
    const resolved = resolveSeedreamSize('1.5K');
    const estimate = estimateSeedreamImageCost({ referenceImageCount: 0, outputPixelCount: resolved.width * resolved.height, pricingBasis: resolved.pricingBasis });
    strictAssert.equal(estimate.outputCostUsd, 0.045);
  });

  it('end-to-end: resolveSeedreamSize("2K") -> estimateSeedreamImageCost gives USD 0.090', () => {
    const resolved = resolveSeedreamSize('2K');
    const estimate = estimateSeedreamImageCost({ referenceImageCount: 0, outputPixelCount: resolved.width * resolved.height, pricingBasis: resolved.pricingBasis });
    strictAssert.equal(estimate.outputCostUsd, 0.09);
  });

  it('the first reference image is free', () => {
    strictAssert.equal(estimateInputReferenceCostUsd(0), 0);
    strictAssert.equal(estimateInputReferenceCostUsd(1), 0);
  });

  it('each additional reference image costs $0.003', () => {
    strictAssert.equal(estimateInputReferenceCostUsd(2), 0.003);
    strictAssert.equal(estimateInputReferenceCostUsd(10), 0.027);
  });

  it('combines input + output cost into the total estimate and never touches real spend', () => {
    const estimate = estimateSeedreamImageCost({ referenceImageCount: 3, outputPixelCount: 1_000_000, pricingBasis: 'custom_exact' });
    strictAssert.equal(estimate.inputReferenceCostUsd, 0.006);
    strictAssert.equal(estimate.outputCostUsd, SEEDREAM_OUTPUT_COST_LOW_USD);
    strictAssert.equal(estimate.estimatedTotalCostUsd, 0.051);
    strictAssert.equal(estimate.estimateOnly, true);
  });
});

describe('prompt word-count warning (non-blocking)', () => {
  it('does not warn at or below the threshold', () => {
    const prompt = Array.from({ length: PROMPT_WORD_WARNING_THRESHOLD }, () => 'word').join(' ');
    strictAssert.equal(countPromptWords(prompt), PROMPT_WORD_WARNING_THRESHOLD);
    strictAssert.equal(promptWordWarning(prompt), null);
  });

  it('warns above the threshold without altering the prompt', () => {
    const prompt = Array.from({ length: PROMPT_WORD_WARNING_THRESHOLD + 50 }, () => 'word').join(' ');
    const warning = promptWordWarning(prompt);
    strictAssert.ok(typeof warning === 'string' && warning.length > 0);
  });
});

describe('sanitized request preview — no leakage', () => {
  it('contains only the documented fields, the server-locked model, and no URLs/Base64/secrets', () => {
    const preview = buildSeedreamRequestPreview({
      prompt: 'Test prompt',
      referenceAssetIds: ['img-1', 'img-2'],
      size: '1K',
      width: 1024,
      height: 1024,
      outputFormat: 'png',
      watermark: false,
      optimizeMode: 'standard',
    });
    strictAssert.deepEqual(
      Object.keys(preview).sort(),
      ['image', 'model', 'optimize_prompt_options', 'output_format', 'prompt', 'response_format', 'size', 'watermark'].sort()
    );
    strictAssert.equal(preview.model, SEEDREAM_MODEL_ID);
    strictAssert.equal(preview.response_format, 'url');

    const serialized = JSON.stringify(preview);
    strictAssert.ok(!/https?:\/\//.test(serialized), 'preview must not contain a URL');
    strictAssert.ok(!/base64,/.test(serialized), 'preview must not contain Base64 image data');
    strictAssert.ok(!/^\/(Users|home|var|etc)\//m.test(serialized), 'preview must not contain an absolute local path');
    strictAssert.ok(!/ARK_API_KEY|Bearer /.test(serialized), 'preview must not contain a secret or auth header');
  });

  it('always produces an explicit size value, never a bare default, for custom sizes', () => {
    const preview = buildSeedreamRequestPreview({
      prompt: 'Test',
      referenceAssetIds: [],
      size: 'custom',
      width: 1280,
      height: 960,
      outputFormat: 'jpeg',
      watermark: true,
      optimizeMode: 'fast',
    });
    strictAssert.equal(preview.size, '1280x960');
  });
});

describe('route security contract (static source check — no live server/DB required)', () => {
  const routePath = fileURLToPath(new URL('../app/api/image/dry-run/route.ts', import.meta.url));
  const source = readFileSync(routePath, 'utf8');

  it('uses the shared protected-mutation guard (server auth + origin/CSRF) rather than a bespoke check', () => {
    strictAssert.ok(source.includes('requireProtectedMutation'));
  });

  it('never calls the real provider, reads an API key, or polls provider status', () => {
    strictAssert.ok(!/\bfetch\s*\(/.test(source), 'route.ts must not call fetch()');
    strictAssert.ok(!source.includes('process.env.ARK_API_KEY'), 'route.ts must not read ARK_API_KEY');
    for (const forbidden of ["from '@/lib/byteplus-seedance-real'", 'requireArkApiKey(', 'createBytePlusSeedanceTask(', 'getBytePlusSeedanceTaskStatus(', 'getRealApiEnvStatus(']) {
      strictAssert.ok(!source.includes(forbidden), `route.ts must not reference "${forbidden}"`);
    }
  });

  it('never increments actual spend/budget records', () => {
    for (const forbidden of ['budgetSetting.update', 'costLedger.create', 'spentThisMonth']) {
      strictAssert.ok(!source.includes(forbidden), `route.ts must not reference "${forbidden}"`);
    }
  });

  it('hardcodes providerCalled: false and paidCallMade: false as response literals', () => {
    strictAssert.ok(/providerCalled:\s*false/.test(source));
    strictAssert.ok(/paidCallMade:\s*false/.test(source));
    strictAssert.ok(/dryRun:\s*true/.test(source));
  });

  it('resolves project scope exactly once via resolveProjectScope and reuses that single value', () => {
    strictAssert.ok(source.includes('resolveProjectScope('), 'route.ts must call resolveProjectScope()');
    const declarations = source.match(/const projectId = /g) ?? [];
    strictAssert.equal(declarations.length, 1, 'projectId must be resolved exactly once, not re-derived per query');
    // Both the reference-asset lookup and the ImageTask create must read the
    // same `projectId` identifier — not a re-parsed or re-trusted client value.
    strictAssert.ok(/where:\s*{\s*id:\s*{\s*in:\s*referenceAssetIds\s*},\s*projectId\s*}/.test(source));
    strictAssert.ok(/data:\s*{\s*projectId,/.test(source));
  });
});

describe('resolveProjectScope — project scoping fallback (no Project/membership model exists in this repo)', () => {
  it('passes through a provided project id unchanged', () => {
    strictAssert.equal(resolveProjectScope('proj-123'), 'proj-123');
  });

  it('normalizes null/undefined to the shared null scope, matching /api/reference-assets', () => {
    strictAssert.equal(resolveProjectScope(null), null);
    strictAssert.equal(resolveProjectScope(undefined), null);
  });
});

describe('authentication and CSRF/origin rejection (reused guards, not weakened)', () => {
  const originalEnv: Record<string, string | undefined> = {};
  const authEnvKeys = ['WSTV_AUTH_ENABLED', 'WSTV_AUTH_USER', 'WSTV_AUTH_PASSWORD_HASH', 'WSTV_SESSION_SECRET'];

  after(() => {
    for (const key of authEnvKeys) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it('rejects an unauthenticated request (no session cookie) when auth is enabled', async () => {
    for (const key of authEnvKeys) originalEnv[key] = process.env[key];
    process.env.WSTV_AUTH_ENABLED = 'true';
    process.env.WSTV_AUTH_USER = 'tester';
    process.env.WSTV_AUTH_PASSWORD_HASH = 'scrypt$16384$8$1$c2FsdHNhbHRzYWx0c2FsdA$aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g';
    process.env.WSTV_SESSION_SECRET = 'a'.repeat(32);

    const request = new NextRequest('http://127.0.0.1:3000/api/image/dry-run', { method: 'POST' });
    const guard = await requireAuthenticatedUser(request);
    strictAssert.ok('response' in guard);
    if ('response' in guard) strictAssert.equal(guard.response.status, 401);
  });

  it('rejects a mutation request from an invalid origin', () => {
    const request = new NextRequest('http://127.0.0.1:3000/api/image/dry-run', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example.com' },
    });
    const error = mutationRequestError(request);
    strictAssert.ok(typeof error === 'string' && error.length > 0);
  });

  it('accepts a mutation request from an allowed origin with the correct content type', () => {
    const request = new NextRequest('http://127.0.0.1:3000/api/image/dry-run', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:3000' },
    });
    const error = mutationRequestError(request);
    strictAssert.equal(error, null);
  });
});
