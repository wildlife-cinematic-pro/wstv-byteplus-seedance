# WSTV Seedance Dashboard — PHASE5 (Official Quickstart Reference / Safety Documentation)

This ZIP contains PHASE5 changes on top of Phase 1–4. All safety invariants are preserved. **No real API calls. No API keys. No paid submissions. No demo scripts executed.**

## What was changed in PHASE5

### 1. New component: `src/components/dashboard/official-quickstart-reference.tsx`

Renders an "Official Seedance 2.0 Quickstart Reference — PHASE5 Only" panel on the Generate tab with:

- **Main description**: "This quickstart package is official BytePlus ModelArk reference for future real API integration. It should not be executed while WSTV is in Safe Mode / Dry Run Mode. `demo_standard.py` can create real paid generation tasks if `ARK_API_KEY` is configured."
- **Warning badge**: "Reference only — do not run the official Python demo from this dashboard."
- **3 model ID cards**: Standard / Fast / Mini with official BytePlus model IDs, quality labels, and supported resolutions
- **WSTV defaults confirmation**: model=Standard, mode=reference_mode, ratio=9:16, duration=15, resolution=720p, generate_audio=false, watermark=false, return_last_frame=true
- **4K warning**: "4K is Standard-only and may have lower concurrency / higher cost. Use 720p for normal WSTV testing."
- **Quickstart Safety Checklist** (12 items, collapsible): BytePlus account, ARK_API_KEY, model activation, prepaid package, public URLs, TOS storage, task ID, polling 10–30s, save video_url, save last_frame_url, save usage tokens, API key server-side only
- **Safety Warnings** (3 warnings, collapsible):
  - Demo warning: "Do not run official Python demo from inside the dashboard. It can create real paid ModelArk generation tasks."
  - Asset URL warning: "Future real API requires public media URLs. Use BytePlus TOS public-read storage or another public CDN. Do not use private local file paths."
  - API key warning: "ARK_API_KEY must never be committed to GitHub, shown in frontend, pasted into browser code, or stored in public files."
- **Future PHASE6 Real API Integration Checklist** (16 items, collapsible): store API key server-side, create Next.js API route, never expose key, POST create task, save provider_task_id, poll GET every 10–30s, save status, save video_url, save last_frame_url, copy to permanent storage, save usage tokens, calculate cost, store raw JSON, retry/error handling, final confirmation
- **Official endpoints reference** (documentation only — NOT called): POST/GET/DELETE `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks`

### 2. Updated `seedance-payload-preview.tsx` — renamed lifecycle to PHASE6 + added endpoint note

- Renamed "Future Real API Lifecycle" → "Future PHASE6 Real API Lifecycle"
- Added "Payload Preview only — no real API call." label
- Added future endpoint note: `POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks` with "⚠ Do not call this endpoint. ARK_API_KEY is not configured. Safe Mode is ON."

### 3. Updated `step-prompt.tsx` — word count + character count + no 3500 hard block

- Prompt counter now shows **both word count and character count**: "N words | N / limit chars"
- Over-limit color changed from **red (hard block)** to **amber (warning)**
- Over-limit text shows: "(over limit — warning, not blocked)"
- CharProgressBar: over-limit bar color changed from `bg-red-500` to `bg-amber-500`
- Label changed from "limit" to "recommended limit"

### 4. Updated `dry-run/route.ts` — prompt length is now a warning, not an error

- Prompt length exceeding char limit no longer adds to `errors` array (was a hard block)
- Now adds to `validationLog` as a warning: "⚠️ Prompt: N/limit chars — OVER RECOMMENDED LIMIT (warning, not blocked)"
- Added word count to validation log: "ℹ️ Prompt: N words"
- A 3500-character prompt now passes dry-run with a warning instead of failing

### 5. Updated `client.tsx` — renders OfficialQuickstartReference panel

- Added import for `OfficialQuickstartReference`
- Renders `<OfficialQuickstartReference />` after `<SeedancePayloadPreviewPanel />` on the Generate tab

## Official quickstart package inspection (READ-ONLY)

The official `modelark_seedance2.0_quickstart_package.zip` was inspected for API reference only. **No scripts were executed.**

Files reviewed:
- `README.md` — overview + tutorial link
- `python/demo_standard.py` — confirmed official API structure:
  - Model ID: `dreamina-seedance-2-0-260128` ✓
  - Content blocks: `image_url` / `video_url` / `audio_url` / `text` with `role` ✓
  - Top-level params: `model`, `content`, `generate_audio`, `ratio`, `duration`, `watermark` ✓
  - Task flow: create → task_id → poll (30s) → succeeded → `content.video_url` ✓
  - API key via `ARK_API_KEY` env var, never hardcoded ✓
  - Reference URLs use BytePlus TOS public-read storage ✓
- `scripts/init_dev_env/setup_mac.sh` — environment setup (NOT executed, contents inspected only)

**No scripts were run. No API calls were made. No API keys were added.**

## Safety summary

| Invariant | Status |
|---|---|
| Safe Mode ON by default | ✅ |
| Dry Run only | ✅ |
| No real Seedance API connected | ✅ |
| No ARK_API_KEY in .env or any file | ✅ |
| No API key input fields in UI | ✅ |
| No `fetch('https://ark.ap-southeast...')` | ✅ |
| `demo_standard.py` NOT executed | ✅ |
| `setup_mac.sh` NOT executed | ✅ |
| `run_demo.sh` NOT executed | ✅ |
| No real paid generation tasks | ✅ |
| Paid Zone locked by default | ✅ |
| 10 pre-submission gates preserved | ✅ |
| SUBMIT_ONE_PAID_TASK still required | ✅ |
| bimal2026 client-side only | ✅ |
| No 3500-char hard block | ✅ (converted to warning) |
| Word count + character count displayed | ✅ |

## How to run

```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000

## Test results (16 validation tests + safety tests — all pass)

### PHASE5 new features
| Test | Result |
|---|---|
| Official Quickstart Reference panel appears | ✅ |
| Panel says "PHASE5 Only" | ✅ |
| Future real integration checklist labeled "PHASE6" | ✅ |
| Quickstart Safety Checklist (12 items) present | ✅ |
| Demo warning present | ✅ |
| Asset URL warning present | ✅ |
| API key warning present | ✅ |
| Payload Preview label present | ✅ |
| Future endpoint note present | ✅ |
| Word count displayed in prompt counter | ✅ |
| 3500-char prompt does NOT hard-block dry-run | ✅ (passed=True, warning shown) |

### PHASE4 validation (all still work)
| Test | Result |
|---|---|
| WSTV default: 9:16 / 15s / 720p / Standard / reference_mode | ✅ pass |
| Standard allows 1080p/4K | ✅ pass |
| Fast blocks 1080p/4K | ✅ fail |
| Mini blocks 1080p/4K | ✅ fail |
| Duration 4 passes | ✅ pass |
| Duration 15 passes | ✅ pass |
| Duration -1 (auto) passes | ✅ pass |
| Duration 3 fails | ✅ fail |
| master+storyboard (reference_mode) passes | ✅ pass |
| first+last_frame (frame_mode) passes | ✅ pass |
| Mixed first_frame+reference_image fails | ✅ fail |
| Audio-only reference fails | ✅ fail |

### Safety
| Test | Result |
|---|---|
| Safe Mode ON | ✅ |
| Paid Zone locked | ✅ |
| No ARK_API_KEY in .env | ✅ |
| No API key input fields | ✅ |
| No fetch to BytePlus API | ✅ |
| No demo scripts executed | ✅ |
| All tabs open (Cost, Workflow, Calendar, Settings) | ✅ |
| No compile errors | ✅ |

## Files modified/created in PHASE5

| File | Change |
|------|--------|
| `src/components/dashboard/official-quickstart-reference.tsx` | **NEW** — Official Quickstart Reference panel with PHASE5 label, 12-item safety checklist, 3 safety warnings, 16-item PHASE6 checklist, endpoint reference |
| `src/components/dashboard/seedance-payload-preview.tsx` | Updated — renamed lifecycle to "Future PHASE6", added "Payload Preview only" label, added future endpoint note with "do not call" warning |
| `src/components/dashboard/step-prompt.tsx` | Updated — word count + character count display, over-limit changed from red (hard block) to amber (warning), CharProgressBar color fix |
| `src/app/api/dry-run/route.ts` | Updated — prompt length converted from hard error to soft warning, word count added to validation log |
| `src/components/dashboard/client.tsx` | Updated — imports + renders OfficialQuickstartReference panel |

## Files NOT modified (kept from Phase 1–4)

- `src/lib/seedance-validation.ts` (Phase 4 — intact, matches official quickstart)
- `src/components/dashboard/step-output.tsx` (Phase 4 — intact)
- `src/components/dashboard/step-references.tsx` (Phase 4 — intact)
- `src/components/dashboard/step-paid.tsx` (Phase 2 — intact)
- `src/components/dashboard/cost-dashboard.tsx` (Phase 2+3 — intact)
- `src/components/dashboard/production-workflow.tsx` (Phase 3 — intact)
- `prisma/schema.prisma` (no migration)
- `prisma/seed-cost.ts`, `scripts/patch-usage-dates.js` (Phase 3 — intact)
