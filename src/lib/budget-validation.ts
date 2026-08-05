import { z } from 'zod';

// ─── Shared budget constants ───
// These defaults mirror BudgetSetting's Prisma defaults (prisma/schema.prisma)
// and are intentionally duplicated here so routes never guess.
export const DEFAULT_MONTHLY_LIMIT = 50;
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_ALERT_THRESHOLD = 0.8;
export const MAX_MONTHLY_LIMIT = 1_000_000;

// ─── Shared field schemas ───
// z.number() rejects strings, booleans, null, and objects. `.finite()`
// rejects NaN/Infinity (e.g. `1e999` parses to Infinity via JSON.parse).
// `.gt(0)` rejects zero and negative values; `.lte()` bounds the upper end.
export const monthlyLimitSchema = z
  .number()
  .finite('monthlyLimit must be a finite number')
  .gt(0, 'monthlyLimit must be greater than 0')
  .lte(MAX_MONTHLY_LIMIT, `monthlyLimit must be at most ${MAX_MONTHLY_LIMIT}`);

export const monthlyLimitOptionalSchema = monthlyLimitSchema.optional();

// Only USD is a fully supported BudgetSetting currency in this repository.
export const supportedCurrencySchema = z.enum(['USD']);

export const alertThresholdSchema = z
  .number()
  .finite('alertThreshold must be a finite number')
  .gt(0, 'alertThreshold must be greater than 0')
  .lte(1, 'alertThreshold must be at most 1');

// ─── POST /api/cost-summary ───
// Accepted: monthlyLimit (canonical) or monthlyBudgetUsd (legacy alias only).
// Rejected by `.strict()`: spentThisMonth, currency, alertThreshold, and any
// unknown property. Only monthlyLimit is ever persisted by this route.
export const costSummaryPostSchema = z
  .object({
    monthlyLimit: monthlyLimitOptionalSchema,
    monthlyBudgetUsd: monthlyLimitOptionalSchema,
  })
  .strict()
  .refine(
    data => data.monthlyLimit !== undefined || data.monthlyBudgetUsd !== undefined,
    { message: 'Provide monthlyLimit (or legacy monthlyBudgetUsd)' }
  )
  .refine(
    data =>
      data.monthlyLimit === undefined ||
      data.monthlyBudgetUsd === undefined ||
      data.monthlyLimit === data.monthlyBudgetUsd,
    { message: 'monthlyLimit and monthlyBudgetUsd must be equal when both are supplied' }
  );

// ─── PUT /api/budget ───
// Accepted: monthlyLimit, currency, alertThreshold. `.strict()` rejects
// spentThisMonth, id, and unknown properties. spentThisMonth is never
// client-settable — the server is the only writer of the spend accumulator.
export const budgetPutSchema = z
  .object({
    monthlyLimit: monthlyLimitOptionalSchema,
    currency: supportedCurrencySchema.optional(),
    alertThreshold: alertThresholdSchema.optional(),
  })
  .strict()
  .refine(
    data =>
      data.monthlyLimit !== undefined ||
      data.currency !== undefined ||
      data.alertThreshold !== undefined,
    { message: 'At least one of monthlyLimit, currency, or alertThreshold is required' }
  );

// ─── Helpers ───
export function firstZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request body';
}
