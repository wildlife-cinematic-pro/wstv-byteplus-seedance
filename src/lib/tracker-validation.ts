import { z } from 'zod';

// ─── Shared constants ───
// Financial bounds mirror repository conventions (budget-validation.ts caps
// monthly budget at 1,000,000 USD). Token counts are capped far above any
// real plan (7M tokens) while still rejecting absurd/overflow values.
export const MAX_USD = 1_000_000;
export const MAX_TOKENS = 1_000_000_000_000;

// ─── Shared scalars ───
// z.number() rejects strings, booleans, null and objects. `.finite()` rejects
// NaN/Infinity (e.g. 1e999 parsed from JSON). `.gt()` rejects zero/negative
// where a positive value is required; `.gte()` keeps 0 legal for costs/rates
// that may legitimately be zero (free tiers, empty manual entries).
export const boundedStringSchema = (max: number) => z.string().trim().min(1).max(max);
export const nullableStringSchema = (max: number) => z.string().trim().max(max).nullable().optional();

export const idSchema = z.string().trim().min(1).max(120);
export const nameSchema = z.string().trim().min(1).max(200);
export const notesSchema = z.string().trim().max(4_000).nullable().optional();
export const statusSchema = z.string().trim().min(1).max(30);

export const positiveUsdSchema = z
  .number()
  .finite('must be a finite number')
  .gt(0, 'must be greater than 0')
  .lte(MAX_USD, `must be at most ${MAX_USD}`);
export const nonNegativeUsdSchema = z
  .number()
  .finite('must be a finite number')
  .gte(0, 'must not be negative')
  .lte(MAX_USD, `must be at most ${MAX_USD}`);

export const tokenCountSchema = z.number().int().gte(0).lte(MAX_TOKENS);
export const positiveIntSchema = z.number().int().gt(0).lte(1_000_000);

// ISO-8601 or YYYY-MM-DD date strings as sent by the dashboard (`<input
// type="date">` yields YYYY-MM-DD; toISOString() yields full ISO-8601).
export const dateStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .refine(value => !Number.isNaN(Date.parse(value)), 'Invalid date string');
export const nullableDateSchema = dateStringSchema.nullable().optional();

// Only uppercase 3-letter ISO codes are accepted (USD, JPY, ...).
export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/, 'Invalid currency code');

// ─── POST /api/subscriptions/plans ───
// The dashboard's plan-price editor POSTs the full row from GET back to this
// route (`{ ...plan, priceUsd }`), so `id`/`createdAt`/`updatedAt` are accepted
// explicitly and ignored at write time. Everything else is strict: unknown
// keys, strings-as-numbers, NaN, zero/negative prices and excessive values are
// rejected.
export const subscriptionPlanCreateSchema = z
  .object({
    name: nameSchema,
    priceUsd: positiveUsdSchema,
    tokenAllowance: tokenCountSchema,
    validityDays: z.number().int().min(1).max(36_500).default(90),
    provider: boundedStringSchema(50).default('byteplus'),
    description: nullableStringSchema(2_000),
    status: statusSchema.default('active'),
    notes: notesSchema,
    // Read-only row fields echoed by the legacy plan-editor UI — ignored on create.
    id: idSchema.optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

// ─── POST /api/subscriptions/purchases ───
export const subscriptionPurchaseCreateSchema = z
  .object({
    planId: idSchema.nullable().optional(),
    planName: nameSchema,
    priceUsd: positiveUsdSchema,
    tokenAllowance: tokenCountSchema,
    tokensUsed: tokenCountSchema.default(0),
    purchaseDate: nullableDateSchema,
    expiryDate: nullableDateSchema,
    manualExpiryOverride: z.boolean().default(false),
    validityDays: z.number().int().min(1).max(36_500).default(90),
    provider: boundedStringSchema(50).default('byteplus'),
    billingCurrency: currencyCodeSchema.default('USD'),
    status: statusSchema.default('active'),
    notes: notesSchema,
  })
  .strict();

// ─── PUT /api/subscriptions/purchases/[id] ───
export const subscriptionPurchaseUpdateSchema = z
  .object({
    planId: idSchema.nullable().optional(),
    planName: nameSchema.optional(),
    priceUsd: positiveUsdSchema.optional(),
    tokenAllowance: tokenCountSchema.optional(),
    tokensUsed: tokenCountSchema.optional(),
    purchaseDate: nullableDateSchema,
    expiryDate: nullableDateSchema,
    manualExpiryOverride: z.boolean().optional(),
    validityDays: z.number().int().min(1).max(36_500).optional(),
    provider: boundedStringSchema(50).optional(),
    billingCurrency: currencyCodeSchema.optional(),
    status: statusSchema.optional(),
    notes: notesSchema,
  })
  .strict();

// ─── POST /api/usage-records ───
export const usageRecordCreateSchema = z
  .object({
    purchaseId: idSchema.nullable().optional(),
    projectTitle: nullableStringSchema(300),
    animalStoryName: nullableStringSchema(300),
    pricingModelId: idSchema.nullable().optional(),
    modelId: idSchema,
    modelName: nameSchema,
    mode: z
      .enum(['text-to-video', 'first-frame', 'first-and-last-frame', 'reference', 'extension'])
      .default('text-to-video'),
    width: positiveIntSchema,
    height: positiveIntSchema,
    fps: z.number().int().min(1).max(120).default(24),
    durationSeconds: positiveIntSchema,
    videoCount: z.number().int().min(1).max(1_000).default(1),
    pricingMode: z.enum(['token-based', 'per-video', 'manual']).default('token-based'),
    ratePerKTokens: nonNegativeUsdSchema.default(0),
    estimatedTokens: tokenCountSchema.default(0),
    estimatedCostUsd: nonNegativeUsdSchema.default(0),
    actualTokens: tokenCountSchema.nullable().optional(),
    actualCostUsd: nonNegativeUsdSchema.nullable().optional(),
    status: z.enum(['planned', 'dry-run', 'generated-manually', 'cancelled']).default('planned'),
    notes: notesSchema,
    generatedAt: nullableDateSchema,
  })
  .strict();

// ─── PUT /api/usage-records/[id] ───
// The dashboard's "save actual cost" control sends `{ actualTokens, actualCostUsd }`
// and may legitimately send an empty body when both inputs are blank (the
// existing route treated that as a no-op). All fields are optional so an empty
// body remains a valid no-op; provided fields are strictly validated.
export const usageRecordUpdateSchema = z
  .object({
    purchaseId: idSchema.nullable().optional(),
    projectTitle: nullableStringSchema(300),
    animalStoryName: nullableStringSchema(300),
    pricingModelId: idSchema.nullable().optional(),
    modelId: idSchema.optional(),
    modelName: nameSchema.optional(),
    mode: z
      .enum(['text-to-video', 'first-frame', 'first-and-last-frame', 'reference', 'extension'])
      .optional(),
    width: positiveIntSchema.optional(),
    height: positiveIntSchema.optional(),
    fps: z.number().int().min(1).max(120).optional(),
    durationSeconds: positiveIntSchema.optional(),
    videoCount: z.number().int().min(1).max(1_000).optional(),
    pricingMode: z.enum(['token-based', 'per-video', 'manual']).optional(),
    ratePerKTokens: nonNegativeUsdSchema.optional(),
    estimatedTokens: tokenCountSchema.optional(),
    estimatedCostUsd: nonNegativeUsdSchema.optional(),
    actualTokens: tokenCountSchema.nullable().optional(),
    actualCostUsd: nonNegativeUsdSchema.nullable().optional(),
    status: z.enum(['planned', 'dry-run', 'generated-manually', 'cancelled']).optional(),
    notes: notesSchema,
    generatedAt: nullableDateSchema,
  })
  .strict();

// ─── POST /api/pricing ───
// status stays a bounded string (seed data uses both 'active' and 'optional').
export const pricingModelCreateSchema = z
  .object({
    name: nameSchema,
    modelId: idSchema,
    userLabel: nullableStringSchema(200),
    provider: boundedStringSchema(50).default('byteplus'),
    pricingMode: z.enum(['token-based', 'per-video', 'manual']).default('token-based'),
    rate480p: nonNegativeUsdSchema.default(0),
    rate720p: nonNegativeUsdSchema.default(0),
    rate1080p: nonNegativeUsdSchema.default(0),
    rate4k: nonNegativeUsdSchema.default(0),
    perVideoCost: nonNegativeUsdSchema.nullable().optional(),
    supports480p: z.boolean().default(true),
    supports720p: z.boolean().default(true),
    supports1080p: z.boolean().default(true),
    supports4k: z.boolean().default(false),
    minDurationSec: z.number().int().min(1).max(3_600).default(4),
    maxDurationSec: z.number().int().min(1).max(3_600).default(15),
    supportedModes: boundedStringSchema(500).default('text-to-video,first-frame,first-and-last-frame,reference,extension'),
    status: statusSchema.default('active'),
    notes: notesSchema,
  })
  .strict();

// ─── PUT /api/pricing/[id] ───
// The dashboard rate editor sends a single field like `{ rate720p: 0.008 }`.
export const pricingModelUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    modelId: idSchema.optional(),
    userLabel: nullableStringSchema(200),
    provider: boundedStringSchema(50).optional(),
    pricingMode: z.enum(['token-based', 'per-video', 'manual']).optional(),
    rate480p: nonNegativeUsdSchema.optional(),
    rate720p: nonNegativeUsdSchema.optional(),
    rate1080p: nonNegativeUsdSchema.optional(),
    rate4k: nonNegativeUsdSchema.optional(),
    perVideoCost: nonNegativeUsdSchema.nullable().optional(),
    supports480p: z.boolean().optional(),
    supports720p: z.boolean().optional(),
    supports1080p: z.boolean().optional(),
    supports4k: z.boolean().optional(),
    minDurationSec: z.number().int().min(1).max(3_600).optional(),
    maxDurationSec: z.number().int().min(1).max(3_600).optional(),
    supportedModes: boundedStringSchema(500).optional(),
    status: statusSchema.optional(),
    notes: notesSchema,
  })
  .strict();

// ─── PUT /api/exchange-rates ───
// Requires a positive finite rate plus either an explicit id or a valid
// fromCurrency/toCurrency pair (matching the existing route's lookup logic).
export const exchangeRatePutSchema = z
  .object({
    id: idSchema.optional(),
    fromCurrency: currencyCodeSchema.optional(),
    toCurrency: currencyCodeSchema.optional(),
    rate: positiveUsdSchema,
    source: boundedStringSchema(50).optional(),
  })
  .strict()
  .refine(
    data => !!data.id || (!!data.fromCurrency && !!data.toCurrency),
    { message: 'Provide id or fromCurrency/toCurrency pair' }
  );

// ─── POST /api/presets ───
export const presetCreateSchema = z
  .object({
    name: nameSchema,
    icon: boundedStringSchema(50).default('🎬'),
    category: boundedStringSchema(60).default('wildlife'),
    promptTemplate: z.string().trim().min(1).max(10_000),
    hookTemplate: nullableStringSchema(4_000),
    structureNotes: nullableStringSchema(8_000),
    safetyRules: nullableStringSchema(10_000),
    captionStyle: nullableStringSchema(4_000),
    hashtagStyle: nullableStringSchema(4_000),
    defaultModel: boundedStringSchema(120).default('seedance-2.0'),
    defaultResolution: boundedStringSchema(20).default('720p'),
    defaultDuration: z.number().int().min(1).max(3_600).default(15),
    defaultFps: z.number().int().min(1).max(120).default(24),
    animalType: nullableStringSchema(120),
    biome: nullableStringSchema(120),
    dangerType: nullableStringSchema(120),
    emotionalBeat: nullableStringSchema(120),
    sortOrder: z.number().int().min(0).max(1_000_000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

// ─── PUT /api/presets/[id] ───
export const presetUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    icon: boundedStringSchema(50).optional(),
    category: boundedStringSchema(60).optional(),
    promptTemplate: z.string().trim().min(1).max(10_000).optional(),
    hookTemplate: nullableStringSchema(4_000),
    structureNotes: nullableStringSchema(8_000),
    safetyRules: nullableStringSchema(10_000),
    captionStyle: nullableStringSchema(4_000),
    hashtagStyle: nullableStringSchema(4_000),
    defaultModel: boundedStringSchema(120).optional(),
    defaultResolution: boundedStringSchema(20).optional(),
    defaultDuration: z.number().int().min(1).max(3_600).optional(),
    defaultFps: z.number().int().min(1).max(120).optional(),
    animalType: nullableStringSchema(120),
    biome: nullableStringSchema(120),
    dangerType: nullableStringSchema(120),
    emotionalBeat: nullableStringSchema(120),
    sortOrder: z.number().int().min(0).max(1_000_000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

// ─── POST /api/cost-calculator ───
// ratePerKTokens may be 0 (the UI allows a blank/zero rate and the existing
// route accepted 0). modelId may be '' (unselected dropdown placeholder).
export const costCalculatorSchema = z
  .object({
    width: z.number().int().gt(0).lte(10_000),
    height: z.number().int().gt(0).lte(10_000),
    fps: z.number().int().min(1).max(120).default(24),
    durationSeconds: z.number().int().gt(0).lte(3_600),
    videoCount: z.number().int().min(1).max(1_000).default(1),
    modelId: z.string().trim().max(120).optional(),
    ratePerKTokens: nonNegativeUsdSchema,
    exchangeRate: z.number().finite('must be a finite number').gt(0, 'must be greater than 0').lte(MAX_USD).default(149.5),
    intelligentMode: z.boolean().default(false),
    tokenAllowance: tokenCountSchema.nullable().optional(),
    tokensUsed: tokenCountSchema.default(0),
  })
  .strict();
