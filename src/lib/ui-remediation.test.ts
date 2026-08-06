import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Narrow source-scan regression tests for the approved ASTV production UI QA
 * remediation (fix/astv-production-ui-qa-remediation). These tests read source
 * files only — they never read environment values, secrets, cookies, or
 * credentials, and they never make network or database calls.
 */

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const clientSource = () => source('../components/dashboard/client.tsx');
const layoutSource = () => source('../app/layout.tsx');
const loginSource = () => source('../app/login/page.tsx');
const costDashboardSource = () => source('../components/dashboard/cost-dashboard.tsx');
const calendarSource = () => source('../components/dashboard/calendar-learning.tsx');
const stepOutputSource = () => source('../components/dashboard/step-output.tsx');
const payloadPreviewSource = () => source('../components/dashboard/seedance-payload-preview.tsx');
const quickstartSource = () => source('../components/dashboard/official-quickstart-reference.tsx');
const sidebarSource = () => source('../components/dashboard/sidebar.tsx');
const referencesSource = () => source('../components/dashboard/step-references.tsx');
const promptSource = () => source('../components/dashboard/step-prompt.tsx');
const costSettingsSource = () => source('../components/dashboard/cost-settings.tsx');
const resourcePackSource = () => source('../components/dashboard/resource-pack-billing.tsx');
const safetyStripSource = () => source('../components/dashboard/generate-safety-strip.tsx');
const pricingSource = () => source('./pricing.ts');
const seedancePricingSource = () => source('./seedance-pricing.ts');
const seedanceValidationSource = () => source('./seedance-validation.ts');
const localRequestSource = () => source('./security/local-request.ts');
const schemaSource = () => source('../../prisma/schema.prisma');

describe('ASTV production UI QA remediation', () => {
  it('requires ASTV public branding strings in the remediated public surfaces', () => {
    strictAssert.ok(clientSource().includes('>ASTV<'), 'header brand must render ASTV');
    strictAssert.ok(clientSource().includes('Animal Stories TV'), 'header subtitle must say Animal Stories TV');
    strictAssert.ok(clientSource().includes('ASTV Production Center'), 'footer must say ASTV Production Center');
    strictAssert.ok(layoutSource().includes('ASTV Production Center — Animal Stories TV'), 'page metadata title must be ASTV');
    strictAssert.ok(loginSource().includes('ASTV sign in'), 'login page must say ASTV sign in');
  });

  it('removes prohibited public WSTV strings from the specifically remediated files', () => {
    const prohibited: Array<[string, string[]]> = [
      [clientSource(), ['>WSTV<', 'WSTV Production Center', 'Actual Console Usage', 'local SQLite DB']],
      [layoutSource(), ['WSTV Seedance Dashboard']],
      [loginSource(), ['WSTV sign in']],
      // "WSTV Active Pack" must be gone only as a rendered public label; the
      // internal comment `{/* WSTV Active Pack card */}` is preserved by design.
      [resourcePackSource(), ['>WSTV Active Pack<']],
      [safetyStripSource(), ['WSTV Standard pack']],
      [costDashboardSource(), ['WSTV Presets', 'WSTV Wildlife Reel #3']],
      [calendarSource(), ['WSTV Project Summary']],
      [stepOutputSource(), ['WSTV default']],
      [payloadPreviewSource(), ['WSTV default shape']],
      [quickstartSource(), ['WSTV Defaults (confirmed)', 'normal WSTV testing', 'while WSTV is in Safe Mode']],
      [sidebarSource(), ['wstv-tasks.json']],
    ];
    for (const [fileSource, strings] of prohibited) {
      for (const text of strings) {
        strictAssert.ok(!fileSource.includes(text), `prohibited public string "${text}" must be absent`);
      }
    }
  });

  it('keeps internal compatibility WSTV identifiers intact (no global rejection)', () => {
    strictAssert.ok(pricingSource().includes('WSTV_PRESETS'), 'WSTV_PRESETS must remain a compatibility symbol');
    strictAssert.ok(seedanceValidationSource().includes('WSTV_ACTIVE_PACK'), 'WSTV_ACTIVE_PACK must remain a compatibility symbol');
    strictAssert.ok(seedancePricingSource().includes('WSTV_DEFAULT_PLANNING_PRESET'), 'WSTV_DEFAULT_PLANNING_PRESET must remain a compatibility symbol');
    strictAssert.ok(localRequestSource().includes('WSTV_OUTPUT_ROOT'), 'WSTV_OUTPUT_ROOT env var must be preserved');
    strictAssert.ok(localRequestSource().includes('WSTV_COLLECTION_ROOT'), 'WSTV_COLLECTION_ROOT env var must be preserved');
    strictAssert.ok(schemaSource().includes('model WSTVPreset'), 'Prisma WSTVPreset model must be preserved');
    strictAssert.ok(clientSource().includes("'wstv-theme'"), 'wstv-theme localStorage key must be preserved');
    strictAssert.ok(clientSource().includes("'wstv_paid_unlocked'"), 'wstv_paid_unlocked localStorage key must be preserved');
  });

  it('replaces stale public SQLite Calendar wording with database-neutral wording', () => {
    strictAssert.ok(!clientSource().includes('local SQLite DB'), 'public Calendar wording must not mention SQLite');
    strictAssert.ok(
      clientSource().includes('App planning database — no Google Calendar connection.'),
      'neutral Calendar wording must be present'
    );
  });

  it('marks the usage snapshot as a manual static snapshot, not live provider data', () => {
    strictAssert.ok(seedancePricingSource().includes('MANUAL_PLAN_SNAPSHOT'), 'MANUAL_PLAN_SNAPSHOT must be exported');
    strictAssert.ok(seedancePricingSource().includes('NOT live provider synchronization'), 'comment must clarify provenance');
    strictAssert.ok(!clientSource().includes('ACTUAL_CONSOLE_USAGE'), 'ACTUAL_CONSOLE_USAGE must no longer be consumed');
    strictAssert.ok(
      clientSource().includes('Manual Plan Snapshot — not live provider data'),
      'public usage label must state manual provenance'
    );
  });

  it('adds accessible names and associations for the audited controls', () => {
    strictAssert.ok(clientSource().includes('aria-label="Toggle task history panel"'));
    strictAssert.ok(costDashboardSource().includes('aria-label="Save plan expiry"'));
    strictAssert.ok(calendarSource().includes('aria-label="Previous month"'));
    strictAssert.ok(calendarSource().includes('aria-label="Next month"'));
    strictAssert.ok(calendarSource().includes('aria-label={`Rate ${star} out of 5`}'));
    strictAssert.ok(referencesSource().includes('aria-label="Clear reference URL"'));
    strictAssert.ok(promptSource().includes('id="prompt-textarea"'));
    strictAssert.ok(promptSource().includes('htmlFor="prompt-textarea"'));
    strictAssert.ok(sidebarSource().includes('aria-label="Search task history"'));
    strictAssert.ok(costSettingsSource().includes('htmlFor="plan-provider"'));
    strictAssert.ok(costSettingsSource().includes('htmlFor="plan-status"'));
    strictAssert.ok(calendarSource().includes('htmlFor="calendar-entry-title"'));
    strictAssert.ok(calendarSource().includes('htmlFor="calendar-entry-status"'));
    strictAssert.ok(calendarSource().includes('aria-label="Viral learning category"'));
  });
});
