import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const pageSource = () => source('../app/phase3/page.tsx');
const dashboardSource = () => source('../components/dashboard/phase3/phase3-history-dashboard.tsx');
const phase1Source = () => source('../components/dashboard/phase1/phase1-dashboard.tsx');
const historyApiSource = () => source('../app/api/history/route.ts');

describe('ASTV professional dashboard Phase 3 History', () => {
  it('exposes a /phase3 route that renders the Phase 3 history dashboard', () => {
    strictAssert.ok(pageSource().includes('@/components/dashboard/phase3/phase3-history-dashboard'));
    strictAssert.ok(pageSource().includes('Phase3HistoryDashboard'));
    strictAssert.ok(pageSource().includes('export const dynamic = \'force-dynamic\''));
  });

  it('points the Phase 1 History navigation item to /phase3', () => {
    strictAssert.ok(phase1Source().includes("{ label: 'History', icon: FolderClock, href: '/phase3' }"));
    strictAssert.ok(!phase1Source().includes("{ label: 'History', icon: FolderClock, phase: 'Phase 3' }"));
  });

  it('keeps Phase 3 strictly read-only with no mutation verbs', () => {
    strictAssert.ok(!dashboardSource().includes("method: 'POST'"));
    strictAssert.ok(!dashboardSource().includes("method: 'PUT'"));
    strictAssert.ok(!dashboardSource().includes("method: 'PATCH'"));
    strictAssert.ok(!dashboardSource().includes("method: 'DELETE'"));
  });

  it('does not consume generate or provider mutation endpoints', () => {
    strictAssert.ok(!dashboardSource().includes('/api/generate'));
    strictAssert.ok(!dashboardSource().includes('/api/real-generate'));
    strictAssert.ok(!dashboardSource().includes('/api/dry-run'));
  });

  it('exposes no retry, delete, or provider action controls', () => {
    strictAssert.ok(!dashboardSource().includes('Retry'));
    strictAssert.ok(!dashboardSource().includes('Delete'));
    strictAssert.ok(!dashboardSource().includes('Rerun'));
    strictAssert.ok(!dashboardSource().includes('Provider button'));
  });

  it('does not select or render the full private prompt', () => {
    strictAssert.ok(!pageSource().includes('prompt:'));
    strictAssert.ok(!pageSource().includes('prompt'));
    strictAssert.ok(!dashboardSource().includes('task.prompt'));
    strictAssert.ok(!dashboardSource().includes('dryRunResult'));
  });

  it('does not select or render dangerous URL / provider-result fields', () => {
    for (const field of ['providerResultVideoUrl', 'providerLastFrameUrl', 'videoUrl', 'videoUrl1', 'masterImageUrl', 'signedUrl', 'dryRunResult']) {
      strictAssert.ok(!pageSource().includes(field), `page must not select ${field}`);
      strictAssert.ok(!dashboardSource().includes(field), `dashboard must not render ${field}`);
    }
  });

  it('provides a sanitized JSON export', () => {
    strictAssert.ok(dashboardSource().includes('Export sanitized JSON'));
    strictAssert.ok(dashboardSource().includes('astv-history-sanitized.json'));
    strictAssert.ok(dashboardSource().includes('createObjectURL'));
  });

  it('shows Safe Mode as a server-owned read-only status without a browser toggle', () => {
    strictAssert.ok(dashboardSource().includes('Safe Mode'));
    strictAssert.ok(dashboardSource().includes('READ ONLY'));
    strictAssert.ok(dashboardSource().includes('no provider actions'));
    strictAssert.ok(!dashboardSource().includes('onCheckedChange'));
    strictAssert.ok(!dashboardSource().includes('toggle'));
  });

  it('provides the required filter, search, and sort UI', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes('id="phase3-search"'));
    strictAssert.ok(src.includes('type="search"'));
    strictAssert.ok(src.includes('Filter tasks'));
    strictAssert.ok(src.includes('Dry Run'));
    strictAssert.ok(src.includes('Succeeded'));
    strictAssert.ok(src.includes('Failed'));
    strictAssert.ok(src.includes('id="phase3-sort"'));
    strictAssert.ok(src.includes('Newest first'));
    strictAssert.ok(src.includes('Highest estimated cost'));
  });

  it('exposes only privacy-safe task metadata fields', () => {
    const src = dashboardSource();
    for (const field of ['modelType', 'resolution', 'duration', 'dryRunPassed', 'safetyPassed', 'costEstimate', 'costActual', 'actualTokens', 'actualBillingStatus', 'createdAt', 'aspectRatio', 'pollCount', 'lastCheckedAt']) {
      strictAssert.ok(src.includes(field), `expected privacy-safe field ${field}`);
    }
  });

  it('does not weaken the existing /api/history privacy behavior', () => {
    strictAssert.ok(historyApiSource().includes("prompt: 'Private task'"));
    strictAssert.ok(!historyApiSource().includes('prompt: true'));
  });
});
