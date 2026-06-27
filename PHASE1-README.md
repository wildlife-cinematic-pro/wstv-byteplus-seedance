# WSTV Seedance Dashboard — Phase 1 Safe Cleanup

This ZIP contains the Phase 1 safe cleanup changes. All safety invariants are preserved.

## What was changed

### 1. Generate Tab — Prompt Area Cleanup (`src/components/dashboard/step-prompt.tsx`)

**Removed clutter:**
- 8 hardcoded template cards (Predator Hunt, Ocean Migration, Forest Micro, Arctic Hunt, Jungle Canopy, Deep Sea, Desert Survival, River Crossing)
- 5 quick-fill dropdowns (Animal, Biome, Action, Camera, Lighting)
- 4 booster buttons (Cinematic, Audio, Time Codes, Optimize for Mini)
- Prompt Structure Guide (static text)
- DB Templates panel + Templates button
- Recent Prompts section

**Added two-mode toggle:**

**Mode A — Copy-Paste Prompt (default)**
- Large textarea with placeholder: "Paste your finished prompt here (from ChatGPT / Claude / GLM)..."
- Character count + progress bar
- Local quality analyzer (4 meters: Structure, Specificity, Sensory, Length — pure regex, no API)
- Model selector (Full / Mini) + Compare Models button

**Mode B — AI Prompt Writer (disabled placeholder)**
- Text: "Future AI Prompt Writer — disabled. Later this can connect to ChatGPT / Claude / GLM API."
- Disabled button: "Generate Prompt with AI"
- Note: "Safe Mode is ON · Dry Run only · No external API calls"
- **No network call. No API key. No real integration.**

### 2. Paid Zone Lock (`src/components/dashboard/step-paid.tsx` + `src/components/dashboard/client.tsx`)

**Default state:** Paid Zone is hidden behind "Advanced Paid Controls Locked" card.

**To unlock:**
1. Type `bimal2026` in the unlock phrase input
2. Click Unlock
3. Unlock state persists in `localStorage` (key: `wstv_paid_unlocked`)

**After unlock, all existing safety gates STILL apply:**
- Safe Mode must be OFF (server-side check at `/api/generate` returns 403 if ON)
- Dry run must pass
- All 10 pre-submission gates must pass
- User must type `SUBMIT_ONE_PAID_TASK` exactly
- 3-second countdown before submit enables

**⚠ Important:** The unlock phrase is NOT real security. Anyone with browser devtools can bypass it. It is only a UI hide to prevent accidental interaction with paid generation controls during normal Dry-Run / Planning workflow.

A "Lock" button is available in the unlocked Paid Zone to re-hide it.

### 3. Dry Run Cost Breakdown Fix (`src/components/dashboard/step-dryrun.tsx`)

**Before (misleading):**
```
Base (480p)        $0.18   ████████
Resolution ×2.0    $0.18   ████████
Duration           $0.04   ██
```
(The 3 rows didn't sum to the total, and "Duration = estimatedCost × 0.1" was meaningless.)

**After (honest):**
```
Cost Breakdown                    Dry-run estimate only. No real charge.
─────────────────────────────────────────────
Rate (Full · 720p)                $0.060/s
Duration                          × 6s
─────────────────────────────────────────────
Estimated cost                    $0.36

▶ How is the $0.060/s rate derived?
  480p base rate: $0.030/s
  720p multiplier: × 2.00
  Final rate: $0.060/s
  Formula: cost = rate[resolution] × duration
```

The displayed resolution now matches the user-selected resolution (previously always showed "Base (480p)").

### 4. Workflow + Calendar Info Banners (`src/components/dashboard/client.tsx`)

Added small info banners above the Workflow and Calendar tabs:

- **Workflow:** "Production planning tools — some sections are experimental. All data stays local."
- **Calendar:** "Local planning calendar — no Google Calendar connection. All data stays in your local SQLite DB."

No functional changes to either tab.

### 5. Page.tsx cleanup (`src/app/page.tsx`)

- Removed `db.promptTemplate.findMany()` call (templates no longer used)
- Removed `templates` field from initial data payload
- Fixed pre-existing TypeScript nullability error on `latestVideo.videoFileName`

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
| Unlock phrase client-side only | ✅ `bimal2026` not in SSR HTML |

## How to run

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Generate Prisma client (IMPORTANT — do not skip)
npx prisma generate

# 3. (Optional) Sync schema with DB
npx prisma db push

# 4. Start dev server
npm run dev
```

Open http://localhost:3000

## Verification checklist

After running, verify:

- [ ] Generate tab opens — prompt area is clean (no template cards, no quick-fill dropdowns)
- [ ] Mode toggle visible: "Copy-Paste Prompt" (default) and "AI Prompt Writer"
- [ ] Click "AI Prompt Writer" — shows disabled placeholder, no API call made
- [ ] Click "Copy-Paste Prompt" — large textarea + char count + quality meters
- [ ] Paste a prompt — char count updates, quality meters activate
- [ ] Run Dry Run — cost breakdown shows "Rate × Duration = Estimated Cost" (no more "Base (480p)" confusion)
- [ ] Scroll to Paid Zone — shows "Advanced Paid Controls Locked" by default
- [ ] Type wrong phrase → error message
- [ ] Type `bimal2026` → Paid Zone unlocks
- [ ] After unlock, Safe Mode is still ON → Paid Zone shows "Safe Mode is ON — Paid generation is disabled"
- [ ] Click "Lock" button → Paid Zone hides again
- [ ] Refresh browser → unlock state persists (localStorage)
- [ ] Workflow tab opens — info banner visible at top
- [ ] Calendar tab opens — info banner visible at top
- [ ] Cost tab opens
- [ ] Settings tab opens
- [ ] Top-right header still shows budget (e.g. "$0.00 / $150.00 budget")
- [ ] Settings save still updates header instantly

## Files modified in this phase

| File | Change |
|------|--------|
| `src/components/dashboard/step-prompt.tsx` | Full rewrite — removed templates/boosters/quick-fill, added Mode A/Mode B toggle |
| `src/components/dashboard/step-paid.tsx` | Added locked-state UI + Lock button; preserved all gates |
| `src/components/dashboard/step-dryrun.tsx` | Rewrote CostBreakdownSection — honest rate × duration formula |
| `src/components/dashboard/client.tsx` | Removed templates prop, added Paid Zone unlock state + handlers, added tab info banners |
| `src/app/page.tsx` | Removed promptTemplate fetch, fixed latestVideo nullability |

## What was NOT changed (deferred to future phases)

- Workflow tab Presets/Retry sub-tabs (still present, still non-functional — to be addressed in Phase 2)
- Calendar tab broken save buttons (still present — to be addressed in Phase 2)
- Prompt Versions "Save Version" button (still not wired up — to be addressed in Phase 2)
- DB `promptTemplate` table and `prisma/seed.ts` (unused now but kept in schema for safety)
