import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const pageSource = () => source('../app/phase2/page.tsx');
const dashboardSource = () => source('../components/dashboard/phase2/phase2-generate-dashboard.tsx');

const combined = () => `${pageSource()}\n${dashboardSource()}`;

describe('ASTV professional dashboard Phase 2', () => {
  it('keeps Phase 2 behind an isolated route and preserves Phase 1 rollback', () => {
    strictAssert.ok(pageSource().includes('Phase2GenerateDashboard'));
    strictAssert.ok(dashboardSource().includes('href="/phase1"'));
    strictAssert.ok(dashboardSource().includes('Existing Generate'));
    strictAssert.ok(dashboardSource().includes('href="/"'));
  });

  it('reuses the existing typed prompt and reference workflow', () => {
    strictAssert.ok(dashboardSource().includes('StepPrompt'));
    strictAssert.ok(dashboardSource().includes('StepReferences'));
    strictAssert.ok(dashboardSource().includes('groupReferencesByType'));
    strictAssert.ok(dashboardSource().includes('remapReferenceRolesForMode'));
    strictAssert.ok(dashboardSource().includes("type GenerationMode"));
    strictAssert.ok(dashboardSource().includes("type ReferenceEntry"));
  });

  it('shows the approved Seedance reference capacities', () => {
    strictAssert.ok(dashboardSource().includes('/9 image'));
    strictAssert.ok(dashboardSource().includes('/3 video'));
    strictAssert.ok(dashboardSource().includes('/3 audio'));
  });

  it('only calls the authenticated dry-run API from the new workspace', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes("fetch('/api/dry-run'"));
    strictAssert.ok(!src.includes("fetch('/api/generate'"));
    strictAssert.ok(!src.includes('ALLOW_PAID_CALLS=true'));
    strictAssert.ok(!src.includes('ENABLE_REAL_API=true'));
  });

  it('keeps the safety and truthfulness labels visible', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes('Safe Mode'));
    strictAssert.ok(src.includes('DRY RUN'));
    strictAssert.ok(src.includes('paid calls blocked'));
    strictAssert.ok(src.includes('Provider button'));
    strictAssert.ok(src.includes('Not rendered'));
    strictAssert.ok(src.includes('Estimate only'));
  });

  it('does not introduce browser persistence or credentials into Phase 2 source', () => {
    const src = combined();
    for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB', 'NEXT_PUBLIC_', 'API_KEY', 'SECRET_KEY']) {
      strictAssert.equal(src.includes(forbidden), false, `unexpected Phase 2 pattern: ${forbidden}`);
    }
  });
});
