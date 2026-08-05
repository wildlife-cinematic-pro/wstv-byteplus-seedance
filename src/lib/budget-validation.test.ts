import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  budgetPutSchema,
  costSummaryPostSchema,
  monthlyLimitSchema,
  alertThresholdSchema,
  supportedCurrencySchema,
  DEFAULT_MONTHLY_LIMIT,
  DEFAULT_CURRENCY,
  DEFAULT_ALERT_THRESHOLD,
  MAX_MONTHLY_LIMIT,
} from './budget-validation';

// ─── Fixtures / helpers ───

function readRoute(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const costSummarySource = readRoute('../app/api/cost-summary/route.ts');
const budgetSource = readRoute('../app/api/budget/route.ts');
const generateSource = readRoute('../app/api/generate/route.ts');
const realGenerateSource = readRoute('../app/api/real-generate/route.ts');

// ─── Budget validation: monthlyLimit ───

describe('monthlyLimit validation', () => {
  it('accepts a valid positive monthlyLimit', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(150).success, true);
    strictAssert.equal(monthlyLimitSchema.safeParse(0.01).success, true);
  });

  it('accepts the configured upper bound exactly', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(MAX_MONTHLY_LIMIT).success, true);
    strictAssert.equal(MAX_MONTHLY_LIMIT, 1_000_000);
  });

  it('rejects zero', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(0).success, false);
  });

  it('rejects negative values', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(-1).success, false);
    strictAssert.equal(monthlyLimitSchema.safeParse(-100).success, false);
  });

  it('rejects Infinity', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(Number.POSITIVE_INFINITY).success, false);
    strictAssert.equal(monthlyLimitSchema.safeParse(Number.NEGATIVE_INFINITY).success, false);
  });

  it('rejects NaN', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(Number.NaN).success, false);
  });

  it('rejects strings masquerading as numbers', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse('150').success, false);
  });

  it('rejects null, undefined, booleans and objects', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(null).success, false);
    strictAssert.equal(monthlyLimitSchema.safeParse(undefined).success, false);
    strictAssert.equal(monthlyLimitSchema.safeParse(true).success, false);
    strictAssert.equal(monthlyLimitSchema.safeParse({}).success, false);
  });

  it('rejects values above the configured maximum', () => {
    strictAssert.equal(monthlyLimitSchema.safeParse(1_000_001).success, false);
    strictAssert.equal(monthlyLimitSchema.safeParse(Number.MAX_SAFE_INTEGER).success, false);
  });
});

// ─── Budget validation: alertThreshold and currency ───

describe('alertThreshold validation', () => {
  it('accepts values in (0, 1]', () => {
    strictAssert.equal(alertThresholdSchema.safeParse(0.8).success, true);
    strictAssert.equal(alertThresholdSchema.safeParse(0.001).success, true);
    strictAssert.equal(alertThresholdSchema.safeParse(1).success, true);
  });

  it('rejects zero and negative values', () => {
    strictAssert.equal(alertThresholdSchema.safeParse(0).success, false);
    strictAssert.equal(alertThresholdSchema.safeParse(-0.1).success, false);
  });

  it('rejects values above 1', () => {
    strictAssert.equal(alertThresholdSchema.safeParse(1.01).success, false);
    strictAssert.equal(alertThresholdSchema.safeParse(2).success, false);
  });

  it('rejects non-finite and non-number values', () => {
    strictAssert.equal(alertThresholdSchema.safeParse(Number.POSITIVE_INFINITY).success, false);
    strictAssert.equal(alertThresholdSchema.safeParse('0.8').success, false);
  });
});

describe('supported currency validation', () => {
  it('accepts USD only', () => {
    strictAssert.equal(supportedCurrencySchema.safeParse('USD').success, true);
    strictAssert.equal(supportedCurrencySchema.safeParse('JPY').success, false);
    strictAssert.equal(supportedCurrencySchema.safeParse('EUR').success, false);
  });
});

// ─── Budget validation: PUT /api/budget schema ───

describe('budgetPutSchema (PUT /api/budget)', () => {
  it('accepts a single allowed field', () => {
    strictAssert.equal(budgetPutSchema.safeParse({ monthlyLimit: 200 }).success, true);
    strictAssert.equal(budgetPutSchema.safeParse({ currency: 'USD' }).success, true);
    strictAssert.equal(budgetPutSchema.safeParse({ alertThreshold: 0.9 }).success, true);
  });

  it('accepts all allowed fields together', () => {
    strictAssert.equal(
      budgetPutSchema.safeParse({ monthlyLimit: 200, currency: 'USD', alertThreshold: 0.9 }).success,
      true
    );
  });

  it('rejects spentThisMonth', () => {
    strictAssert.equal(budgetPutSchema.safeParse({ spentThisMonth: 0 }).success, false);
    strictAssert.equal(budgetPutSchema.safeParse({ monthlyLimit: 200, spentThisMonth: 0 }).success, false);
  });

  it('rejects id', () => {
    strictAssert.equal(budgetPutSchema.safeParse({ id: 'abc123' }).success, false);
    strictAssert.equal(budgetPutSchema.safeParse({ id: 'abc123', monthlyLimit: 200 }).success, false);
  });

  it('rejects unknown fields', () => {
    strictAssert.equal(budgetPutSchema.safeParse({ monthlyLimit: 200, extra: 1 }).success, false);
  });

  it('rejects an empty body', () => {
    strictAssert.equal(budgetPutSchema.safeParse({}).success, false);
  });

  it('rejects unsupported currency', () => {
    strictAssert.equal(budgetPutSchema.safeParse({ currency: 'JPY' }).success, false);
  });

  it('rejects invalid monthlyLimit and alertThreshold values', () => {
    strictAssert.equal(budgetPutSchema.safeParse({ monthlyLimit: 0 }).success, false);
    strictAssert.equal(budgetPutSchema.safeParse({ monthlyLimit: -1 }).success, false);
    strictAssert.equal(budgetPutSchema.safeParse({ monthlyLimit: '150' }).success, false);
    strictAssert.equal(budgetPutSchema.safeParse({ alertThreshold: 0 }).success, false);
    strictAssert.equal(budgetPutSchema.safeParse({ alertThreshold: 1.5 }).success, false);
  });
});

// ─── Budget validation: POST /api/cost-summary schema ───

describe('costSummaryPostSchema (POST /api/cost-summary)', () => {
  it('accepts monthlyLimit', () => {
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: 150 }).success, true);
  });

  it('accepts the legacy monthlyBudgetUsd alias', () => {
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyBudgetUsd: 150 }).success, true);
  });

  it('accepts equal aliases (backward compatibility)', () => {
    strictAssert.equal(
      costSummaryPostSchema.safeParse({ monthlyLimit: 150, monthlyBudgetUsd: 150 }).success,
      true
    );
  });

  it('rejects conflicting monthlyLimit/monthlyBudgetUsd', () => {
    strictAssert.equal(
      costSummaryPostSchema.safeParse({ monthlyLimit: 150, monthlyBudgetUsd: 200 }).success,
      false
    );
  });

  it('rejects an empty body', () => {
    strictAssert.equal(costSummaryPostSchema.safeParse({}).success, false);
  });

  it('rejects spentThisMonth', () => {
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: 150, spentThisMonth: 0 }).success, false);
  });

  it('rejects currency and alertThreshold', () => {
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: 150, currency: 'USD' }).success, false);
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: 150, alertThreshold: 0.5 }).success, false);
  });

  it('rejects unknown properties', () => {
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: 150, foo: 1 }).success, false);
  });

  it('rejects zero, negative, excessive, and string values', () => {
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: 0 }).success, false);
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: -5 }).success, false);
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: 1_000_001 }).success, false);
    strictAssert.equal(costSummaryPostSchema.safeParse({ monthlyLimit: '150' }).success, false);
  });
});

// ─── Defaults regression ───

describe('budget defaults', () => {
  it('defaults match the documented values', () => {
    strictAssert.equal(DEFAULT_MONTHLY_LIMIT, 50);
    strictAssert.equal(DEFAULT_CURRENCY, 'USD');
    strictAssert.equal(DEFAULT_ALERT_THRESHOLD, 0.8);
  });
});

// ─── Route security contract (static source assertions) ───

describe('Route security contract', () => {
  it('GET /api/cost-summary uses requireAuthenticatedUser', () => {
    strictAssert.match(costSummarySource, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(costSummarySource, /requireAuthenticatedUser\(request\)/);
  });

  it('POST /api/cost-summary uses requireProtectedMutation', () => {
    strictAssert.match(costSummarySource, /export async function POST\(request: NextRequest\)/);
    strictAssert.match(costSummarySource, /requireProtectedMutation\(request\)/);
  });

  it('GET /api/budget uses requireAuthenticatedUser', () => {
    strictAssert.match(budgetSource, /export async function GET\(request: NextRequest\)/);
    strictAssert.match(budgetSource, /requireAuthenticatedUser\(request\)/);
  });

  it('PUT /api/budget uses requireProtectedMutation', () => {
    strictAssert.match(budgetSource, /export async function PUT\(request: NextRequest\)/);
    strictAssert.match(budgetSource, /requireProtectedMutation\(request\)/);
  });
});

// ─── Accounting contract (static source assertions) ───

describe('Accounting contract', () => {
  it('canonical spend comes from BudgetSetting.spentThisMonth', () => {
    strictAssert.match(costSummarySource, /budgetSetting\?\.spentThisMonth/);
  });

  it('does not calculate canonical spend from only the latest 100 ledger rows', () => {
    strictAssert.doesNotMatch(costSummarySource, /take:\s*100/);
    strictAssert.doesNotMatch(costSummarySource, /ledger\.reduce/);
  });

  it('recentLedger remains limited independently to 20 rows', () => {
    strictAssert.match(costSummarySource, /take:\s*20/);
    strictAssert.match(costSummarySource, /recentLedger/);
  });

  it('ledger count does not depend on recentLedger.length', () => {
    strictAssert.match(costSummarySource, /db\.costLedger\.count\(\)/);
    strictAssert.doesNotMatch(costSummarySource, /plannedVideoCount:\s*ledger\.length/);
    strictAssert.match(costSummarySource, /plannedVideoCount:\s*ledgerCount/);
  });

  it('exposes spendBasis metadata explaining the canonical accumulator', () => {
    strictAssert.match(costSummarySource, /spendBasis:\s*'BudgetSetting\.spentThisMonth'/);
  });

  it('PUT /api/budget cannot reset spentThisMonth', () => {
    strictAssert.doesNotMatch(budgetSource, /spentThisMonth:\s*spentThisMonth/);
    strictAssert.doesNotMatch(budgetSource, /\(spentThisMonth !== undefined/);
    strictAssert.doesNotMatch(budgetSource, /data:\s*\{\s*spentThisMonth/);
  });

  it('POST /api/cost-summary cannot reset spentThisMonth', () => {
    strictAssert.doesNotMatch(costSummarySource, /data:\s*\{\s*spentThisMonth/);
    strictAssert.doesNotMatch(costSummarySource, /\(spentThisMonth !== undefined/);
  });

  it('paid-generation source still enforces the canonical budget accumulator', () => {
    strictAssert.match(generateSource, /budget\.monthlyLimit - budget\.spentThisMonth/);
    strictAssert.match(realGenerateSource, /budget\.monthlyLimit - budget\.spentThisMonth/);
  });
});
