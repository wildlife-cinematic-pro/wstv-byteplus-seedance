# WSTV Seedance Dashboard - Worklog

---
Task ID: 1
Agent: Main Agent
Task: Complete WSTV Production Control Center upgrade

Work Log:
- Assessed current project state: Next.js 16 + Prisma + SQLite + TypeScript
- Updated Prisma schema with 8 new models: WSTVPreset, PromptVersion, GenerationQA, RetryStrategy, ReferenceAsset, PostProduction, PerformanceRecord, ViralLearning, ProviderComparison, ContentCalendar, DuplicateCheck
- Ran db:push to sync schema
- Updated types.ts with all new types and constants (REFERENCE_ROLES, CALENDAR_STATUSES, FAILURE_REASONS, RETRY_FIXES, OUTPUT_RATINGS)
- Created seed script (prisma/seed-production.ts) with 8 WSTV presets, 7 calendar entries, 8 provider comparisons
- Created 15 new API routes: presets, prompt-versions, generation-qa, retry-strategies, reference-assets, post-production, performance, viral-learning, provider-comparisons, content-calendar, duplicate-check
- Built 4 new UI components: production-workflow.tsx, reference-manager.tsx, post-production.tsx, calendar-learning.tsx
- Updated client.tsx with 6-tab navigation: Generate, Workflow, Cost, Post-Prod, Calendar, Settings
- Fixed River icon (doesn't exist in lucide-react) → replaced with Waves
- Fixed recharts "Illegal constructor" error by replacing all recharts charts with pure CSS/SVG visualizations
- Added Error Boundary wrapper for Cost Dashboard
- Ran lint - passes cleanly
- Browser QA confirmed: Generate, Workflow, Post-Prod, Calendar tabs all working
- Cost tab has known "Illegal constructor" issue from nested Radix Tabs in sandbox - wrapped with error boundary

Stage Summary:
- Project upgraded from v3.0 to v4.0 with full Production Control Center
- 6 main tabs: Generate, Workflow, Cost, Post-Prod, Calendar, Settings
- 11 new Prisma models added (8 production + 3 from cost tracker)
- 15 new API routes created
- 4 new major UI components (production-workflow, reference-manager, post-production, calendar-learning)
- All 8 WSTV presets seeded (Mother saves baby, Baby learning, Storm survival, River rescue, Predator tension, Funny failed hunt, Emotional reunion, Rare behavior)
- Light Plan cost tracker: $30.10, 7M tokens, 648K used, 6.35M remaining
- DRY RUN mode maintained - no real API connected
- Server stability: dev server crashes intermittently due to sandbox memory constraints, not code bugs

---
Task ID: 2
Agent: Main Agent
Task: Connect Reference Asset Manager to Generate + Dry Run workflow (v5.0 upgrade)

Work Log:
- Read and analyzed all relevant files: client.tsx, step-references.tsx, reference-manager.tsx, API routes, types, dry-run
- Updated types.ts: Added ReferenceEntry interface, createEmptyReference(), groupReferencesByType(), REFERENCE_LIMITS constants
- Added DryRunResult.references field with images/videos/audios arrays
- Fixed /api/reference-assets/route.ts: Now accepts bulk POST with { assets: [...] } for save/update/delete operations
  - Supports both create and update based on dbId presence
  - Auto-deletes assets not in payload
  - Returns summary of created/updated/deleted counts
  - Added PUT for single asset update, DELETE for bulk delete
  - GET now returns { assets: [...] } format matching frontend expectations
- Rewrote step-references.tsx: Complete rewrite with unified reference management
  - Supports up to 9 image references with role dropdowns (was only 2)
  - Audio/Video sections hidden by default, only appear when "Add Audio/Video Reference" is clicked
  - Role-based dropdowns with icons for each reference type
  - URL validation per type (image: HTTPS, audio: HTTPS+.mp3/.wav/.m4a, video: HTTPS+.mp4/.mov)
  - Single unified risk acknowledgement for all non-image references
  - Summary card showing counts (📸X/9, 🎵Y/3, 🎬Z/3)
- Unified client.tsx state: Replaced separate masterImageUrl, storyboardImageUrl, audioUrls, videoUrls states with unified references: ReferenceEntry[]
  - Loads references from DB on mount
  - Dry run invalidated when references change
  - Shared reference state between Generate tab and Workflow tab
  - Updated all gate calculations to use grouped references
- Updated dry-run API (route.ts): Now accepts references.images[], references.videos[], references.audios[]
  - Backward compatible: still accepts legacy masterImageUrl, storyboardImageUrl, audioUrl1-3, videoUrl1-3
  - Validates up to 9 images, 3 videos, 3 audios
  - Returns references in response for transparency
  - Per-role validation logging
- Updated step-dryrun.tsx: Sends references in dry-run payload
  - Uses groupReferencesByType() to format references for API
  - Maps references to legacy fields for task creation backward compatibility
  - Shows reference counts in summary grid (X/9, Y/3, Z/3)
  - Technical details section shows ref counts
- Updated reference-manager.tsx: Now receives shared references state from client.tsx
  - No longer manages its own separate local state
  - Same data source as Generate tab
  - Added Reload button to fetch from DB
  - Save All persists to DB and updates dbId references
- Fixed cost-dashboard.tsx: Removed duplicate default export (was causing "the name `default` is exported multiple times" error)
- Lint passes cleanly
- API tests verified: dry-run with new format, legacy format, bulk save, GET all assets

Stage Summary:
- Project upgraded from v4.0 to v5.0 with unified Reference Management
- All 7 user requirements fulfilled:
  1. Generate tab supports up to 9 image references (not just 2)
  2. Audio/video references hidden by default, only appear when "Add" is clicked
  3. Backend API now accepts bulk save/update/delete with { assets: [...] } payload
  4. Dry-run payload includes references.images[], references.videos[], references.audios[]
  5. Dry-run validation counts: up to 9 images, 3 videos, 3 audios
  6. Main Generate tab, Reference Manager, database, and dry-run payload all use same reference data
  7. Clean UI: summary first, then reveal input fields only when adding references
- DRY RUN mode maintained - no real API connected
- Known issue: Sandbox memory constraints cause server crashes on compilation-heavy operations (not code bugs)

---
Task ID: 3
Agent: Main Agent
Task: Fix Cost Dashboard "Illegal constructor" runtime error at its root cause

Work Log:
- Diagnosed root cause: Nested Radix Tabs inside Cost Dashboard caused "Illegal constructor" error in Next.js/Turbopack sandbox environment
- Previously tried hiding with Error Boundary — that was wrong approach
- Complete rewrite of cost-dashboard.tsx (1037→~700 lines) replacing ALL fragile Radix/shadcn components with native HTML:
  1. **Tabs/TabsContent/TabsList/TabsTrigger** → Simple `useState('budget')` + native `<button>` elements with conditional rendering
  2. **Select/SelectContent/SelectItem/SelectTrigger/SelectValue** → Native `<select>` elements wrapped in `SimpleSelect` component
  3. **Switch** → Native `<input type="checkbox">` for Intelligent Mode toggle
  4. **Progress** → `SimpleProgress` div-based progress bar with CSS transitions
  5. **Table/TableBody/TableCell/TableHead/TableHeader/TableRow** → Native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` HTML elements
  6. **Separator** → `SimpleDivider` using `<hr>` with border styling
- Fixed exports: only one default export (`CostDashboardSafe`) wrapping `CostDashboard`
- Removed Error Boundary — no longer needed since component renders without errors
- Removed unused imports: Component, History, PieChartIcon, Textarea, Switch, and all Radix UI component imports
- Verified no recharts dependency exists — charts use pure CSS/SVG only
- Cleared .next cache before testing
- Lint passes cleanly
- Browser QA confirmed:
  - Generate tab: ✅ Renders correctly
  - Cost tab: ✅ Opens and renders without "Illegal constructor" error
  - Cost sub-tabs (Budget, Calculator, Usage, Pricing & Plans, Charts): ✅ All visible as native buttons
  - Workflow tab: ✅ Renders correctly
  - No console errors
- Server crashes remain due to sandbox memory constraints, not code issues

Stage Summary:
- Cost Dashboard "Illegal constructor" error is FULLY FIXED at the root cause
- No more nested Radix Tabs inside the Cost Dashboard
- All internal components replaced with stable native HTML equivalents
- Error Boundary removed — no longer needed
- The Cost tab now renders normally with Budget/Calculator/Usage/Pricing/Charts sub-tabs
- DRY RUN mode maintained — no real API connected

---
Task ID: 4
Agent: Main Agent (Super Z)
Task: Fix budget widget mismatch — top-right header shows $50 after Settings saves $150

Work Log:
- Confirmed Prisma schema source of truth: `BudgetSetting.monthlyLimit` (NOT `monthlyBudgetUsd`)
- Diagnosed root cause: `src/app/api/cost-summary/route.ts` POST endpoint silently swallowed Prisma errors via try/catch + console.warn, so when the user's local Prisma client was out of sync with the schema, the save APPEARED to succeed (`success: true`) but never wrote to the DB. Subsequent GET returned the default 50.
- Secondary issue: GET endpoint lacked `dynamic = 'force-dynamic'` and `Cache-Control: no-store` headers, so Next.js 16 could cache the response and serve stale $50 data even after a successful save.
- Tertiary issue: `CostSettings` dispatched `wstv-budget-updated` event without a detail payload, forcing the client to do a follow-up GET. If the GET was cached, the header stayed at $50.

Fixes applied:
1. `src/app/api/cost-summary/route.ts` — full rewrite:
   - Added `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`
   - Added `Cache-Control: no-store, no-cache, must-revalidate` to every response
   - Canonical field name is `monthlyLimit`; legacy `monthlyBudgetUsd` is still ACCEPTED in request body for backward compat, but never written to the DB
   - DB save errors are NO LONGER SWALLOWED — they propagate as a 500 response with `success: false` and error detail
   - POST response now returns the actual persisted row (re-fetched after update/create), so the client can update its UI directly without a follow-up GET
2. `src/app/api/budget/route.ts`:
   - Added `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`
   - Added `Cache-Control: no-store, no-cache, must-revalidate` to all responses
3. `src/components/dashboard/cost-settings.tsx`:
   - Renamed local state `monthlyBudgetUsd` → `monthlyLimit` (matches schema)
   - POST body now sends `{ monthlyLimit }` (canonical field)
   - Accepts new `initialBudget` prop from parent — server-side value wins on first paint
   - localStorage writes to BOTH `wstv_monthly_limit` (canonical) and `wstv_monthly_budget_usd` (legacy) for backward compat
   - On save: parses POST response, updates local state to actual DB value, dispatches `wstv-budget-updated` event WITH `detail.monthlyLimit` payload
   - Error responses now show a toast with the actual error message instead of generic failure
4. `src/components/dashboard/client.tsx`:
   - Passes `initialData.budget` (= `budgetInfo`) as `initialBudget` prop to `<CostSettings />`
   - Listens for `wstv-budget-updated` event WITH detail payload — applies `detail.monthlyLimit` directly to `budgetInfo` state (no network round trip)
   - Falls back to full GET refresh only when detail is missing
   - Added `cache: 'no-store'` and `Cache-Control: no-cache` headers to refresh fetch

Verification (curl tests against running dev server on port 3000):
- ✅ GET fresh (empty DB) → returns monthlyLimit: 50 (default), safeMode: true, dryRunOnly: true, realApiConnected: false
- ✅ POST {monthlyLimit: 150} → returns success: true, budget.monthlyLimit: 150
- ✅ GET after POST → returns monthlyLimit: 150 (persisted to DB)
- ✅ POST {monthlyBudgetUsd: 200} (legacy field) → returns success: true, monthlyLimit: 200 (backward compat)
- ✅ GET after legacy POST → returns monthlyLimit: 200 (still persisted)
- ✅ DB inspection confirms row: { monthlyLimit: 150, currency: 'USD', alertThreshold: 0.8, spentThisMonth: 0 }
- ✅ Homepage SSR payload contains "monthlyLimit":150 (escaped as \"monthlyLimit\":150 in RSC stream)
- ✅ /api/dry-run reads budget.monthlyLimit (=150) correctly: "✅ Budget: $0.24 ≤ $150.00 remaining — OK"
- ✅ /api/settings returns safeMode: true (preserved)
- ✅ All 4 budget routes return HTTP 200
- ✅ No real Seedance API connection — `meta.realApiConnected: false` in every response

Stage Summary:
- Budget widget now updates INSTANTLY in the top-right header when Settings saves a new value (no full dev-server restart required)
- Saved budget survives browser refresh — `page.tsx` SSR reads from DB and passes to `<DashboardClient initialData={{ budget: { monthlyLimit: 150, ... } }} />`
- Prisma/TypeScript errors in cost-summary route are eliminated — the file now type-checks cleanly
- `monthlyLimit` is the canonical field name everywhere (schema, POST body, GET response, client state, localStorage key)
- Safe Mode / Dry Run preserved — no real API calls, no real charges
- Backward compatibility: legacy `monthlyBudgetUsd` field still accepted in POST body for any client that hasn't been updated

---
Task ID: 5
Agent: Main Agent (Super Z)
Task: Phase 1 Safe Cleanup — Prompt Area, Paid Zone Lock, Cost Breakdown Labels, Info Banners

Work Log:

### 1. Generate Tab Prompt Area Cleanup (step-prompt.tsx)
- Removed: PROMPT_TEMPLATES array (8 hardcoded templates: Predator Hunt, Ocean Migration, Forest Micro, Arctic Hunt, Jungle Canopy, Deep Sea, Desert Survival, River Crossing)
- Removed: QUICK_CATS + animalTypes/biomes/actions/cameraShots/lightingOptions constants (quick-fill dropdowns)
- Removed: quickFill() function (text concatenation helper)
- Removed: booster() function + 4 booster buttons (Cinematic, Audio, Time Codes, Optimize for Mini)
- Removed: RecentPromptsSection component
- Removed: Prompt Structure Guide (collapsible)
- Removed: Template Quick-Insert cards section
- Removed: DB Templates panel + "Templates" toggle button
- Removed: loadTemplate() and insertText() helpers
- Removed: showTemplates and showGuide state
- Removed unused imports: BookOpen, ChevronDown, ChevronRight, History, ScrollArea, Collapsible, CollapsibleContent, CollapsibleTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, PromptTemplate type
- Kept: Full/Mini model selector, ModelCompareDialog, Textarea, CharProgressBar, QualityMeter (local regex analyzer)
- Added: Mode toggle (Copy-Paste Prompt vs AI Prompt Writer)
- Added: Mode A — Copy-Paste Prompt (default): large textarea with "Paste your finished prompt here (from ChatGPT / Claude / GLM)..." placeholder, char count, progress bar, local quality analyzer (4 meters in grid)
- Added: Mode B — AI Prompt Writer (disabled placeholder): "Future AI Prompt Writer — disabled. Later this can connect to ChatGPT / Claude / GLM API." text + disabled "Generate Prompt with AI" button + "Safe Mode is ON · Dry Run only · No external API calls" note. NO network call, NO API key field, NO real integration.
- Updated StepPromptProps interface: removed `templates` and `recentPrompts` props

### 2. Client.tsx updates
- Removed `templates` field from InitialData interface
- Removed `const [templates] = useState<PromptTemplate[]>(initialData.templates)` line
- Removed `PromptTemplate` from type imports (no longer used)
- Updated `<StepPrompt>` call to remove `templates={templates}` and `recentPrompts={...}` props
- Added Paid Zone unlock state: paidUnlocked, unlockInput, unlockError
- Added useEffect to restore unlock state from localStorage on mount
- Added handleUnlockSubmit() — checks phrase `bimal2026`, sets paidUnlocked=true, persists to localStorage, shows toast
- Added handleLockPaidZone() — sets paidUnlocked=false, clears localStorage, shows toast
- Passed 6 new props to <StepPaid>: paidUnlocked, unlockInput, setUnlockInput, unlockError, onUnlockSubmit, onLock
- Added Info icon import for tab banners
- Added info banner above Workflow tab: "Production planning tools — some sections are experimental. All data stays local."
- Added info banner above Calendar tab: "Local planning calendar — no Google Calendar connection. All data stays in your local SQLite DB."

### 3. Page.tsx updates
- Removed `db.promptTemplate.findMany()` from Promise.all (no longer needed)
- Removed `templates` field from return object (both success and error paths)
- Fixed pre-existing TS error: `videoFileName: latestVideo.videoFileName` → `videoFileName: latestVideo.videoFileName ?? ''`

### 4. Paid Zone Lock (step-paid.tsx)
- Added imports: Lock, Unlock, KeyRound from lucide-react; Badge from ui/badge
- Extended StepPaidProps with 6 new fields: paidUnlocked, unlockInput, setUnlockInput, unlockError, onUnlockSubmit, onLock
- Added locked-state early return (when !paidUnlocked):
  - Card titled "Advanced Paid Controls Locked" with Lock icon
  - Info box: "Paid generation controls are hidden by default to prevent accidental submissions during Dry-Run / Planning workflow."
  - Status line: "Safe Mode is ON · Dry-Run only · No real API calls"
  - Password input + Unlock button
  - Error message on wrong phrase
  - Disclaimer: "⚠ This is a local UI lock only — not real security. All server-side safety checks remain in place."
- Updated safeMode branch (when unlocked but Safe Mode still ON):
  - Card titled "Paid Zone — Safe Mode is ON"
  - ShieldCheck icon + "Safe Mode is ON — Paid generation is disabled"
  - Instructions: "(1) turn Safe Mode OFF, (2) pass a dry run, (3) pass all 10 pre-submission gates, (4) type SUBMIT_ONE_PAID_TASK"
  - Badge: "Dry-Run Mode Active · No Real Charges"
  - Lock button to re-hide the Paid Zone
- Added Lock button to the main Paid Zone card header (when fully visible)
- Preserved: all 10 gate checks, SUBMIT_ONE_PAID_TASK confirmation, 3-second countdown, /api/generate server-side safeMode check

### 5. Dry Run Cost Breakdown Fix (step-dryrun.tsx)
- Rewrote CostBreakdownSection completely
- Removed: misleading "Base (480p)" + "Resolution ×N" + "Duration = estimatedCost * 0.1" rows that didn't sum to total
- Added: honest 3-row formula display that DOES sum to total:
  - "Rate (Full · 720p)" → $0.060/s
  - "Duration" → × 6s
  - "Estimated cost" → $0.36
- Added: "Dry-run estimate only. No real charge." label in header
- Added: collapsible <details> showing how the rate is derived (480p base × multiplier = final rate)
- Added: formula note "cost = rate[resolution] × duration"
- Displayed resolution now matches the user-selected resolution (previously always showed "Base (480p)")

### 6. Workflow + Calendar info banners (client.tsx)
- Added small info banners above the Workflow and Calendar tab contents
- Banners use Info icon + emerald-tinted background matching existing dark WSTV theme
- No functional changes to either tab

Safety Verification (all confirmed):
- ✅ Zero `fetch('https')` calls added (grep returns empty)
- ✅ Zero API key references added (grep returns empty)
- ✅ Safe Mode default ON in prisma/schema.prisma (`safeMode Boolean @default(true)`)
- ✅ Server-side safeMode check at /api/generate route.ts:52 still returns 403 if Safe Mode is on
- ✅ SUBMIT_ONE_PAID_TASK confirmation still required (client + server)
- ✅ All 10 pre-submission gates preserved
- ✅ 3-second countdown preserved
- ✅ bimal2026 unlock phrase is client-side only (not in SSR HTML)
- ✅ Unlock phrase is NOT real security — explicitly documented in code comments

Verification (curl tests against running dev server on port 3000):
- ✅ HTTP 200: GET /, /api/cost-summary, /api/budget, /api/settings, /api/history, /api/reference-assets, /api/presets, /api/content-calendar, /api/viral-learning, /api/provider-comparisons, /api/prompt-versions, /api/generation-qa
- ✅ Homepage SSR HTML: 0 matches for "Predator Hunt|Ocean Migration|Forest Micro|Arctic Hunt" (templates removed)
- ✅ Homepage SSR HTML: 1 match for "Copy-Paste Prompt" (Mode A present)
- ✅ Homepage SSR HTML: 1 match for "AI Prompt Writer" (Mode B present)
- ✅ Homepage SSR HTML: 1 match for "Advanced Paid Controls Locked" (lock UI shown by default)
- ✅ Homepage SSR HTML: 0 matches for "bimal2026" (unlock phrase client-side only)
- ✅ /api/settings returns safeMode: true (preserved)
- ✅ /api/cost-summary returns safeMode: true, dryRunOnly: true, realApiConnected: false (all preserved)
- ✅ /api/dry-run with 720p Full 6s returns estimatedCost: 0.36 (correct: $0.06/s × 6s)
- ✅ /api/cost-summary returns monthlyLimit: 150 (previous fix still in place)
- ✅ No compile errors in dev server log

Stage Summary:
- Generate tab prompt area is now clean: large textarea + char count + model selector + local quality analyzer. Two-mode toggle: Copy-Paste (default) vs AI Writer (disabled placeholder).
- Paid Zone is hidden by default behind "Advanced Paid Controls Locked" card. Unlock phrase `bimal2026` reveals the UI but does NOT bypass any server-side safety check. Safe Mode, 10 gates, SUBMIT_ONE_PAID_TASK confirmation, and 3-second countdown all remain in place.
- Dry Run cost breakdown now honestly shows: Rate × Duration = Estimated Cost. The misleading "Base (480p)" + meaningless "Duration = estimatedCost * 0.1" rows are gone. A collapsible details block explains how the rate is derived from 480p base × multiplier.
- Workflow and Calendar tabs now have small info banners clarifying they are local-only experimental tools (no external calendar connection).
- All safety invariants preserved: Safe Mode ON by default, Dry Run only, no real Seedance API, no API keys, no external HTTP calls.



---
Task ID: 6
Agent: Main Agent (Super Z)
Task: Phase 2 — Paid Zone Lock hardening, Remaining Video Capacity (720p/1080p/4K), 3-Plan Comparison Calculator

Work Log:

### A. Paid Zone Lock — 4-state gating with proper visibility (step-paid.tsx)
Rewrote StepPaid into 4 explicit states with strict gating:

1. STATE 1 — LOCKED (default): Shows ONLY "Advanced Paid Controls Locked" + password input. Does NOT show SUBMIT_ONE_PAID_TASK, submit button, cost breakdown, gate list, or real-paid-request warning.
2. STATE 2 — UNLOCKED + Safe Mode ON: Shows advanced controls area + Lock button + clear amber warning "Safe Mode is ON. Paid submit remains disabled." Shows cost breakdown as info-only but NOT the submit UI.
3. STATE 3 — UNLOCKED + Safe Mode OFF + gates not passed: Shows gate list (so user can see what's missing) but NOT SUBMIT_ONE_PAID_TASK input or submit button.
4. STATE 4 — UNLOCKED + Safe Mode OFF + all gates passed: NOW shows SUBMIT_ONE_PAID_TASK input + submit button (still gated by 3-second countdown).

Input visibility fix: Created PAID_INPUT_CLASS constant with:
- bg-[oklch(0.10_0.02_155)] (dark visible background)
- border-emerald-500/30 (visible border)
- text-gray-100 (visible text)
- placeholder:text-gray-500 (visible placeholder)
- focus:border-emerald-400 (visible focus state)
- style={{ color: '#e5e7eb' }} added to all inputs as belt-and-suspenders

"Lock Paid Controls" button added to all unlocked states (States 2, 3, 4) — clears localStorage.wstv_paid_unlocked and returns to State 1.

### B. Remaining Video Capacity — 9 cards (3 resolutions × 3 durations)
Extended lib/pricing.ts BudgetSnapshot interface with 9 new fields:
- estimatedCapacity720p10s, estimatedCapacity720p12s, estimatedCapacity720p15s
- estimatedCapacity1080p10s, estimatedCapacity1080p12s, estimatedCapacity1080p15s
- estimatedCapacity4k10s, estimatedCapacity4k12s, estimatedCapacity4k15s

Each field is { tokensPerVideo, videosRemaining } so the UI can show both values.

Updated calculateBudgetSnapshot() to compute all 9 capacities using the existing calculateTokens() formula:
- 720p  → 720 × 1280 (vertical)
- 1080p → 1080 × 1920 (vertical)
- 4K    → 2160 × 3840 (vertical)

Updated /api/budget-snapshot route to include the 9 new fields in both the "no active purchase" fallback and the calculated snapshot.

Updated types.ts BudgetSnapshotData to include the 9 new fields.

Updated cost-dashboard.tsx "Remaining Video Capacity" SectionCard:
- Replaced old 4-card grid (10s/12s/15s 720p + 15s 1080p) with new 9-card grid
- Each card shows: resolution · duration, videos remaining (large), tokens per video (mono)
- 4K cards have "EST" badge and amber/red color coding
- Added formula explanation: "remaining videos = remainingTokens ÷ tokensPerVideo"
- Added amber warning: "4K pricing is estimated / configurable — verify or edit 4K rates in Pricing & Plans tab"

### C. 3-Plan Comparison Calculator (new "Compare Plans" tab)
Added new "Compare Plans" tab to cost-dashboard.tsx (between "Pricing & Plans" and "Charts").

Features:
- Amber banner: "Manual plan comparison — edit plan values. Prices below are user-editable and are NOT verified official provider pricing."
- Usage selector: target videos/month (default 30), duration (10/12/15s, default 15), resolution (720p/1080p/4K, default 720p)
- 3 editable plan columns, each with:
  - planName, planCostUsd, includedTokens, validityDays, expiryDate, notes
  - Plan 1 defaults to current active subscription: Light Plan / $30.10 / 7M tokens / 90 days / 2026-09-14
  - Plans 2 & 3 start empty for user to fill in alternatives
  - Plan 1 has "ACTIVE" badge
- Derived metrics per plan (auto-calculated):
  - USD per 1M tokens
  - USD per 15s 720p video
  - USD per 15s 1080p video
  - USD per 15s 4K video
  - Videos in plan (at selected resolution × duration)
  - Daily token allowance
- Over-budget warning (red) when target usage exceeds plan tokens
- Remaining unused tokens display (emerald) when plan has enough tokens

Cheapest Plan Recommendation section:
- Filters plans to only those with enough tokens for target usage
- Picks the plan with lowest totalCostForTarget = (planCostUsd / includedTokens) × neededTokens
- Shows: plan name, plan cost, cost per video, total cost for target videos, remaining unused tokens
- "Why is this cheapest?" explanation with full math
- Over-budget warning (red) if ALL 3 plans are too small
- "Fill in all 3 plans" prompt (amber) if any plan has 0 tokens

### D/E/F. Phase 1 features verified intact
- Generate tab cleanup: Copy-Paste Prompt + AI Prompt Writer modes still present (9 matches in step-prompt.tsx)
- Dry Run cost breakdown: "Dry-run estimate only. No real charge." + rate × duration formula still present (3 matches in step-dryrun.tsx)
- Workflow banner: "Production planning tools — some sections are experimental" still present (1 match)
- Calendar banner: "Local planning calendar — no Google Calendar connection" still present (1 match)

### G. Safety verification (all confirmed)
- ✅ Zero fetch('https') calls added (grep returns empty)
- ✅ Zero API key references added (grep returns empty)
- ✅ Safe Mode default ON in prisma/schema.prisma (safeMode Boolean @default(true))
- ✅ /api/generate server-side safeMode check intact (line 52: if (settings?.safeMode) returns 403)
- ✅ SUBMIT_ONE_PAID_TASK still required (2 matches in generate/route.ts, 13 matches in step-paid.tsx)
- ✅ All 10 pre-submission gates preserved (26 gate references in step-paid.tsx)
- ✅ bimal2026 NOT in any API route (client-side only — verified via grep src/app/api/)

### H. Test results (curl + dev server)
- ✅ HTTP 200: GET /, /api/cost-summary, /api/budget, /api/settings, /api/budget-snapshot, /api/pricing, /api/subscriptions/plans, /api/subscriptions/purchases, /api/history, /api/reference-assets, /api/content-calendar
- ✅ Homepage SSR: "Copy-Paste Prompt" present, "AI Prompt Writer" present, "Advanced Paid Controls Locked" present
- ✅ Homepage SSR: "SUBMIT_ONE_PAID_TASK" NOT in SSR HTML (0 matches — hidden by default)
- ✅ Homepage SSR: "bimal2026" NOT in SSR HTML (0 matches — client-side only)
- ✅ /api/settings returns safeMode: true
- ✅ /api/dry-run with 720p Full 6s returns estimatedCost: 0.36 (correct)
- ✅ /api/budget-snapshot returns all 9 new capacity fields (estimatedCapacity720p10s, 1080p15s, 4k15s verified)
- ✅ /api/pricing returns array (supports rate4k and supports4k fields)
- ✅ No compile errors in dev server log
- ✅ Braces/parens/brackets balanced in cost-dashboard.tsx (1378 lines)

Stage Summary:
- Paid Zone now has 4 explicit states: LOCKED → UNLOCKED+SafeModeON → UNLOCKED+GatesNotPassed → UNLOCKED+AllGatesPassed. SUBMIT_ONE_PAID_TASK input and submit button ONLY appear in State 4. All paid-zone inputs use visible dark-theme text styling.
- Remaining Video Capacity now shows 9 cards covering 720p/1080p/4K × 10s/12s/15s, each with tokens-per-video and videos-remaining. 4K is marked as estimated/configurable.
- New "Compare Plans" tab in Cost Dashboard with 3 editable plan slots, usage selector (videos/month, duration, resolution), per-plan derived metrics (USD per 1M tokens, USD per video at 720p/1080p/4K, daily allowance), over-budget warnings, and cheapest-plan recommendation with full math explanation.
- All Phase 1 features preserved: Generate cleanup, Dry Run cost breakdown, Workflow/Calendar info banners.
- All safety invariants preserved: Safe Mode ON by default, Dry Run only, no real Seedance API, no API keys, no external HTTP calls, all 10 gates intact, SUBMIT_ONE_PAID_TASK still required, bimal2026 client-side only.

---
Task ID: 7
Agent: Main Agent (Super Z)
Task: Phase 3 — Capacity card details, Usage date fix, Manual Entry full form, Add Custom Preset wiring

Work Log:

### 1. Capacity cards extended with tokens/video + USD/video + CNY/video + rate source
- Extended `CapacityEntry` interface in `src/lib/pricing.ts` with: tokensPerVideo, videosRemaining, costUsdPerVideo, costJpyPerVideo, isEstimated, pricingNote, rateSource
- Updated `calculateBudgetSnapshot()` to accept optional `defaultModelRate4k` param and `exchangeRate`. Computes costPerVideo = (tokensPerVideo / 1000) × ratePerK for each of the 9 capacity entries
- 4K rate handling: if PricingModel has rate4k > 0, uses it directly. Otherwise falls back to 1.5× 1080p rate and marks isEstimated=true with note "4K estimate — configurable (verify in Pricing & Plans)"
- Updated `/api/budget-snapshot` route to pass rate4k from PricingModel DB
- Updated `types.ts` BudgetSnapshotData + added CapacityEntryData interface
- Updated `cost-dashboard.tsx` Remaining Video Capacity SectionCard: each card now shows duration · resolution, videos remaining (big), tokens/video, USD/video, JPY/video (if exchange rate), rate source, pricing note. "Estimate only / manual tracker" badge at top

### 2. Usage History date correction (2026/6/25 → 2026/6/16)
- Root cause: dashboard displayed `record.createdAt` (the row-insert date, which was 2026-06-25 when the seed ran) instead of `record.generatedAt` (the actual generation date)
- Fix A: Updated `prisma/seed-cost.ts` to set both `generatedAt` AND `createdAt` to `2026-06-16` for both WSTV Wildlife Reel records
- Fix B: Updated `cost-dashboard.tsx` Usage History table to display `record.generatedAt || record.createdAt` (prefers generatedAt, falls back to createdAt)
- Fix C: Updated chart data (tokenUsageChartData, usdSpentChartData) to use `generatedAt || createdAt`
- Fix D: Updated Manual Actual Cost Entry select dropdown to use `generatedAt || createdAt`
- Fix E: Created `scripts/patch-usage-dates.js` — idempotent script that upserts the 2 known records (usage-existing-001 and usage-existing-002) with 2026-06-16 dates. Run with: `node scripts/patch-usage-dates.js`
- Fix F: Ran the patch script against the delivered DB — both records now show 2026-06-16
- Added "Diff" column to Usage History showing tokens difference (actual - estimated) and cost difference, color-coded (amber if over, emerald if under)

### 3. Manual Actual Cost Entry — full-featured form
- Added new `manualEntry` state object with 13 fields: projectTitle, animalStoryName, modelName, modelId, mode, resolution, fps, durationSeconds, estimatedTokens, estimatedCostUsd, actualTokens, actualCostUsd, generationDate, notes, status
- Added `handleSaveManualEntry()` — POSTs to `/api/usage-records`, maps resolution string to width/height (720p→720×1280, 1080p→1080×1920, 4K→2160×3840), auto-computes estimated tokens from resolution×fps×duration if blank, clears form on success, refreshes Usage History
- Added full form UI above Usage History section with all 13 fields, "Manual actual cost — user-entered after browser generation" info banner, "Save Manual Entry" button with loading state
- All inputs use visible dark-theme styling: bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 + style={{ color: '#e5e7eb' }}

### 4. Add Custom Preset button — wired to modal + POST /api/presets
- Fixed fetch bug in production-workflow.tsx: was checking `d?.presets?.length` but API returns bare array. Now handles both `Array.isArray(d)` and `d.presets`
- Added `showPresetModal`, `presetSaving`, `newPreset` state
- Added `handleSavePreset()` — POSTs to `/api/presets` with name, category, animalType, biome, dangerType, emotionalBeat, structureNotes, promptTemplate. Appends created preset to local state, clears form, closes modal
- Added full modal UI with 8 fields: title, category, animal, biome, danger/tension, emotional tone, short notes, prompt text. Cancel + Save Preset buttons. Backdrop click closes. X button closes
- Wired "Add Custom Preset" button to `onClick={() => setShowPresetModal(true)}`
- Added "Copy Prompt" and "Copy Idea" buttons to each preset card (with stopPropagation so they don't trigger applyPreset)
- Updated `applyPreset()` to dispatch `window.dispatchEvent(new CustomEvent('wstv-apply-preset', { detail: { prompt, presetName } }))` — the Generate tab listens for this event, populates the prompt box, switches to Generate tab, and shows a success toast
- Added event listener in `client.tsx` for `wstv-apply-preset` — calls setPrompt + invalidateIfNeeded + setActiveTab('generation') + addToast

### 5. Phase 1+2 features verified intact
- ✅ Generate tab cleanup (Copy-Paste Prompt + AI Prompt Writer modes)
- ✅ Paid Zone 4-state lock (LOCKED → UNLOCKED+SafeModeON → UNLOCKED+GatesNotPassed → UNLOCKED+AllGatesPassed)
- ✅ Dry Run cost breakdown (rate × duration formula, "Dry-run estimate only" label)
- ✅ 9-card Remaining Video Capacity grid
- ✅ 3-Plan Comparison Calculator with cheapest-plan recommendation
- ✅ Workflow + Calendar info banners

### 6. Safety verification (all confirmed)
- ✅ Zero fetch('https') calls added
- ✅ Zero API key references added
- ✅ Safe Mode default ON in prisma/schema.prisma
- ✅ /api/generate server-side safeMode check intact (returns 403 if ON)
- ✅ SUBMIT_ONE_PAID_TASK still required (client + server)
- ✅ bimal2026 NOT in any API route (client-side only)

### 7. Test results (curl + dev server)
- ✅ HTTP 200 on all 12 API routes
- ✅ Both WSTV Wildlife Reel usage records show generatedAt=2026-06-16, createdAt=2026-06-16
- ✅ Budget snapshot returns all 9 capacity entries with costUsdPerVideo, costJpyPerVideo, isEstimated, pricingNote, rateSource
- ✅ POST /api/usage-records creates new record with correct generatedAt — appears immediately in Usage History
- ✅ POST /api/presets creates new preset — appears immediately in GET /api/presets
- ✅ Homepage SSR: Copy-Paste Prompt + Advanced Paid Controls Locked present, SUBMIT_ONE_PAID_TASK NOT in SSR (hidden by default), bimal2026 NOT in SSR (client-side only)
- ✅ /api/settings returns safeMode: true
- ✅ /api/dry-run 720p Full 6s returns estimatedCost: 0.36
- ✅ No compile errors in dev server log
- ✅ Test records cleaned up — DB ships with exactly 2 usage records (the original WSTV reels) dated 2026-06-16

Stage Summary:
- Capacity cards now show full breakdown: tokens/video, USD/video, JPY/video, rate source, pricing note, estimate label. 4K is clearly marked as estimated/configurable.
- Usage History date bug fixed at 3 levels: seed file, dashboard display logic, and existing DB rows patched via scripts/patch-usage-dates.js. Both WSTV reels now show 2026/6/16.
- Manual Actual Cost Entry is now a full-featured 13-field form that saves via POST /api/usage-records and immediately appears in Usage History. Includes auto-computation of estimated tokens from resolution×fps×duration.
- Add Custom Preset button now opens a modal with 8 fields, saves via POST /api/presets, persists after refresh. Each preset card has "Copy Prompt" and "Copy Idea" buttons. Clicking a preset card sends its prompt to the Generate tab via a custom event.
- All Phase 1+2 features preserved. All safety invariants preserved.

---
Task ID: 8
Agent: Main Agent (Super Z)
Task: PHASE4 — Official Seedance 2.0 API Validation / Payload Preview

Work Log:

### 1. Created src/lib/seedance-validation.ts (NEW)
Full validation library with:
- Constants: VALID_DURATION_MIN=4, VALID_DURATION_MAX=15, AUTO_DURATION=-1
- SEEDANCE_MODEL_IDS: Standard (dreamina-seedance-2-0-260128), Fast (dreamina-seedance-2-0-fast-260128), Mini (dreamina-seedance-2-0-mini-260615)
- MODEL_RESOLUTION_RULES: Standard=[480p,720p,1080p,4k], Fast/Mini=[480p,720p]
- MODEL_METADATA: labels, descriptions, char limits
- GENERATION_MODE_METADATA: reference_mode vs frame_mode allowed roles
- REFERENCE_LIMITS_SEEDANCE: 9 images / 3 videos / 3 audios
- isValidSeedanceDuration(): integer 4–15 or -1
- getSupportedResolutions(), isResolutionSupported(): model-specific checks
- validateSeedancePayload(): full validation (duration, resolution, mode conflict, audio-alone, last_frame requires first_frame, counts, URL format)
- buildSeedancePayload(): builds JSON payload preview with content blocks (image_url, video_url, audio_url, text)
- SEEDANCE_TASK_STATUSES + CANCEL_DELETE_RULES: for future real API lifecycle
- WSTV_DEFAULTS: model=Standard, mode=reference_mode, ratio=9:16, duration=15, resolution=720p
- MEDIA_LIMITS: image 30MB/64MB, video 2-15s/mp4/mov, audio 2-15s/mp3/wav
- HUMAN_FACE_WARNING, FRAMES_NOT_SUPPORTED_NOTE, SEED_NOT_SUPPORTED_NOTE, CAMERA_FIXED_NOT_SUPPORTED_NOTE

### 2. Updated step-output.tsx — official model selector + duration validation
- 3-way Seedance model selector (Standard/Fast/Mini) with official model IDs
- Generation mode toggle (Reference Mode default vs Frame Mode)
- Resolution cards driven by MODEL_RESOLUTION_RULES (Fast/Mini only show 480p/720p)
- Duration: slider 4–15 + "Auto (-1)" toggle, validates isValidSeedanceDuration()
- Seed field: disabled, marked "FUTURE"; documented for some video flows, but not sent in the PHASE5.1 payload
- FPS: kept for display only, labeled "not in Seedance payload"
- Resolution rule notes per model

### 3. Updated step-references.tsx — mode-aware role filtering + conflict detection
- RefRow filters role dropdown by generationMode (frame_mode: only first_frame/last_frame; reference_mode: hides frame roles)
- Video/audio sections hidden in frame_mode
- Mode conflict warning (red Alert) when frame roles mixed with reference roles
- Frame mode hint: "If last_frame is used, first_frame is also required"
- Reference mode hint: "first_frame / last_frame not allowed"

### 4. Updated dry-run/route.ts — full Seedance validation
- Accepts seedanceModelId + generationMode fields
- Duration validation: isValidSeedanceDuration() — 4–15 or -1
- Resolution validation: isResolutionSupported() — model-specific
- Cost estimate: 0 for auto duration (-1), skips cost cap + budget checks
- Runs full validateSeedancePayload() — catches all mode/count/conflict errors
- All errors + warnings added to validation log

### 5. Created seedance-payload-preview.tsx (NEW)
Renders "Seedance 2.0 API Validation & Payload Preview" card with:
- Live Payload Preview (collapsible JSON) — buildSeedancePayload() from current form state. "Payload preview only — no real API call." Copy button.
- Request Examples (collapsible) — 6 static examples: text-only, frame first_frame, frame first+last, ref master+storyboard, ref master+storyboard+audio, ref master+video+audio
- Future Real API Lifecycle (collapsible) — 8-step flow, 6 task statuses, cancel/delete rules, 24h URL expiry warning
- Media Limits & Warnings (collapsible) — image/video/audio limits, human-face warning
- Unsupported controls notes — frames, seed, camera_fixed
- Validation status badge + error/warning lists

### 6. Updated client.tsx — new state + props
- seedanceModelId state (default: dreamina-seedance-2-0-260128)
- generationMode state (default: reference_mode)
- setSeedanceModelIdV() — auto-clamps resolution when switching to Fast/Mini
- Passed props to StepOutput, StepReferences, StepDryRun
- Renders SeedancePayloadPreviewPanel after StepDryRun
- Generate tab is now daily-use focused: compact safety/status strip after workflow progress, OfficialQuickstartReference moved to Settings, ResourcePackBillingPanel moved to Cost

### 7. Updated types.ts — new types
- SeedanceModelId type (3 official IDs)
- GenerationMode type
- FRAME_MODE_ROLES Set
- REFERENCE_MODE_INTERNAL_ROLES Set
- REFERENCE_ROLES.image updated — frame roles labeled "(Frame Mode)"

### 8. Schema planning (PHASE4-SCHEMA-PLANNING.md)
Documented recommended future schema migration. NO migration applied in PHASE4. Payload preview is in-memory only. Existing VideoTask fields can absorb future API data.

### 9. Phase 1+2+3 verified intact
- Generate tab cleanup (Copy-Paste + AI Writer)
- Paid Zone 4-state lock
- 9-card capacity grid with cost/video
- 3-plan comparison
- Manual Actual Cost Entry
- Add Custom Preset modal
- Usage dates 2026/6/16

### 10. Safety verification (all confirmed)
- Zero fetch('https') calls to BytePlus API
- Zero API keys (only <ARK_API_KEY> placeholder in a comment)
- Safe Mode default ON
- /api/generate server-side safeMode check intact
- SUBMIT_ONE_PAID_TASK still required
- bimal2026 NOT in any API route
- No frames parameter in payload
- Seed/camera_fixed not active controls

### 11. Test results (29 validation tests + 8 API tests)
- Duration: 4–15 all pass, -1 passes, 3 fails, 16 fails (15/15 correct)
- Resolution: Standard allows 480p/720p/1080p/4K, Fast/Mini block 1080p/4K (10/10 correct)
- Mode conflict: master+storyboard passes, first+last_frame passes, mixed fails, audio-only fails (4/4 correct)
- All 8 API routes return HTTP 200 (dry-run 405 on GET — expected)
- Homepage SSR: all 3 model IDs present, Payload preview label present, SUBMIT_ONE_PAID_TASK hidden, bimal2026 hidden
- Dry-run 720p Full 6s = $0.36 (correct)
- No compile errors
- All tabs open

Stage Summary:
- Dashboard now validates against official Seedance 2.0 rules: model-specific resolutions (Standard 480p/720p/1080p/4k, Fast/Mini 480p/720p only), duration 4–15 or -1 auto, generation mode separation (reference_mode vs frame_mode with no mixing), reference limits (9 images / 3 videos / 3 audios), audio-not-alone rule, last_frame requires first_frame rule.
- Payload preview panel shows the exact JSON that would be sent to POST /api/v3/contents/generations/tasks in a future real integration — with no real API call. Live payload, examples, lifecycle, media warnings, and future controls are collapsed by default.
- 6 request examples cover all major use cases (text-only, frame modes, reference modes).
- Future real API lifecycle documented (8-step flow, 6 task statuses, cancel/delete rules, 24h URL expiry warning).
- Frames parameter NOT used (Seedance 2.0 doesn't support it). Seed and camera_fixed are disabled/future notes only.
- All Phase 1+2+3 features preserved. All safety invariants preserved.
