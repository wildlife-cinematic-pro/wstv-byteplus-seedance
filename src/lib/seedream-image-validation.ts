/**
 * Seedream 5.0 Pro Image — Dry-Run Validation
 * ============================================
 *
 * Phase 1 — DRY-RUN ONLY. No real API calls, no API keys, no paid submissions.
 *
 * Official future endpoint (for FUTURE integration — NOT called now):
 *   POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations
 *
 * Official model (for FUTURE integration — NOT called now):
 *   dola-seedream-5-0-pro-260628
 *
 * This module intentionally never accepts a client-supplied model ID,
 * arbitrary remote URL, or Base64 image payload. Reference images are only
 * ever referred to by project-scoped ReferenceAsset IDs already stored in
 * the database.
 */

import { z } from 'zod';

// ─── Model (server-locked) ───

export const SEEDREAM_MODEL_ID = 'dola-seedream-5-0-pro-260628';
export const SEEDREAM_PROVIDER = 'byteplus';
export const SEEDREAM_MODEL_LABEL = 'Dola Seedream 5.0 Pro';

// ─── Prompt limits ───

export const MAX_PROMPT_CHARS = 8_000;
export const PROMPT_WORD_WARNING_THRESHOLD = 600;

// ─── Reference image limits ───

export const MIN_REFERENCE_IMAGES = 0;
export const MAX_REFERENCE_IMAGES = 10;

// ─── Size ───

export const SEEDREAM_SIZE_LABELS = ['1K', '1.5K', '2K', 'custom'] as const;
export type SeedreamSizeLabel = (typeof SEEDREAM_SIZE_LABELS)[number];

/**
 * Documented project-side estimate dimensions for labeled sizes. These are
 * used ONLY for the local dry-run cost estimate and sanitized preview — the
 * real provider chooses actual output dimensions from the prompt/aspect at
 * generation time, so these are estimates, not guarantees. 2K is the
 * provider's documented default size; this app always sends an explicit
 * size value regardless (see resolveSeedreamSize below).
 */
export const LABEL_ESTIMATE_DIMENSIONS: Record<'1K' | '1.5K' | '2K', { width: number; height: number }> = {
  '1K': { width: 1024, height: 1024 },
  '1.5K': { width: 1536, height: 1536 },
  '2K': { width: 2048, height: 2048 },
};

export const CUSTOM_MIN_TOTAL_PIXELS = 921_600;
export const CUSTOM_MAX_TOTAL_PIXELS = 4_624_220;
export const CUSTOM_MIN_ASPECT_RATIO = 1 / 16;
export const CUSTOM_MAX_ASPECT_RATIO = 16;
export const CUSTOM_MAX_DIMENSION_PX = 20_000; // sanity bound on individual width/height inputs

// ─── Output format / watermark / prompt optimization ───

export const SEEDREAM_OUTPUT_FORMATS = ['png', 'jpeg'] as const;
export type SeedreamOutputFormat = (typeof SEEDREAM_OUTPUT_FORMATS)[number];

export const SEEDREAM_OPTIMIZE_MODES = ['standard', 'fast'] as const;
export type SeedreamOptimizeMode = (typeof SEEDREAM_OPTIMIZE_MODES)[number];

// ─── Mode (derived server-side, never trusted from the client) ───

export const SEEDREAM_MODES = ['text_to_image', 'single_reference', 'multi_reference'] as const;
export type SeedreamMode = (typeof SEEDREAM_MODES)[number];

export function deriveSeedreamMode(referenceImageCount: number): SeedreamMode {
  if (referenceImageCount <= 0) return 'text_to_image';
  if (referenceImageCount === 1) return 'single_reference';
  return 'multi_reference';
}

// ─── Fields the official Seedream 5.0 Pro contract does NOT support ───
// Listed for documentation + test coverage. The strict Zod schema below
// rejects these (and any other unknown field) by construction.

export const SEEDREAM_UNSUPPORTED_FIELDS = [
  'seed',
  'ratio',
  'n',
  'quantity',
  'callback_url',
  'stream',
  'guidance_scale',
  'sequential_image_generation',
  'sequential_image_generation_options',
] as const;

// ─── Word-count warning (non-blocking) ───

export function countPromptWords(prompt: string): number {
  return prompt.trim().split(/\s+/).filter(Boolean).length;
}

export function promptWordWarning(prompt: string): string | null {
  const words = countPromptWords(prompt);
  if (words <= PROMPT_WORD_WARNING_THRESHOLD) return null;
  return `Prompt is ${words} words, longer than the recommended ${PROMPT_WORD_WARNING_THRESHOLD}-word guideline. This is a warning only — dry-run is not blocked.`;
}

// ─── Custom size validation ───

export interface CustomSizeValidation {
  valid: boolean;
  error?: string;
}

export function validateCustomSizePixels(width: number, height: number): CustomSizeValidation {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return { valid: false, error: 'Custom width and height must be positive integers.' };
  }
  const totalPixels = width * height;
  if (totalPixels < CUSTOM_MIN_TOTAL_PIXELS || totalPixels > CUSTOM_MAX_TOTAL_PIXELS) {
    return {
      valid: false,
      error: `Custom size must total between ${CUSTOM_MIN_TOTAL_PIXELS.toLocaleString()} and ${CUSTOM_MAX_TOTAL_PIXELS.toLocaleString()} pixels (got ${totalPixels.toLocaleString()}).`,
    };
  }
  const aspect = width / height;
  if (aspect < CUSTOM_MIN_ASPECT_RATIO || aspect > CUSTOM_MAX_ASPECT_RATIO) {
    return {
      valid: false,
      error: `Custom width/height ratio must be between 1/16 and 16 (got ${aspect.toFixed(4)}).`,
    };
  }
  return { valid: true };
}

// ─── Resolved dimensions + pricing basis ───

export type SeedreamPricingBasis = 'label_estimate_1k' | 'label_estimate_1_5k' | 'label_estimate_2k' | 'custom_exact';

export interface ResolvedSeedreamSize {
  width: number;
  height: number;
  pricingBasis: SeedreamPricingBasis;
  /** Explicit size value for the sanitized provider preview — never a bare default. */
  sizeValue: string;
}

export function resolveSeedreamSize(
  size: SeedreamSizeLabel,
  customWidth?: number,
  customHeight?: number
): ResolvedSeedreamSize {
  if (size === '1K') {
    const { width, height } = LABEL_ESTIMATE_DIMENSIONS['1K'];
    return { width, height, pricingBasis: 'label_estimate_1k', sizeValue: '1K' };
  }
  if (size === '1.5K') {
    const { width, height } = LABEL_ESTIMATE_DIMENSIONS['1.5K'];
    return { width, height, pricingBasis: 'label_estimate_1_5k', sizeValue: '1.5K' };
  }
  if (size === '2K') {
    const { width, height } = LABEL_ESTIMATE_DIMENSIONS['2K'];
    return { width, height, pricingBasis: 'label_estimate_2k', sizeValue: '2K' };
  }
  const width = customWidth ?? 0;
  const height = customHeight ?? 0;
  return { width, height, pricingBasis: 'custom_exact', sizeValue: `${width}x${height}` };
}

// ─── Project scope resolution ───
//
// This repository has no `Project` or membership model in prisma/schema.prisma
// and no per-user access control — the whole app is a single authenticated
// operator behind one shared session cookie (see src/lib/auth/session.ts,
// WSTV_AUTH_USER). `projectId` is a free-form, optional scoping string used
// consistently that way across every existing project-scoped model
// (ReferenceAsset, ContentCalendar, PromptVersion, GenerationQA, etc.) —
// there is no "project" row to check ownership of, and none of those routes
// validate it against anything beyond exact-match scoping.
//
// Given that, the safest consistent fallback already used by this app (see
// `scopedProjectId` in src/app/api/reference-assets/route.ts) is: (1) require
// a valid authenticated session before this code runs at all — enforced by
// requireProtectedMutation, not reimplemented here — and (2) resolve the
// scope exactly once and thread the SAME value through every project-scoped
// read and write in the request, so no code path can query under one
// projectId and persist under another.
export function resolveProjectScope(rawProjectId: string | null | undefined): string | null {
  return rawProjectId ?? null;
}

// ─── Reference-asset ownership/type validation (pure — DB lookup happens in the route) ───

export interface ReferenceAssetLookupRow {
  id: string;
  assetType: string;
  projectId: string | null;
}

export interface ReferenceAssetSelectionResult {
  valid: boolean;
  error?: string;
  imageAssetIds: string[];
}

/**
 * `foundAssets` must already be scoped to the requesting project (the route
 * queries ReferenceAsset with `projectId` in the WHERE clause), so an asset
 * belonging to a different project simply will not appear here and is
 * rejected the same way as an unknown asset ID.
 */
export function validateReferenceAssetSelection(
  requestedIds: string[],
  foundAssets: ReferenceAssetLookupRow[]
): ReferenceAssetSelectionResult {
  const byId = new Map(foundAssets.map(asset => [asset.id, asset]));
  for (const id of requestedIds) {
    const asset = byId.get(id);
    if (!asset) {
      return { valid: false, error: 'One or more reference assets were not found in this project.', imageAssetIds: [] };
    }
    if (asset.assetType !== 'image') {
      return { valid: false, error: 'Only image reference assets are supported for Seedream image dry-run.', imageAssetIds: [] };
    }
  }
  return { valid: true, imageAssetIds: requestedIds };
}

// ─── Request schema (strict — rejects unknown fields and the unsupported ones above) ───

export const seedreamDryRunRequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(MAX_PROMPT_CHARS),
    referenceAssetIds: z
      .array(z.string().trim().min(1).max(120))
      .max(MAX_REFERENCE_IMAGES)
      .refine(ids => new Set(ids).size === ids.length, { message: 'referenceAssetIds must not contain duplicates' }),
    size: z.enum(SEEDREAM_SIZE_LABELS),
    customWidth: z.number().int().positive().max(CUSTOM_MAX_DIMENSION_PX).optional(),
    customHeight: z.number().int().positive().max(CUSTOM_MAX_DIMENSION_PX).optional(),
    outputFormat: z.enum(SEEDREAM_OUTPUT_FORMATS),
    watermark: z.boolean(),
    optimizeMode: z.enum(SEEDREAM_OPTIMIZE_MODES),
    projectId: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.size !== 'custom') return;
    if (data.customWidth == null || data.customHeight == null) {
      ctx.addIssue({ code: 'custom', message: 'customWidth and customHeight are required when size is "custom".', path: ['size'] });
      return;
    }
    const check = validateCustomSizePixels(data.customWidth, data.customHeight);
    if (!check.valid) {
      ctx.addIssue({ code: 'custom', message: check.error ?? 'Invalid custom size.', path: ['size'] });
    }
  });

export type SeedreamDryRunRequest = z.infer<typeof seedreamDryRunRequestSchema>;

// ─── Sanitized provider request preview (preview only — NEVER sent over the network) ───

export interface SeedreamPreviewInput {
  prompt: string;
  referenceAssetIds: string[];
  size: SeedreamSizeLabel;
  width: number;
  height: number;
  outputFormat: SeedreamOutputFormat;
  watermark: boolean;
  optimizeMode: SeedreamOptimizeMode;
}

/**
 * Builds the sanitized provider request preview. Contains only the fields
 * listed in the Phase 1 spec — model, prompt, image placeholder metadata
 * (safe asset IDs, never URLs or Base64), size, output_format,
 * response_format, watermark, and optimize_prompt_options.mode.
 */
export function buildSeedreamRequestPreview(input: SeedreamPreviewInput): Record<string, unknown> {
  const sizeValue = input.size === 'custom' ? `${input.width}x${input.height}` : input.size;
  return {
    model: SEEDREAM_MODEL_ID,
    prompt: input.prompt,
    image:
      input.referenceAssetIds.length > 0
        ? { reference_asset_ids: input.referenceAssetIds, count: input.referenceAssetIds.length }
        : null,
    size: sizeValue,
    output_format: input.outputFormat,
    response_format: 'url',
    watermark: input.watermark,
    optimize_prompt_options: { mode: input.optimizeMode },
  };
}
