/**
 * Seedream 5.0 Pro Image — Dry-Run Cost Estimator
 * ==================================================
 *
 * Deterministic, local-only estimate. Never calls the provider, never reads
 * a balance, and is never added to actual spend / budget usage — Phase 1 is
 * dry-run only.
 *
 * Threshold and both price tiers are taken from the producer-verified
 * BytePlus ModelArk console/documentation, not derived locally.
 */

import type { SeedreamPricingBasis } from './seedream-image-validation';

export const SEEDREAM_INPUT_REF_COST_ADDITIONAL_USD = 0.003;
export const SEEDREAM_OUTPUT_COST_LOW_USD = 0.045;
export const SEEDREAM_OUTPUT_COST_HIGH_USD = 0.09;
export const SEEDREAM_OUTPUT_PIXEL_THRESHOLD = 2_610_000;

export interface SeedreamCostEstimateInput {
  referenceImageCount: number;
  outputPixelCount: number;
  pricingBasis: SeedreamPricingBasis;
}

export interface SeedreamCostEstimate {
  inputReferenceCostUsd: number;
  outputCostUsd: number;
  estimatedTotalCostUsd: number;
  outputPixelCount: number;
  pricingBasis: SeedreamPricingBasis;
  estimateOnly: true;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Input reference cost: the first reference image is free; each additional
 * reference image (2nd through 10th) costs $0.003.
 */
export function estimateInputReferenceCostUsd(referenceImageCount: number): number {
  const billable = Math.max(0, referenceImageCount - 1);
  return round4(billable * SEEDREAM_INPUT_REF_COST_ADDITIONAL_USD);
}

/**
 * Output cost: a flat rate keyed on total output pixel count, at or below
 * vs. above the 2,610,000-pixel threshold.
 */
export function estimateOutputCostUsd(outputPixelCount: number): number {
  return outputPixelCount <= SEEDREAM_OUTPUT_PIXEL_THRESHOLD ? SEEDREAM_OUTPUT_COST_LOW_USD : SEEDREAM_OUTPUT_COST_HIGH_USD;
}

export function estimateSeedreamImageCost(input: SeedreamCostEstimateInput): SeedreamCostEstimate {
  const inputReferenceCostUsd = estimateInputReferenceCostUsd(input.referenceImageCount);
  const outputCostUsd = estimateOutputCostUsd(input.outputPixelCount);
  return {
    inputReferenceCostUsd,
    outputCostUsd,
    estimatedTotalCostUsd: round4(inputReferenceCostUsd + outputCostUsd),
    outputPixelCount: input.outputPixelCount,
    pricingBasis: input.pricingBasis,
    estimateOnly: true,
  };
}
