import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const dashboardSource = () => source('../components/dashboard/phase1/phase1-dashboard.tsx');
const pageSource = () => source('../app/phase1/page.tsx');

describe('ASTV professional dashboard Phase 1', () => {
  it('keeps the implementation behind a separate preview route', () => {
    strictAssert.ok(pageSource().includes("@/components/dashboard/phase1/phase1-dashboard"));
    strictAssert.ok(dashboardSource().includes('Open current workspace'));
    strictAssert.ok(dashboardSource().includes('Existing Generate, Image, Cost, Calendar, Post-Production and Settings workflows remain unchanged.'));
  });

  it('renders an always-visible server-owned Safe Mode status without a toggle', () => {
    strictAssert.ok(dashboardSource().includes('Safe Mode'));
    strictAssert.ok(dashboardSource().includes('Server-owned status'));
    strictAssert.ok(dashboardSource().includes('paid calls blocked'));
    strictAssert.ok(!dashboardSource().includes('onCheckedChange'));
    strictAssert.ok(!dashboardSource().includes("fetch('/api/settings'"));
  });

  it('labels Overview metrics by provenance', () => {
    strictAssert.ok(dashboardSource().includes('provenance="Recorded"'));
    strictAssert.ok(dashboardSource().includes('provenance="Estimate"'));
    strictAssert.ok(dashboardSource().includes('Sum of stored task estimates'));
  });

  it('provides responsive and keyboard navigation semantics', () => {
    strictAssert.ok(dashboardSource().includes('aria-expanded={mobileOpen}'));
    strictAssert.ok(dashboardSource().includes("event.key === 'Escape'"));
    strictAssert.ok(dashboardSource().includes('Skip to content'));
    strictAssert.ok(dashboardSource().includes('role="region"'));
    strictAssert.ok(dashboardSource().includes('caption className="sr-only"'));
  });

  it('does not introduce provider calls, paid actions, or browser storage', () => {
    const forbidden = ['XMLHttpRequest', 'WebSocket', 'sendBeacon', 'localStorage', 'sessionStorage', 'ALLOW_PAID_CALLS=true'];
    for (const text of forbidden) {
      strictAssert.ok(!dashboardSource().includes(text), `Phase 1 dashboard must not contain ${text}`);
    }
  });
});
