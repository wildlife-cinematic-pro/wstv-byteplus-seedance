/**
 * Patch existing UsageRecord rows so their generatedAt + createdAt reflect
 * the actual generation date (2026-06-16), not the seed-run date (2026-06-25).
 *
 * This script is IDEMPOTENT — safe to run multiple times. It only updates
 * the 2 known WSTV Wildlife Reel records identified by their stable IDs
 * ('usage-existing-001' and 'usage-existing-002'). If those rows don't exist
 * (e.g. the seed hasn't been run yet), the script creates them with the
 * correct dates.
 *
 * Run with: node scripts/patch-usage-dates.js
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Patching WSTV Wildlife Reel usage record dates to 2026-06-16...');

  // Record 1: Tiger Hunt Sequence — generated 2026-06-16 10:30 UTC
  const r1 = await prisma.usageRecord.upsert({
    where: { id: 'usage-existing-001' },
    update: {
      generatedAt: new Date('2026-06-16T10:30:00.000Z'),
      createdAt:   new Date('2026-06-16T10:30:00.000Z'),
    },
    create: {
      id: 'usage-existing-001',
      purchaseId: null,
      projectTitle: 'WSTV Wildlife Reel #1',
      animalStoryName: 'Tiger Hunt Sequence',
      pricingModelId: null,
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
      actualTokens: 324000,
      actualCostUsd: 2.268,
      status: 'generated-manually',
      notes: 'First WSTV test video — generated externally and recorded manually',
      generatedAt: new Date('2026-06-16T10:30:00.000Z'),
      createdAt:   new Date('2026-06-16T10:30:00.000Z'),
    },
  });
  console.log('  ✓ usage-existing-001:', r1.projectTitle, '→', new Date(r1.generatedAt).toISOString().split('T')[0]);

  // Record 2: Eagle Flight Sequence — generated 2026-06-16 14:20 UTC
  const r2 = await prisma.usageRecord.upsert({
    where: { id: 'usage-existing-002' },
    update: {
      generatedAt: new Date('2026-06-16T14:20:00.000Z'),
      createdAt:   new Date('2026-06-16T14:20:00.000Z'),
    },
    create: {
      id: 'usage-existing-002',
      purchaseId: null,
      projectTitle: 'WSTV Wildlife Reel #2',
      animalStoryName: 'Eagle Flight Sequence',
      pricingModelId: null,
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
      actualTokens: 324000,
      actualCostUsd: 2.268,
      status: 'generated-manually',
      notes: 'Second WSTV test video — generated externally and recorded manually',
      generatedAt: new Date('2026-06-16T14:20:00.000Z'),
      createdAt:   new Date('2026-06-16T14:20:00.000Z'),
    },
  });
  console.log('  ✓ usage-existing-002:', r2.projectTitle, '→', new Date(r2.generatedAt).toISOString().split('T')[0]);

  console.log('\n✅ Patch complete. Both records now show 2026-06-16.');
}

main()
  .catch((e) => { console.error('Patch failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
