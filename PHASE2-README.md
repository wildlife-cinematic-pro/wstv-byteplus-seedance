# WSTV Seedance Dashboard — Phase 2 (Paid Zone Lock + Capacity + Plan Comparison)

This ZIP contains Phase 2 changes on top of Phase 1. All safety invariants are preserved.

## What was changed in Phase 2

### A. Paid Zone Lock — 4-state gating (step-paid.tsx)

The Paid Zone now has 4 explicit states with strict gating. `SUBMIT_ONE_PAID_TASK` and the submit button ONLY appear in State 4.

| State | Condition | What shows |
|---|---|---|
| **1. LOCKED** (default) | `!paidUnlocked` | "Advanced Paid Controls Locked" + password input. NOTHING else. |
| **2. UNLOCKED + Safe Mode ON** | `paidUnlocked && safeMode` | Advanced controls area + Lock button + amber warning "Safe Mode is ON. Paid submit remains disabled." + cost breakdown (info-only). NO submit UI. |
| **3. UNLOCKED + Gates not passed** | `paidUnlocked && !safeMode && !allGatesPassed` | Gate list (so user can see what's missing) + Lock button. NO submit UI. |
| **4. UNLOCKED + All gates passed** | `paidUnlocked && !safeMode && allGatesPassed` | Full Paid Zone: cost breakdown + gate list + SUBMIT_ONE_PAID_TASK input + submit button (still gated by 3-second countdown). |

**Input visibility fix:** All paid-zone inputs now use a shared `PAID_INPUT_CLASS` constant:
```css
bg-[oklch(0.10_0.02_155)] border-emerald-500/30 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 focus:ring-emerald-400/30
```
Plus `style={{ color: '#e5e7eb' }}` as belt-and-suspenders.

**"Lock Paid Controls" button** added to all unlocked states (States 2, 3, 4) — clears `localStorage.wstv_paid_unlocked` and returns to State 1.

### B. Remaining Video Capacity — 9 cards (cost-dashboard.tsx)

Replaced the old 4-card grid (10s/12s/15s 720p + 15s 1080p) with a new 9-card grid covering **3 resolutions × 3 durations**:

| | 10s | 12s | 15s |
|---|---|---|---|
| **720p** | card | card | card |
| **1080p** | card | card | card |
| **4K** | card (EST) | card (EST) | card (EST) |

Each card shows:
- Resolution · duration label
- Videos remaining (large number)
- Tokens per video (mono font)

4K cards have an "EST" badge and amber/red color coding, plus a warning: "4K pricing is estimated / configurable — verify or edit 4K rates in Pricing & Plans tab."

The formula is displayed clearly: `remaining videos = remainingTokens ÷ tokensPerVideo · tokensPerVideo = (width × height × 24fps × duration) ÷ 1024`

**Backend changes:**
- `src/lib/pricing.ts` — `BudgetSnapshot` interface extended with 9 new fields (`estimatedCapacity720p10s` through `estimatedCapacity4k15s`), each `{ tokensPerVideo, videosRemaining }`. `calculateBudgetSnapshot()` updated to compute all 9.
- `src/app/api/budget-snapshot/route.ts` — "No active subscription" fallback updated to include the 9 new fields with zero values.
- `src/components/dashboard/types.ts` — `BudgetSnapshotData` extended with the 9 new fields.

### C. 3-Plan Comparison Calculator (new "Compare Plans" tab in Cost Dashboard)

Added a new "Compare Plans" tab between "Pricing & Plans" and "Charts".

**Usage selector:**
- Target videos / month (default 30)
- Duration per video: 10s / 12s / 15s (default 15)
- Resolution: 720p / 1080p / 4K (default 720p)

**3 editable plan columns:**
- Plan 1 defaults to current active subscription: Light Plan / $30.10 / 7,000,000 tokens / 90 days / 2026-09-14 (with "ACTIVE" badge)
- Plans 2 & 3 start empty for user to fill in alternatives
- Each plan has editable: planName, planCostUsd, includedTokens, validityDays, expiryDate, notes

**Auto-calculated metrics per plan:**
- USD per 1M tokens
- USD per 15s 720p video
- USD per 15s 1080p video
- USD per 15s 4K video
- Videos in plan (at selected resolution × duration)
- Daily token allowance

**Per-plan status:**
- Red over-budget warning if target usage exceeds plan tokens
- Emerald "remaining unused tokens" display if plan has enough tokens

**Cheapest Plan Recommendation section:**
- Filters to plans with enough tokens for target usage
- Picks the plan with lowest `totalCostForTarget = (planCostUsd / includedTokens) × neededTokens`
- Shows: plan name, plan cost, cost per video, total cost for target, remaining unused tokens
- "Why is this cheapest?" explanation with full math
- Red over-budget warning if ALL 3 plans are too small
- Amber "Fill in all 3 plans" prompt if any plan has 0 tokens

**Amber banner at top:** "Manual plan comparison — edit plan values. Prices below are user-editable and are NOT verified official provider pricing."

### D/E/F. Phase 1 features verified intact

- ✅ Generate tab cleanup (Copy-Paste Prompt + AI Prompt Writer modes)
- ✅ Dry Run cost breakdown (rate × duration formula, "Dry-run estimate only" label)
- ✅ Workflow info banner ("Production planning tools — some sections are experimental")
- ✅ Calendar info banner ("Local planning calendar — no Google Calendar connection")

## Safety invariants (all verified)

| Invariant | Status |
|---|---|
| Safe Mode ON by default | ✅ `prisma/schema.prisma` line 95: `safeMode Boolean @default(true)` |
| Dry Run only | ✅ `/api/cost-summary` returns `dryRunOnly: true` |
| No real Seedance API connected | ✅ `/api/cost-summary` returns `realApiConnected: false` |
| No external paid generation | ✅ `/api/generate` returns 403 if Safe Mode is ON |
| No API keys | ✅ Zero API key references in `src/` |
| No `fetch('https://...')` added | ✅ Zero external HTTP calls in `src/` |
| Local-only dashboard | ✅ Only `@prisma/client` connects to local SQLite file |
| 10 pre-submission gates preserved | ✅ All 10 gates intact in `step-paid.tsx` and `/api/generate` |
| SUBMIT_ONE_PAID_TASK confirmation | ✅ Still required (client + server) |
| 3-second countdown | ✅ Preserved |
| Unlock phrase client-side only | ✅ `bimal2026` not in any API route |

## How to run

```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push   # safe — syncs schema, no data loss
npm run dev
```

Open http://localhost:3000

## Test results (curl + dev server verification)

| Test | Result |
|---|---|
| HTTP 200 on all 11 API routes | ✅ |
| Homepage SSR contains "Copy-Paste Prompt" | ✅ |
| Homepage SSR contains "AI Prompt Writer" | ✅ |
| Homepage SSR contains "Advanced Paid Controls Locked" | ✅ |
| Homepage SSR does NOT contain "SUBMIT_ONE_PAID_TASK" | ✅ (0 matches — hidden by default) |
| Homepage SSR does NOT contain "bimal2026" | ✅ (0 matches — client-side only) |
| `/api/settings` returns `safeMode: true` | ✅ |
| `/api/dry-run` 720p Full 6s returns `estimatedCost: 0.36` | ✅ |
| `/api/budget-snapshot` returns all 9 new capacity fields | ✅ |
| `/api/pricing` returns array with `rate4k` and `supports4k` fields | ✅ |
| No compile errors in dev server log | ✅ |
| Braces/parens/brackets balanced in cost-dashboard.tsx (1378 lines) | ✅ |

## Files modified in Phase 2

| File | Change |
|------|--------|
| `src/components/dashboard/step-paid.tsx` | Full rewrite — 4-state gating, PAID_INPUT_CLASS visibility, Lock button on all unlocked states |
| `src/components/dashboard/cost-dashboard.tsx` | New "Compare Plans" tab + 9-card Remaining Video Capacity grid + 3-plan comparison state |
| `src/lib/pricing.ts` | Extended `BudgetSnapshot` interface with 9 capacity fields + `calculateBudgetSnapshot()` updates |
| `src/app/api/budget-snapshot/route.ts` | "No active subscription" fallback updated with 9 new zero-value capacity fields |
| `src/components/dashboard/types.ts` | `BudgetSnapshotData` extended with 9 new capacity fields |

## Files NOT modified in Phase 2 (kept from Phase 1)

- `src/components/dashboard/step-prompt.tsx` (Phase 1 Generate cleanup — intact)
- `src/components/dashboard/step-dryrun.tsx` (Phase 1 cost breakdown fix — intact)
- `src/components/dashboard/client.tsx` (Phase 1 Paid Zone unlock state + tab banners — intact)
- `src/app/page.tsx` (Phase 1 template fetch removal — intact)
- `prisma/schema.prisma` (no schema migration needed — `rate4k` and `supports4k` fields already existed)
