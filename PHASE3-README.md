# WSTV Seedance Dashboard — Phase 3 (Capacity Details + Date Fix + Manual Entry + Preset Wiring)

This ZIP contains Phase 3 changes on top of Phase 1 + Phase 2. All safety invariants are preserved.

## What was changed in Phase 3

### 1. Capacity cards — full breakdown (cost-dashboard.tsx + lib/pricing.ts + budget-snapshot API + types.ts)

Each of the 9 capacity cards (720p/1080p/4K × 10s/12s/15s) now shows:

- **Duration · Resolution** header (e.g., "15s · 720p")
- **Videos remaining** (large number)
- **tokens/video** (e.g., 324,000)
- **USD/video** (e.g., $2.2680)
- **JPY/video** (if exchange rate available, e.g., ¥338.86)
- **rate source** (e.g., "PricingModel.rate720p")
- **pricing note** (e.g., "local manual estimate" or "4K estimate — configurable")
- **EST badge** for 4K cards (since 4K pricing is estimated)

Top of section: "Estimate only / manual tracker" badge + formula explanation.

**4K handling:** If the PricingModel DB has `rate4k > 0`, uses it directly. Otherwise falls back to 1.5× the 1080p rate and marks `isEstimated=true` with note "4K estimate — configurable (verify in Pricing & Plans)".

### 2. Usage History date fix (2026/6/25 → 2026/6/16)

**Root cause:** The dashboard displayed `record.createdAt` (the row-insert date, which was 2026-06-25 when the seed ran) instead of `record.generatedAt` (the actual generation date).

**Fixed at 4 levels:**
1. `prisma/seed-cost.ts` — both WSTV Wildlife Reel records now set `generatedAt` AND `createdAt` to `2026-06-16`
2. `cost-dashboard.tsx` Usage History table — displays `record.generatedAt || record.createdAt`
3. `cost-dashboard.tsx` chart data — uses `generatedAt || createdAt`
4. `cost-dashboard.tsx` Manual Entry select dropdown — uses `generatedAt || createdAt`

**DB patch script:** `scripts/patch-usage-dates.js` — idempotent script that upserts the 2 known records with 2026-06-16 dates. Run with: `node scripts/patch-usage-dates.js`. Already applied to the delivered `db/custom.db`.

**Added "Diff" column** to Usage History showing tokens difference (actual - estimated) and cost difference, color-coded (amber if over, emerald if under).

### 3. Manual Actual Cost Entry — full 13-field form (cost-dashboard.tsx)

New full-featured form at the top of the Usage tab. Fields:
- Project title * (required)
- Animal / Story
- Model
- Mode (text-to-video / first-frame / first-and-last-frame / reference / extension)
- Resolution (720p / 1080p / 4K — drives width/height for 9:16 vertical)
- FPS (12 / 16 / 24 / 25 / 30)
- Duration (seconds)
- Estimated tokens (auto-computes from resolution × fps × duration if blank)
- Estimated cost (USD)
- Actual tokens
- Actual cost (USD)
- Generation date
- Status (generated-manually / planned / dry-run / cancelled)
- Notes

Saves via `POST /api/usage-records`. After save, the form clears and the new record immediately appears in Usage History below. Info banner: "Manual actual cost — user-entered after browser generation. Saved to local DB and appears in Usage History below. No real API connection."

### 4. Add Custom Preset button — wired to modal + POST /api/presets (production-workflow.tsx + client.tsx)

**Fixed fetch bug:** Was checking `d?.presets?.length` but API returns bare array. Now handles both.

**New "Add Custom Preset" modal** with 8 fields:
- Title * (required)
- Category
- Animal
- Environment / Biome
- Danger / Tension type
- Emotional tone
- Short notes (structure, timing beats)
- Prompt text * (required)

Saves via `POST /api/presets`. Persists after refresh.

**Each preset card now has:**
- Clickable card body — dispatches `wstv-apply-preset` custom event with the prompt text. The Generate tab listens for this event, populates the prompt box, switches to the Generate tab, and shows a success toast.
- "Copy Prompt" button — copies `promptTemplate` to clipboard
- "Copy Idea" button — copies name + category + animal + biome + danger + emotion + structure notes to clipboard
- Both copy buttons use `stopPropagation` so they don't trigger applyPreset

### 5. Phase 1+2 features verified intact

- ✅ Generate tab cleanup (Copy-Paste Prompt + AI Prompt Writer modes)
- ✅ Paid Zone 4-state lock (LOCKED → UNLOCKED+SafeModeON → UNLOCKED+GatesNotPassed → UNLOCKED+AllGatesPassed)
- ✅ Dry Run cost breakdown (rate × duration formula)
- ✅ 9-card Remaining Video Capacity grid (now with full breakdown)
- ✅ 3-Plan Comparison Calculator with cheapest-plan recommendation
- ✅ Workflow + Calendar info banners

## Safety invariants (all verified)

| Invariant | Status |
|---|---|
| Safe Mode ON by default | ✅ |
| Dry Run only | ✅ |
| No real Seedance API | ✅ |
| No external paid generation | ✅ |
| No API keys | ✅ |
| No `fetch('https://...')` added | ✅ |
| 10 pre-submission gates preserved | ✅ |
| SUBMIT_ONE_PAID_TASK still required | ✅ |
| bimal2026 client-side only | ✅ |

## How to run

```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000

**Optional — re-patch usage dates if needed:**
```bash
node scripts/patch-usage-dates.js
```
(This is idempotent and safe to run multiple times. Already applied to the delivered DB.)

## Test results (curl + dev server)

| Test | Result |
|---|---|
| HTTP 200 on all 12 API routes | ✅ |
| Both WSTV Wildlife Reel usage records show `generatedAt=2026-06-16`, `createdAt=2026-06-16` | ✅ |
| Budget snapshot returns all 9 capacity entries with `costUsdPerVideo`, `costJpyPerVideo`, `isEstimated`, `pricingNote`, `rateSource` | ✅ |
| POST /api/usage-records creates new record with correct `generatedAt` — appears immediately in Usage History | ✅ |
| POST /api/presets creates new preset — appears immediately in GET /api/presets | ✅ |
| Homepage SSR: Copy-Paste Prompt + Advanced Paid Controls Locked present | ✅ |
| Homepage SSR: SUBMIT_ONE_PAID_TASK NOT in SSR (0 matches — hidden by default) | ✅ |
| Homepage SSR: bimal2026 NOT in SSR (0 matches — client-side only) | ✅ |
| /api/settings returns `safeMode: true` | ✅ |
| /api/dry-run 720p Full 6s returns `estimatedCost: 0.36` | ✅ |
| No compile errors in dev server log | ✅ |

## Files modified in Phase 3

| File | Change |
|------|--------|
| `src/lib/pricing.ts` | Extended `CapacityEntry` interface with costUsdPerVideo, costJpyPerVideo, isEstimated, pricingNote, rateSource. Updated `calculateBudgetSnapshot()` to accept `defaultModelRate4k` + compute cost per video. 4K rate fallback to 1.5× 1080p if not verified. |
| `src/app/api/budget-snapshot/route.ts` | Pass `rate4k` from PricingModel DB to `calculateBudgetSnapshot()`. Updated "no active purchase" fallback with new capacity fields. |
| `src/components/dashboard/types.ts` | Added `CapacityEntryData` interface. Updated `BudgetSnapshotData` to use it for all 9 capacity fields. |
| `src/components/dashboard/cost-dashboard.tsx` | Rewrote 9 capacity cards with full breakdown. Added full-featured Manual Actual Cost Entry form (13 fields + save handler). Updated Usage History to display `generatedAt` + added Diff column. Updated chart data + select dropdown to use `generatedAt`. |
| `src/components/dashboard/production-workflow.tsx` | Fixed fetch bug. Added `showPresetModal` + `newPreset` state. Added `handleSavePreset()`, `copyPresetPrompt()`, `copyPresetIdea()`. Updated `applyPreset()` to dispatch `wstv-apply-preset` event. Added full modal UI + Copy buttons on each preset card. |
| `src/components/dashboard/client.tsx` | Added `wstv-apply-preset` event listener — populates Generate prompt box + switches to Generate tab + shows toast. |
| `prisma/seed-cost.ts` | Both WSTV Wildlife Reel records now set `generatedAt` AND `createdAt` to `2026-06-16`. |
| `scripts/patch-usage-dates.js` | NEW — idempotent script to patch existing DB usage records to 2026-06-16. Already applied to delivered DB. |

## Files NOT modified in Phase 3 (kept from Phase 1+2)

- `src/components/dashboard/step-prompt.tsx` (Phase 1 Generate cleanup — intact)
- `src/components/dashboard/step-paid.tsx` (Phase 2 4-state lock — intact)
- `src/components/dashboard/step-dryrun.tsx` (Phase 1 cost breakdown fix — intact)
- `src/app/page.tsx` (Phase 1 template fetch removal — intact)
- `prisma/schema.prisma` (no schema migration needed)
