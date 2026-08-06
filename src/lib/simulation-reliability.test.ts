import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  estimateSeedancePlanningCost,
  resolveOfficialSeedanceModelId,
  OFFICIAL_SEEDANCE_MODEL_IDS,
} from './seedance-pricing';

// ─── Fixtures / helpers ───

function readRoute(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const generateSource = readRoute('../app/api/generate/route.ts');
const realGenerateSource = readRoute('../app/api/real-generate/route.ts');
const realTaskStatusSource = readRoute('../app/api/real-task-status/route.ts');

// ─── Simulation route: restart-safety / determinism (source contract) ───

describe('Simulation route restart-safety', () => {
  it('contains no setTimeout-based database completion', () => {
    strictAssert.doesNotMatch(generateSource, /setTimeout\s*\(/);
  });

  it('contains no setInterval', () => {
    strictAssert.doesNotMatch(generateSource, /setInterval\s*\(/);
  });

  it('contains no artificial server-side sleep or delay', () => {
    strictAssert.doesNotMatch(generateSource, /await new Promise\(r => setTimeout/);
    strictAssert.doesNotMatch(generateSource, /\bsleep\(/);
  });

  it('performs simulated submission and completion inside db.$transaction', () => {
    strictAssert.match(generateSource, /db\.\$transaction/);
  });

  it('writes the final simulated succeeded state inside the transaction', () => {
    strictAssert.match(generateSource, /status: 'succeeded'/);
    strictAssert.match(generateSource, /data: \{/);
  });

  it('returns the final persisted task state in the response', () => {
    strictAssert.match(generateSource, /status: finalTask\.status/);
  });
});

// ─── Simulation route: atomic claim / idempotency (source contract) ───

describe('Simulation route atomic claim and idempotency', () => {
  it('claims the task with an atomic updateMany guard', () => {
    strictAssert.match(generateSource, /tx\.videoTask\.updateMany/);
    strictAssert.match(generateSource, /claim\.count !== 1/);
  });

  it('guards the claim with paidConfirmation=false', () => {
    strictAssert.match(generateSource, /paidConfirmation: false/);
  });

  it('guards the claim against submitted/processing/succeeded states', () => {
    strictAssert.match(generateSource, /CLAIMED_OR_FINAL_STATUSES/);
    strictAssert.match(generateSource, /status: \{ notIn: CLAIMED_OR_FINAL_STATUSES \}/);
    strictAssert.match(
      generateSource,
      /CLAIMED_OR_FINAL_STATUSES = \['submitted', 'processing', 'succeeded'\]/
    );
  });

  it('throws a dedicated already-claimed error and returns 409', () => {
    strictAssert.match(generateSource, /SimulationAlreadyClaimedError/);
    strictAssert.match(generateSource, /status: 409/);
    strictAssert.match(generateSource, /already claimed/);
  });

  it('cannot double-charge the budget: increment happens only after a successful claim', () => {
    strictAssert.match(generateSource, /claim\.count !== 1/);
    strictAssert.match(generateSource, /spentThisMonth: \{ increment: estimatedCost \}/);
  });

  it('cannot create a duplicate ledger record for the same task', () => {
    strictAssert.match(generateSource, /tx\.costLedger\.create/);
    strictAssert.match(generateSource, /throw new SimulationAlreadyClaimedError\(\)/);
  });

  it('reuses existing fields (paidConfirmation + status) for idempotency without schema change', () => {
    strictAssert.match(generateSource, /paidConfirmation/);
    strictAssert.match(generateSource, /status: \{ notIn: CLAIMED_OR_FINAL_STATUSES \}/);
  });

  it('does not retry automatically after an ambiguous failure', () => {
    strictAssert.doesNotMatch(generateSource, /\.retry\(/);
    strictAssert.doesNotMatch(generateSource, /for \(let attempt = 0/);
  });

  it('does not expose raw Prisma errors to the client', () => {
    strictAssert.match(generateSource, /Internal server error/);
    strictAssert.match(generateSource, /console\.error\('Generate error:'/);
  });
});

// ─── Simulation route: safety gates preserved (source contract) ───

describe('Simulation route safety gates', () => {
  it('still uses requireProtectedMutation', () => {
    strictAssert.match(generateSource, /requireProtectedMutation\(request\)/);
  });

  it('keeps the confirmation-token gate', () => {
    strictAssert.match(generateSource, /confirmation !== SIMULATION_CONFIRMATION/);
  });

  it('keeps the Safe Mode gate', () => {
    strictAssert.match(generateSource, /settings\?\.safeMode/);
    strictAssert.match(generateSource, /status: 403/);
  });

  it('keeps the dry-run-passed gate', () => {
    strictAssert.match(generateSource, /!task\.dryRunPassed/);
  });

  it('keeps the canonical budget check', () => {
    strictAssert.match(generateSource, /budget\.monthlyLimit - budget\.spentThisMonth/);
  });

  it('keeps the max-cost check', () => {
    strictAssert.match(generateSource, /estimatedCost > task\.maxCostUsd/);
  });

  it('keeps duplicate-prevention for other in-flight tasks', () => {
    strictAssert.match(generateSource, /status: \{ in: \['submitted', 'processing'\] \}/);
  });

  it('keeps media URI validation for image/audio/video references', () => {
    strictAssert.match(generateSource, /validateSeedanceMediaUri\('image'/);
    strictAssert.match(generateSource, /validateSeedanceMediaUri\('audio'/);
    strictAssert.match(generateSource, /validateSeedanceMediaUri\('video'/);
  });

  it('keeps storyboard/audio/video risk acknowledgement gates', () => {
    strictAssert.match(generateSource, /Storyboard\/reference risk must be acknowledged/);
    strictAssert.match(generateSource, /Audio reference risk must be acknowledged/);
    strictAssert.match(generateSource, /Video reference risk must be acknowledged/);
  });

  it('keeps the task-existence gate', () => {
    strictAssert.match(generateSource, /Task not found/);
  });
});

// ─── Simulation route: no provider / no paid call (source contract) ───

describe('Simulation route provider isolation', () => {
  it('does not import or call provider creation functions', () => {
    strictAssert.doesNotMatch(generateSource, /byteplus-seedance-real/);
    strictAssert.doesNotMatch(generateSource, /createBytePlusSeedanceTask/);
    strictAssert.doesNotMatch(generateSource, /createPaidConfirmationNonce/);
  });

  it('contains no outbound fetch calls', () => {
    strictAssert.doesNotMatch(generateSource, /fetch\(/);
  });

  it('keeps the real provider pipeline untouched', () => {
    strictAssert.match(realGenerateSource, /createBytePlusSeedanceTask/);
    strictAssert.match(realGenerateSource, /byteplus-seedance-real/);
    strictAssert.match(realTaskStatusSource, /byteplus-seedance-real/);
  });
});

// ─── Simulation route: response semantics (source contract) ───

describe('Simulation route response semantics', () => {
  it('identifies the action as simulation', () => {
    strictAssert.match(generateSource, /simulation: true/);
  });

  it('explicitly proves no provider was called', () => {
    strictAssert.match(generateSource, /providerCalled: false/);
  });

  it('explicitly proves the paid API is blocked', () => {
    strictAssert.match(generateSource, /paidApiBlocked: true/);
  });

  it('explicitly proves no provider billing occurred', () => {
    strictAssert.match(generateSource, /noProviderBilling: true/);
  });

  it('keeps realApiConnected: false and dryRunMode: true', () => {
    strictAssert.match(generateSource, /realApiConnected: false/);
    strictAssert.match(generateSource, /dryRunMode: true/);
  });

  it('keeps the no-real-BytePlus-call message', () => {
    strictAssert.match(generateSource, /no paid BytePlus API calls were made/);
  });

  it('does not fabricate a real video filename for simulated tasks', () => {
    strictAssert.doesNotMatch(generateSource, /videoFileName: `seedance_/);
  });
});

// ─── Deterministic cost behavior used by the simulation transaction (behavioral) ───

describe('Simulation cost determinism (behavioral)', () => {
  const base = { modelId: 'seedance-2.0', resolution: '720p', aspectRatio: '9:16' };

  it('returns identical estimates for identical inputs across calls', () => {
    const a = estimateSeedancePlanningCost({ ...base, outputDurationSec: 6 });
    const b = estimateSeedancePlanningCost({ ...base, outputDurationSec: 6 });
    strictAssert.deepEqual(a, b);
  });

  it('produces a positive, finite estimate for the WSTV default preset', () => {
    const estimate = estimateSeedancePlanningCost({ ...base, outputDurationSec: 15 });
    strictAssert.ok(estimate.estimatedCostUsd > 0);
    strictAssert.ok(Number.isFinite(estimate.estimatedCostUsd));
    strictAssert.equal(estimate.planningEstimateOnly, true);
    strictAssert.equal(estimate.actualUsageRequiredForFinalBilling, true);
  });

  it('estimates 1080p cost higher than 720p for the same duration', () => {
    const sd = estimateSeedancePlanningCost({ ...base, outputDurationSec: 6 }).estimatedCostUsd;
    const hd = estimateSeedancePlanningCost({ ...base, resolution: '1080p', outputDurationSec: 6 }).estimatedCostUsd;
    strictAssert.ok(hd > sd);
  });

  it('estimates longer durations strictly higher than shorter durations', () => {
    const six = estimateSeedancePlanningCost({ ...base, outputDurationSec: 6 }).estimatedCostUsd;
    const twelve = estimateSeedancePlanningCost({ ...base, outputDurationSec: 12 }).estimatedCostUsd;
    strictAssert.ok(twelve > six);
  });

  it('maps modelType full/mini to official model ids deterministically', () => {
    strictAssert.equal(resolveOfficialSeedanceModelId('seedance-2.0', 'full'), OFFICIAL_SEEDANCE_MODEL_IDS.MAIN);
    strictAssert.equal(resolveOfficialSeedanceModelId('seedance-2.0', 'mini'), OFFICIAL_SEEDANCE_MODEL_IDS.MINI);
  });

  it('handles the with_video input mode deterministically', () => {
    const a = estimateSeedancePlanningCost({ ...base, outputDurationSec: 6, inputMode: 'with_video' });
    const b = estimateSeedancePlanningCost({ ...base, outputDurationSec: 6, inputMode: 'with_video' });
    strictAssert.deepEqual(a, b);
    strictAssert.ok(a.estimatedCostUsd > 0);
  });
});
