import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  subscriptionPlanCreateSchema,
  subscriptionPurchaseCreateSchema,
  subscriptionPurchaseUpdateSchema,
  usageRecordCreateSchema,
  usageRecordUpdateSchema,
  pricingModelCreateSchema,
  pricingModelUpdateSchema,
  exchangeRatePutSchema,
  presetCreateSchema,
  presetUpdateSchema,
  costCalculatorSchema,
  MAX_USD,
} from './tracker-validation';

// ─── Fixtures / helpers ───

function readRoute(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const plansRoute = readRoute('../app/api/subscriptions/plans/route.ts');
const purchasesRoute = readRoute('../app/api/subscriptions/purchases/route.ts');
const purchasesIdRoute = readRoute('../app/api/subscriptions/purchases/[id]/route.ts');
const usageRoute = readRoute('../app/api/usage-records/route.ts');
const usageIdRoute = readRoute('../app/api/usage-records/[id]/route.ts');
const pricingRoute = readRoute('../app/api/pricing/route.ts');
const pricingIdRoute = readRoute('../app/api/pricing/[id]/route.ts');
const exchangeRatesRoute = readRoute('../app/api/exchange-rates/route.ts');
const presetsRoute = readRoute('../app/api/presets/route.ts');
const presetsIdRoute = readRoute('../app/api/presets/[id]/route.ts');
const budgetSnapshotRoute = readRoute('../app/api/budget-snapshot/route.ts');
const costCalculatorRoute = readRoute('../app/api/cost-calculator/route.ts');
const seedanceConfigRoute = readRoute('../app/api/seedance-config/route.ts');

const validPlan = {
  name: 'Light Plan',
  priceUsd: 30.1,
  tokenAllowance: 7_000_000,
  validityDays: 90,
  provider: 'byteplus',
  description: 'Starter pack',
  status: 'active',
  notes: null,
};

const validPurchase = {
  planId: null,
  planName: 'Light Plan',
  priceUsd: 30.1,
  tokenAllowance: 7_000_000,
  tokensUsed: 0,
  validityDays: 90,
  provider: 'byteplus',
  billingCurrency: 'USD',
  status: 'active',
  notes: null,
};

const validUsageRecord = {
  purchaseId: null,
  projectTitle: 'WSTV Wildlife Reel #1',
  animalStoryName: 'Tiger Hunt',
  modelId: 'dreamina-seedance-2-0-260128',
  modelName: 'Seedance 2.0',
  mode: 'text-to-video',
  width: 720,
  height: 1280,
  fps: 24,
  durationSeconds: 15,
  videoCount: 1,
  pricingMode: 'token-based',
  ratePerKTokens: 0.007,
  estimatedTokens: 324000,
  estimatedCostUsd: 2.268,
  actualTokens: null,
  actualCostUsd: null,
  status: 'generated-manually',
  notes: 'Manual entry',
  generatedAt: null,
};

const validPricingModel = {
  name: 'Seedance 2.0 Standard',
  modelId: 'dreamina-seedance-2-0-260128',
  userLabel: null,
  provider: 'byteplus',
  pricingMode: 'token-based',
  rate480p: 0.005,
  rate720p: 0.007,
  rate1080p: 0.0077,
  rate4k: 0,
  perVideoCost: null,
  supports480p: true,
  supports720p: true,
  supports1080p: true,
  supports4k: false,
  minDurationSec: 4,
  maxDurationSec: 15,
  supportedModes: 'text-to-video,first-frame,first-and-last-frame,reference,extension',
  status: 'active',
  notes: null,
};

const validPreset = {
  name: 'Mother Saves Baby',
  icon: '🎬',
  category: 'wildlife',
  promptTemplate: 'A mother bear saves her cub from a river current...',
  structureNotes: null,
  animalType: 'bear',
  biome: 'forest',
  dangerType: null,
  emotionalBeat: null,
  sortOrder: 1,
  isActive: true,
};

// ═══════════════════════════════════════════════════════
// Schema behavior: subscriptions/plans
// ═══════════════════════════════════════════════════════

describe('subscriptionPlanCreateSchema (POST /api/subscriptions/plans)', () => {
  it('accepts a valid plan', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse(validPlan).success, true);
  });

  it('accepts the legacy full-row spread sent by the plan-price editor UI', () => {
    // The dashboard editor POSTs `{ ...plan, priceUsd }` — the full row from
    // GET including read-only id/createdAt/updatedAt. Those must be accepted
    // (and ignored at write time) so the price-edit flow keeps working.
    const spread = {
      ...validPlan,
      id: 'cm0abcdef123456789',
      createdAt: '2026-06-25T10:00:00.000Z',
      updatedAt: '2026-06-25T10:00:00.000Z',
    };
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse(spread).success, true);
  });

  it('rejects missing required fields', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, name: undefined }).success, false);
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, priceUsd: undefined }).success, false);
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, tokenAllowance: undefined }).success, false);
  });

  it('rejects zero and negative priceUsd', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, priceUsd: 0 }).success, false);
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, priceUsd: -1 }).success, false);
  });

  it('rejects strings masquerading as numbers', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, priceUsd: '30.1' }).success, false);
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, tokenAllowance: '7000000' }).success, false);
  });

  it('rejects NaN and Infinity', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, priceUsd: Number.NaN }).success, false);
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, priceUsd: Number.POSITIVE_INFINITY }).success, false);
  });

  it('rejects excessively large values', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, priceUsd: MAX_USD + 1 }).success, false);
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, tokenAllowance: 1_000_000_000_001 }).success, false);
  });

  it('rejects unknown fields', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, spentThisMonth: 0 }).success, false);
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, evil: true }).success, false);
  });

  it('rejects negative tokenAllowance', () => {
    strictAssert.equal(subscriptionPlanCreateSchema.safeParse({ ...validPlan, tokenAllowance: -1 }).success, false);
  });
});

// ═══════════════════════════════════════════════════════
// Schema behavior: subscriptions/purchases
// ═══════════════════════════════════════════════════════

describe('subscriptionPurchaseCreateSchema (POST /api/subscriptions/purchases)', () => {
  it('accepts a valid purchase', () => {
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse(validPurchase).success, true);
  });

  it('rejects missing required fields', () => {
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, planName: undefined }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, priceUsd: undefined }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, tokenAllowance: undefined }).success, false);
  });

  it('rejects zero, negative, string, NaN and excessive priceUsd', () => {
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, priceUsd: 0 }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, priceUsd: -5 }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, priceUsd: '30.1' }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, priceUsd: Number.NaN }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, priceUsd: MAX_USD + 1 }).success, false);
  });

  it('rejects malformed billingCurrency (lowercase, too short, unknown characters)', () => {
    // JPY is a valid 3-letter ISO code and the repo supports USD→JPY conversion,
    // so only malformed codes are rejected.
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, billingCurrency: 'usd' }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, billingCurrency: 'US' }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, billingCurrency: 'USD1' }).success, false);
  });

  it('rejects invalid dates', () => {
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, purchaseDate: 'not-a-date' }).success, false);
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, expiryDate: 12345 }).success, false);
  });

  it('rejects unknown fields', () => {
    strictAssert.equal(subscriptionPurchaseCreateSchema.safeParse({ ...validPurchase, spentThisMonth: 0 }).success, false);
  });
});

describe('subscriptionPurchaseUpdateSchema (PUT /api/subscriptions/purchases/[id])', () => {
  it('accepts the dashboard expiry-override payload', () => {
    strictAssert.equal(
      subscriptionPurchaseUpdateSchema.safeParse({ expiryDate: '2026-09-14', manualExpiryOverride: true }).success,
      true
    );
  });

  it('accepts an empty body as a no-op (partial update contract)', () => {
    strictAssert.equal(subscriptionPurchaseUpdateSchema.safeParse({}).success, true);
  });

  it('rejects negative priceUsd, string values, and unknown fields', () => {
    strictAssert.equal(subscriptionPurchaseUpdateSchema.safeParse({ priceUsd: -1 }).success, false);
    strictAssert.equal(subscriptionPurchaseUpdateSchema.safeParse({ priceUsd: '30.1' }).success, false);
    strictAssert.equal(subscriptionPurchaseUpdateSchema.safeParse({ spentThisMonth: 5 }).success, false);
  });
});

// ═══════════════════════════════════════════════════════
// Schema behavior: usage-records
// ═══════════════════════════════════════════════════════

describe('usageRecordCreateSchema (POST /api/usage-records)', () => {
  it('accepts the dashboard manual-entry payload', () => {
    strictAssert.equal(usageRecordCreateSchema.safeParse(validUsageRecord).success, true);
  });

  it('accepts actual tokens/cost as numbers (manual actual entry)', () => {
    strictAssert.equal(
      usageRecordCreateSchema.safeParse({ ...validUsageRecord, actualTokens: 324000, actualCostUsd: 2.268 }).success,
      true
    );
  });

  it('rejects missing required fields', () => {
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, modelId: undefined }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, modelName: undefined }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, width: undefined }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, height: undefined }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, durationSeconds: undefined }).success, false);
  });

  it('rejects zero and negative dimensions/duration', () => {
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, width: 0 }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, height: -1 }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, durationSeconds: 0 }).success, false);
  });

  it('rejects strings masquerading as numbers', () => {
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, width: '720' }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, estimatedCostUsd: '2.268' }).success, false);
  });

  it('rejects negative costs and tokens', () => {
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, estimatedCostUsd: -1 }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, estimatedTokens: -5 }).success, false);
  });

  it('rejects unsupported mode, pricingMode and status', () => {
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, mode: 'hologram' }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, pricingMode: 'free' }).success, false);
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, status: 'viral' }).success, false);
  });

  it('rejects unknown fields', () => {
    strictAssert.equal(usageRecordCreateSchema.safeParse({ ...validUsageRecord, spentThisMonth: 0 }).success, false);
  });
});

describe('usageRecordUpdateSchema (PUT /api/usage-records/[id])', () => {
  it('accepts the dashboard actual-cost payload', () => {
    strictAssert.equal(
      usageRecordUpdateSchema.safeParse({ actualTokens: 324000, actualCostUsd: 2.268 }).success,
      true
    );
  });

  it('accepts an empty body as a no-op (dashboard can send {} when inputs are blank)', () => {
    strictAssert.equal(usageRecordUpdateSchema.safeParse({}).success, true);
  });

  it('rejects string numbers, NaN and unknown fields', () => {
    strictAssert.equal(usageRecordUpdateSchema.safeParse({ actualTokens: '324000' }).success, false);
    strictAssert.equal(usageRecordUpdateSchema.safeParse({ actualCostUsd: Number.POSITIVE_INFINITY }).success, false);
    strictAssert.equal(usageRecordUpdateSchema.safeParse({ spentThisMonth: 1 }).success, false);
  });
});

// ═══════════════════════════════════════════════════════
// Schema behavior: pricing
// ═══════════════════════════════════════════════════════

describe('pricingModelCreateSchema (POST /api/pricing)', () => {
  it('accepts a valid pricing model', () => {
    strictAssert.equal(pricingModelCreateSchema.safeParse(validPricingModel).success, true);
  });

  it('accepts seed-data status values (active and optional)', () => {
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, status: 'active' }).success, true);
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, status: 'optional' }).success, true);
  });

  it('rejects missing required fields', () => {
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, name: undefined }).success, false);
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, modelId: undefined }).success, false);
  });

  it('rejects negative and string rates', () => {
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, rate720p: -0.01 }).success, false);
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, rate720p: '0.007' }).success, false);
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, rate4k: Number.NaN }).success, false);
  });

  it('rejects unknown fields', () => {
    strictAssert.equal(pricingModelCreateSchema.safeParse({ ...validPricingModel, spentThisMonth: 0 }).success, false);
  });
});

describe('pricingModelUpdateSchema (PUT /api/pricing/[id])', () => {
  it('accepts the dashboard single-rate-field payload', () => {
    strictAssert.equal(pricingModelUpdateSchema.safeParse({ rate720p: 0.008 }).success, true);
    strictAssert.equal(pricingModelUpdateSchema.safeParse({ rate4k: 0.015 }).success, true);
  });

  it('accepts an empty body as a no-op', () => {
    strictAssert.equal(pricingModelUpdateSchema.safeParse({}).success, true);
  });

  it('rejects negative rates, strings and unknown fields', () => {
    strictAssert.equal(pricingModelUpdateSchema.safeParse({ rate720p: -1 }).success, false);
    strictAssert.equal(pricingModelUpdateSchema.safeParse({ rate720p: '0.008' }).success, false);
    strictAssert.equal(pricingModelUpdateSchema.safeParse({ spentThisMonth: 1 }).success, false);
  });
});

// ═══════════════════════════════════════════════════════
// Schema behavior: exchange-rates
// ═══════════════════════════════════════════════════════

describe('exchangeRatePutSchema (PUT /api/exchange-rates)', () => {
  it('accepts id + rate', () => {
    strictAssert.equal(exchangeRatePutSchema.safeParse({ id: 'rate-001', rate: 149.5 }).success, true);
  });

  it('accepts fromCurrency/toCurrency pair + rate', () => {
    strictAssert.equal(
      exchangeRatePutSchema.safeParse({ fromCurrency: 'USD', toCurrency: 'JPY', rate: 149.5 }).success,
      true
    );
  });

  it('rejects a body without id or currency pair', () => {
    strictAssert.equal(exchangeRatePutSchema.safeParse({ rate: 149.5 }).success, false);
  });

  it('rejects zero, negative, string and NaN rates', () => {
    strictAssert.equal(exchangeRatePutSchema.safeParse({ id: 'r', rate: 0 }).success, false);
    strictAssert.equal(exchangeRatePutSchema.safeParse({ id: 'r', rate: -1 }).success, false);
    strictAssert.equal(exchangeRatePutSchema.safeParse({ id: 'r', rate: '149.5' }).success, false);
    strictAssert.equal(exchangeRatePutSchema.safeParse({ id: 'r', rate: Number.POSITIVE_INFINITY }).success, false);
  });

  it('rejects malformed currency codes and unknown fields', () => {
    strictAssert.equal(exchangeRatePutSchema.safeParse({ fromCurrency: 'usd', toCurrency: 'JPY', rate: 1 }).success, false);
    strictAssert.equal(exchangeRatePutSchema.safeParse({ fromCurrency: 'USD', toCurrency: 'JPY', rate: 1, spentThisMonth: 0 }).success, false);
  });
});

// ═══════════════════════════════════════════════════════
// Schema behavior: presets
// ═══════════════════════════════════════════════════════

describe('presetCreateSchema (POST /api/presets)', () => {
  it('accepts the dashboard preset payload', () => {
    strictAssert.equal(presetCreateSchema.safeParse(validPreset).success, true);
  });

  it('rejects missing name/promptTemplate', () => {
    strictAssert.equal(presetCreateSchema.safeParse({ ...validPreset, name: undefined }).success, false);
    strictAssert.equal(presetCreateSchema.safeParse({ ...validPreset, promptTemplate: undefined }).success, false);
  });

  it('rejects negative sortOrder and unknown fields', () => {
    strictAssert.equal(presetCreateSchema.safeParse({ ...validPreset, sortOrder: -1 }).success, false);
    strictAssert.equal(presetCreateSchema.safeParse({ ...validPreset, spentThisMonth: 0 }).success, false);
  });
});

describe('presetUpdateSchema (PUT /api/presets/[id])', () => {
  it('accepts a partial update and empty no-op', () => {
    strictAssert.equal(presetUpdateSchema.safeParse({ isActive: false }).success, true);
    strictAssert.equal(presetUpdateSchema.safeParse({}).success, true);
  });

  it('rejects unknown fields and string numbers', () => {
    strictAssert.equal(presetUpdateSchema.safeParse({ spentThisMonth: 1 }).success, false);
    strictAssert.equal(presetUpdateSchema.safeParse({ sortOrder: '5' }).success, false);
  });
});

// ═══════════════════════════════════════════════════════
// Schema behavior: cost-calculator
// ═══════════════════════════════════════════════════════

describe('costCalculatorSchema (POST /api/cost-calculator)', () => {
  it('accepts the dashboard calculator payload', () => {
    strictAssert.equal(
      costCalculatorSchema.safeParse({
        width: 720, height: 1280, fps: 24, durationSeconds: 10, videoCount: 1,
        modelId: 'dreamina-seedance-2-0-260128', ratePerKTokens: 0.007,
        exchangeRate: 149.5, intelligentMode: false,
        tokenAllowance: 7_000_000, tokensUsed: 648_000,
      }).success,
      true
    );
  });

  it('accepts zero ratePerKTokens (UI allows a blank/zero rate) and empty modelId', () => {
    strictAssert.equal(
      costCalculatorSchema.safeParse({
        width: 720, height: 1280, durationSeconds: 10, ratePerKTokens: 0, modelId: '',
      }).success,
      true
    );
  });

  it('accepts omitted optional fields (budget may be absent)', () => {
    strictAssert.equal(
      costCalculatorSchema.safeParse({
        width: 720, height: 1280, durationSeconds: 10, ratePerKTokens: 0.007,
      }).success,
      true
    );
  });

  it('rejects missing required fields and zero dimensions', () => {
    strictAssert.equal(costCalculatorSchema.safeParse({ width: 720, height: 1280, ratePerKTokens: 1 }).success, false);
    strictAssert.equal(costCalculatorSchema.safeParse({ width: 0, height: 1280, durationSeconds: 10, ratePerKTokens: 1 }).success, false);
  });

  it('rejects string numbers, NaN and unknown fields', () => {
    strictAssert.equal(costCalculatorSchema.safeParse({ width: '720', height: 1280, durationSeconds: 10, ratePerKTokens: 1 }).success, false);
    strictAssert.equal(costCalculatorSchema.safeParse({ width: 720, height: 1280, durationSeconds: 10, ratePerKTokens: Number.NaN }).success, false);
    strictAssert.equal(costCalculatorSchema.safeParse({ width: 720, height: 1280, durationSeconds: 10, ratePerKTokens: 1, spentThisMonth: 0 }).success, false);
  });
});

// ═══════════════════════════════════════════════════════
// Route security contract (static source assertions)
// ═══════════════════════════════════════════════════════

describe('Route security contract', () => {
  it('GET /api/subscriptions/plans uses requireAuthenticatedUser', () => {
    strictAssert.match(plansRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(plansRoute, /requireAuthenticatedUser\(request\)/);
  });
  it('POST /api/subscriptions/plans uses requireProtectedMutation + schema', () => {
    strictAssert.match(plansRoute, /export async function POST\(request: NextRequest\)/);
    strictAssert.match(plansRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(plansRoute, /subscriptionPlanCreateSchema\.safeParse/);
  });

  it('GET /api/subscriptions/purchases uses requireAuthenticatedUser', () => {
    strictAssert.match(purchasesRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(purchasesRoute, /requireAuthenticatedUser\(request\)/);
  });
  it('POST /api/subscriptions/purchases uses requireProtectedMutation + schema', () => {
    strictAssert.match(purchasesRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(purchasesRoute, /subscriptionPurchaseCreateSchema\.safeParse/);
  });
  it('PUT /api/subscriptions/purchases/[id] uses requireProtectedMutation + schema', () => {
    strictAssert.match(purchasesIdRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(purchasesIdRoute, /subscriptionPurchaseUpdateSchema\.safeParse/);
  });

  it('GET /api/usage-records uses requireAuthenticatedUser', () => {
    strictAssert.match(usageRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(usageRoute, /requireAuthenticatedUser\(request\)/);
  });
  it('POST /api/usage-records uses requireProtectedMutation + schema', () => {
    strictAssert.match(usageRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(usageRoute, /usageRecordCreateSchema\.safeParse/);
  });
  it('PUT /api/usage-records/[id] uses requireProtectedMutation + schema', () => {
    strictAssert.match(usageIdRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(usageIdRoute, /usageRecordUpdateSchema\.safeParse/);
  });

  it('GET /api/pricing uses requireAuthenticatedUser', () => {
    strictAssert.match(pricingRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(pricingRoute, /requireAuthenticatedUser\(request\)/);
  });
  it('POST /api/pricing uses requireProtectedMutation + schema', () => {
    strictAssert.match(pricingRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(pricingRoute, /pricingModelCreateSchema\.safeParse/);
  });
  it('GET /api/pricing/[id] uses requireAuthenticatedUser', () => {
    strictAssert.match(pricingIdRoute, /export async function GET\(/);
    strictAssert.match(pricingIdRoute, /request: NextRequest/);
    strictAssert.match(pricingIdRoute, /requireAuthenticatedUser\(request\)/);
  });
  it('PUT /api/pricing/[id] uses requireProtectedMutation + schema', () => {
    strictAssert.match(pricingIdRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(pricingIdRoute, /pricingModelUpdateSchema\.safeParse/);
  });
  it('DELETE /api/pricing/[id] uses requireProtectedMutation', () => {
    strictAssert.match(pricingIdRoute, /export async function DELETE\(/);
    strictAssert.match(pricingIdRoute, /request: NextRequest/);
    strictAssert.match(pricingIdRoute, /requireProtectedMutation\(request\)/);
  });

  it('GET /api/exchange-rates uses requireAuthenticatedUser', () => {
    strictAssert.match(exchangeRatesRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(exchangeRatesRoute, /requireAuthenticatedUser\(request\)/);
  });
  it('PUT /api/exchange-rates uses requireProtectedMutation + schema', () => {
    strictAssert.match(exchangeRatesRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(exchangeRatesRoute, /exchangeRatePutSchema\.safeParse/);
  });

  it('GET /api/presets uses requireAuthenticatedUser', () => {
    strictAssert.match(presetsRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(presetsRoute, /requireAuthenticatedUser\(request\)/);
  });
  it('POST /api/presets uses requireProtectedMutation + schema', () => {
    strictAssert.match(presetsRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(presetsRoute, /presetCreateSchema\.safeParse/);
  });
  it('PUT /api/presets/[id] uses requireProtectedMutation + schema', () => {
    strictAssert.match(presetsIdRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(presetsIdRoute, /presetUpdateSchema\.safeParse/);
  });
  it('DELETE /api/presets/[id] uses requireProtectedMutation', () => {
    strictAssert.match(presetsIdRoute, /export async function DELETE\(/);
    strictAssert.match(presetsIdRoute, /request: NextRequest/);
    strictAssert.match(presetsIdRoute, /requireProtectedMutation\(request\)/);
  });

  it('GET /api/budget-snapshot uses requireAuthenticatedUser', () => {
    strictAssert.match(budgetSnapshotRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(budgetSnapshotRoute, /requireAuthenticatedUser\(request\)/);
  });

  it('POST /api/cost-calculator uses requireProtectedMutation + schema', () => {
    strictAssert.match(costCalculatorRoute, /export async function POST\(request: NextRequest\)/);
    strictAssert.match(costCalculatorRoute, /requireProtectedMutation\(request\)/);
    strictAssert.match(costCalculatorRoute, /costCalculatorSchema\.safeParse/);
  });

  it('GET /api/seedance-config uses requireAuthenticatedUser', () => {
    strictAssert.match(seedanceConfigRoute, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(seedanceConfigRoute, /requireAuthenticatedUser\(request\)/);
  });
});

// ═══════════════════════════════════════════════════════
// Response-shape compatibility (static source assertions)
// ═══════════════════════════════════════════════════════

describe('Response-shape compatibility', () => {
  it('list GET routes still return bare arrays (privateJson(array))', () => {
    strictAssert.match(plansRoute, /return privateJson\(plans\);/);
    strictAssert.match(purchasesRoute, /return privateJson\(purchases\);/);
    strictAssert.match(usageRoute, /return privateJson\(usageRecords\);/);
    strictAssert.match(pricingRoute, /return privateJson\(pricingModels\);/);
    strictAssert.match(exchangeRatesRoute, /return privateJson\(rates\);/);
    strictAssert.match(presetsRoute, /return privateJson\(presets\);/);
  });

  it('create routes preserve 201 status', () => {
    strictAssert.match(plansRoute, /privateJson\(plan, \{ status: 201 \}\)/);
    strictAssert.match(purchasesRoute, /privateJson\(purchase, \{ status: 201 \}\)/);
    strictAssert.match(usageRoute, /privateJson\(usageRecord, \{ status: 201 \}\)/);
    strictAssert.match(pricingRoute, /privateJson\(pricingModel, \{ status: 201 \}\)/);
    strictAssert.match(presetsRoute, /privateJson\(preset, \{ status: 201 \}\)/);
  });

  it('usage-records PUT still recalculates purchase tokensUsed on actualTokens update', () => {
    strictAssert.match(usageIdRoute, /tokensUsed: totalTokensUsed/);
    strictAssert.match(usageIdRoute, /db\.subscriptionPurchase\.update/);
  });
});

// ═══════════════════════════════════════════════════════
// Regression: protected paid-generation & budget routes untouched
// ═══════════════════════════════════════════════════════

describe('Protected financial invariants preserved', () => {
  it('paid-generation source still enforces the canonical budget accumulator', () => {
    const realGenerateSource = readRoute('../app/api/real-generate/route.ts');
    const generateSource = readRoute('../app/api/generate/route.ts');
    strictAssert.match(realGenerateSource, /budget\.monthlyLimit - budget\.spentThisMonth/);
    strictAssert.match(generateSource, /budget\.monthlyLimit - budget\.spentThisMonth/);
  });

  it('budget/cost-summary routes still carry their hardened guards and schemas', () => {
    const budgetSource = readRoute('../app/api/budget/route.ts');
    const costSummarySource = readRoute('../app/api/cost-summary/route.ts');
    strictAssert.match(budgetSource, /requireAuthenticatedUser\(request\)/);
    strictAssert.match(budgetSource, /requireProtectedMutation\(request\)/);
    strictAssert.match(costSummarySource, /requireAuthenticatedUser\(request\)/);
    strictAssert.match(costSummarySource, /requireProtectedMutation\(request\)/);
    strictAssert.match(costSummarySource, /label:\s*'Current Period Spend'/);
  });
});
