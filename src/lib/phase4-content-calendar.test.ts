import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const pageSource = () => source('../app/phase4/page.tsx');
const dashboardSource = () => source('../components/dashboard/phase4/phase4-content-calendar.tsx');
const phase1Source = () => source('../components/dashboard/phase1/phase1-dashboard.tsx');
const calendarApiSource = () => source('../app/api/content-calendar/route.ts');
const calendarIdApiSource = () => source('../app/api/content-calendar/[id]/route.ts');

const STATUS_LIFECYCLE = [
  'idea',
  'master_image',
  'storyboard',
  'prompted',
  'generated',
  'capcut_edit',
  'scheduled',
  'posted',
  'reviewed',
];

describe('ASTV professional dashboard Phase 4 Content Calendar', () => {
  it('exposes a /phase4 route that renders the Phase 4 content calendar dashboard', () => {
    strictAssert.ok(pageSource().includes('@/components/dashboard/phase4/phase4-content-calendar'));
    strictAssert.ok(pageSource().includes('Phase4ContentCalendar'));
    strictAssert.ok(pageSource().includes('export const dynamic = \'force-dynamic\''));
  });

  it('points the Phase 1 Content Calendar navigation item to /phase4', () => {
    strictAssert.ok(phase1Source().includes("{ label: 'Content Calendar', icon: CalendarDays, href: '/phase4' }"));
    strictAssert.ok(!phase1Source().includes("{ label: 'Content Calendar', icon: CalendarDays, href: '/' }"));
  });

  it('uses exactly the existing persisted status lifecycle', () => {
    const src = dashboardSource();
    for (const status of STATUS_LIFECYCLE) {
      strictAssert.ok(src.includes(`'${status}'`), `expected status ${status}`);
    }
    strictAssert.ok(calendarApiSource().includes("status = 'idea'"));
  });

  it('loads the current month from GET /api/content-calendar with a month query', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes('/api/content-calendar?month='));
    strictAssert.ok(src.includes('fetch(`/api/content-calendar?month='));
  });

  it('creates entries via POST /api/content-calendar', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes("method: 'POST'"));
    strictAssert.ok(src.includes("'/api/content-calendar'"));
  });

  it('updates entries via PUT /api/content-calendar/[id]', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes("method: 'PUT'"));
    strictAssert.ok(src.includes('`/api/content-calendar/${editingId}`'));
  });

  it('deletes entries via DELETE /api/content-calendar/[id]', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes("method: 'DELETE'"));
    strictAssert.ok(src.includes('`/api/content-calendar/${deleteId}`'));
  });

  it('requires an explicit confirmation state before the DELETE request is sent', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes('deleteId'));
    strictAssert.ok(src.includes('Delete this calendar entry?'));
    strictAssert.ok(src.includes('Confirm delete'));
    strictAssert.ok(src.includes('Cancel'));
  });

  it('does not call /api/generate', () => {
    strictAssert.ok(!dashboardSource().includes('/api/generate'));
  });

  it('does not call /api/real-generate', () => {
    strictAssert.ok(!dashboardSource().includes('/api/real-generate'));
    strictAssert.ok(!dashboardSource().includes('/api/dry-run'));
  });

  it('exposes no provider execution UI or generation controls', () => {
    const src = dashboardSource();
    strictAssert.ok(!src.includes('Generate now'));
    strictAssert.ok(!src.includes('Retry generation'));
    strictAssert.ok(!src.includes('Provider button'));
    strictAssert.ok(!src.includes('/api/real-generate'));
  });

  it('shows a server-owned Safe Mode badge without a browser toggle', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes('Safe Mode'));
    strictAssert.ok(src.includes('PLANNING ONLY'));
    strictAssert.ok(src.includes('no provider actions'));
    strictAssert.ok(!src.includes('onCheckedChange'));
    strictAssert.ok(!src.includes('type="checkbox"'));
  });

  it('preserves multiple entries per day instead of overwriting them', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes('new Map<string, ContentCalendarEntry[]>()'));
    strictAssert.ok(src.includes('map.get(key) ?? []'));
    strictAssert.ok(src.includes('arr.push(entry)'));
  });

  it('handles loading, empty, and generic failure states without leaking errors', () => {
    const src = dashboardSource();
    strictAssert.ok(src.includes('Unable to load calendar'));
    strictAssert.ok(src.includes('Please try again'));
    strictAssert.ok(!src.includes('stack'));
    strictAssert.ok(!src.includes('DATABASE_URL'));
  });

  it('does not introduce direct client-side Prisma/DB access', () => {
    const src = dashboardSource();
    strictAssert.ok(!src.includes('from \'@/lib/db\''));
    strictAssert.ok(!src.includes('prisma'));
    strictAssert.ok(!src.includes('db.contentCalendar'));
  });
});
