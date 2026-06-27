# WSTV Seedance Dashboard — PHASE4 (Official Seedance 2.0 API Validation / Payload Preview)

This ZIP contains PHASE4 changes on top of Phase 1 + 2 + 3. All safety invariants are preserved. **No real API calls. No API keys. No paid submissions.**

## What was changed in PHASE4

### 1. New validation library: `src/lib/seedance-validation.ts`

Exports:
- `VALID_DURATION_MIN = 4`, `VALID_DURATION_MAX = 15`, `AUTO_DURATION = -1`
- `SEEDANCE_MODEL_IDS` — Standard / Fast / Mini official model IDs
- `MODEL_RESOLUTION_RULES` — per-model supported resolutions
- `MODEL_METADATA` — labels, descriptions, char limits per model
- `GENERATION_MODE_METADATA` — reference_mode vs frame_mode allowed roles
- `REFERENCE_LIMITS_SEEDANCE` — 9 images / 3 videos / 3 audios
- `isValidSeedanceDuration(duration)` — integer 4–15 or -1
- `getSupportedResolutions(modelId)` — returns allowed resolutions
- `isResolutionSupported(modelId, resolution)` — boolean check
- `validateSeedancePayload(payload)` — full validation (returns `{valid, errors, warnings}`)
- `buildSeedancePayload(formState)` — builds the JSON payload preview
- `SEEDANCE_TASK_STATUSES` — queued/running/cancelled/succeeded/failed/expired
- `CANCEL_DELETE_RULES` — per-status cancel/delete permissions
- `WSTV_DEFAULTS` — model/ratio/duration/resolution defaults
- `MEDIA_LIMITS` — image/video/audio size + duration limits
- `HUMAN_FACE_WARNING`, `FRAMES_NOT_SUPPORTED_NOTE`, `SEED_NOT_SUPPORTED_NOTE`, `CAMERA_FIXED_NOT_SUPPORTED_NOTE`

### 2. Updated `step-output.tsx` — official model selector + duration validation

- **3-way model selector**: Standard / Fast / Mini (official BytePlus model IDs)
- **Generation mode toggle**: Reference Mode (WSTV default) vs Frame Mode
- **Resolution cards**: now driven by `MODEL_RESOLUTION_RULES` — Fast/Mini only show 480p/720p
- **Duration**: slider 4–15 + "Auto (-1)" toggle. Validates `isValidSeedanceDuration()`
- **Seed field**: disabled, marked "FUTURE" - documented for some video flows, but not sent in the PHASE5.1 payload
- **FPS**: kept for display only, labeled "not in Seedance payload"
- Resolution rule note: "Seedance Standard supports 480p/720p/1080p/4k. Fast/Mini support 480p/720p."

### 3. Updated `step-references.tsx` — mode-aware role filtering + conflict detection

- `RefRow` now filters role dropdown based on `generationMode`:
  - `frame_mode`: only shows first_frame / last_frame
  - `reference_mode`: hides first_frame / last_frame, shows all reference-style roles
- Video and audio sections hidden in frame_mode
- Mode conflict warning (red Alert) when first_frame/last_frame mixed with reference roles
- Frame mode hint: "Only first_frame / last_frame image roles are allowed. If last_frame is used, first_frame is also required."
- Reference mode hint: "first_frame / last_frame roles are not allowed in reference mode."

### 4. Updated `dry-run/route.ts` — full Seedance validation

- Accepts new `seedanceModelId` + `generationMode` fields
- Duration validation: `isValidSeedanceDuration()` — 4–15 or -1 (auto)
- Resolution validation: `isResolutionSupported()` — model-specific rules
- Cost estimate: returns 0 for auto duration (-1), skips cost cap + budget checks
- Runs full `validateSeedancePayload()` — catches mode conflicts, audio-alone, last_frame without first_frame, reference counts, URL format
- All validation errors + warnings added to the validation log

### 5. New component: `src/components/dashboard/seedance-payload-preview.tsx`

Renders a "Seedance 2.0 API Validation & Payload Preview" card on the Generate tab with:
- **Live Payload Preview** (collapsible JSON) — built by `buildSeedancePayload()` from current form state. "Payload preview only — no real API call." label. Copy button.
- **Request Examples** (collapsible) — 6 static example payloads:
  - A. Text-only
  - B. Frame mode: first_frame
  - C. Frame mode: first_frame + last_frame
  - D. Reference mode: master + storyboard (WSTV default)
  - E. Reference mode: master + storyboard + audio
  - F. Reference mode: master + video + audio
- **Future Real API Lifecycle** (collapsible) — 8-step task flow, 6 task statuses, cancel/delete rules per status, 24-hour URL expiry warning
- **Media Limits & Warnings** (collapsible) — image/video/audio size + duration limits, human-face warning
- **Unsupported controls notes** — frames not supported, seed not active, camera_fixed not active
- Validation status badge (✓ Valid / ✗ N errors) + error/warning lists

### 6. Updated `client.tsx` — new state + props

- Added `seedanceModelId` state (default: `dreamina-seedance-2-0-260128`)
- Added `generationMode` state (default: `reference_mode`)
- `setSeedanceModelIdV()` — auto-clamps resolution when switching to Fast/Mini
- Passed new props to `<StepOutput>`, `<StepReferences>`, `<StepDryRun>`
- Renders `<SeedancePayloadPreviewPanel>` after `<StepDryRun>`

### 7. Updated `types.ts` — new types

- `SeedanceModelId` type (3 official model IDs)
- `GenerationMode` type (`'reference_mode' | 'frame_mode'`)
- `FRAME_MODE_ROLES` Set (`first_frame`, `last_frame`)
- `REFERENCE_MODE_INTERNAL_ROLES` Set (all WSTV internal roles that map to `reference_image`)
- Updated `REFERENCE_ROLES.image` — frame mode roles labeled "(Frame Mode)"

### 8. Schema planning: `PHASE4-SCHEMA-PLANNING.md`

Documents the recommended future schema migration for real API integration. **No migration applied in PHASE4** — payload preview is in-memory only. Existing `VideoTask` fields (`dryRunResult`, `modelId`, `taskId`, `videoUrl`) can absorb future API data.

## Validation logic summary

| Rule | Implementation |
|---|---|
| Duration 4–15 or -1 | `isValidSeedanceDuration()` in `seedance-validation.ts` |
| Model-specific resolution | `MODEL_RESOLUTION_RULES` + `isResolutionSupported()` |
| Mode conflict (frame vs reference) | `validateSeedancePayload()` checks role sets |
| Audio alone (no image/video) | `validateSeedancePayload()` — audio count > 0 requires image or video |
| last_frame without first_frame | `validateSeedancePayload()` — frame_mode rule |
| Image max 9 | `REFERENCE_LIMITS_SEEDANCE.reference_image` |
| Video max 3 | `REFERENCE_LIMITS_SEEDANCE.reference_video` |
| Audio max 3 | `REFERENCE_LIMITS_SEEDANCE.reference_audio` |
| Frames parameter blocked | Not included in `buildSeedancePayload()` output |
| Seed not active | Disabled in UI, not in payload |
| camera_fixed not active | Not in payload, documented as unsupported |
| Human-face warning | `HUMAN_FACE_WARNING` constant, shown in Media Limits panel |

## Safety invariants (all verified)

| Invariant | Status |
|---|---|
| Safe Mode ON by default | ✅ |
| Dry Run only | ✅ |
| No real Seedance API connected | ✅ |
| No API keys | ✅ (only `<ARK_API_KEY>` placeholder in a comment) |
| No `fetch('https://ark.ap-southeast...')` | ✅ |
| No external paid generation | ✅ |
| 10 pre-submission gates preserved | ✅ |
| SUBMIT_ONE_PAID_TASK still required | ✅ |
| bimal2026 client-side only | ✅ |
| Paid Zone locked by default | ✅ |

## How to run

```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000

## Test results

### Duration validation (15 tests)
| Duration | Expected | Result |
|---|---|---|
| 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 | pass | ✅ all pass |
| -1 (auto) | pass | ✅ pass |
| 3 (too low) | fail | ✅ fail — "Invalid Seedance duration..." |
| 16 (too high) | fail | ✅ fail — "Invalid Seedance duration..." |

### Resolution validation (10 tests)
| Model | Resolution | Expected | Result |
|---|---|---|---|
| Standard | 480p, 720p, 1080p, 4K | pass | ✅ all pass |
| Fast | 480p, 720p | pass | ✅ pass |
| Fast | 1080p, 4K | fail | ✅ fail — "1080p/4k is only supported by Seedance 2.0 Standard..." |
| Mini | 720p | pass | ✅ pass |
| Mini | 1080p, 4K | fail | ✅ fail — "1080p/4k is only supported by Seedance 2.0 Standard..." |

### Mode conflict validation (4 tests)
| Scenario | Expected | Result |
|---|---|---|
| master + storyboard (reference_mode) | pass | ✅ pass |
| first_frame + last_frame (frame_mode) | pass | ✅ pass |
| first_frame + reference_image (mixed) | fail | ✅ fail — "Seedance mode conflict..." |
| audio-only (no image/video) | fail | ✅ fail — "Reference audio requires at least one reference image or reference video." |

### Other tests
| Test | Result |
|---|---|
| All 8 API routes return HTTP 200 (dry-run returns 405 on GET — expected) | ✅ |
| Homepage SSR contains Seedance Model selector, Generation Mode, Reference Mode, Frame Mode, Payload preview label | ✅ |
| All 3 official model IDs present in SSR | ✅ |
| SUBMIT_ONE_PAID_TASK hidden in SSR (0 matches) | ✅ |
| bimal2026 hidden in SSR (0 matches) | ✅ |
| Safe Mode ON | ✅ |
| Dry-run 720p Full 6s = $0.36 | ✅ |
| No fetch to BytePlus API | ✅ |
| No `frames` parameter in payload | ✅ |
| Seed marked FUTURE/UNSUPPORTED | ✅ |
| No compile errors | ✅ |
| All tabs open (Cost, Workflow, Calendar, Settings) | ✅ |

## Files modified/created in PHASE4

| File | Change |
|------|--------|
| `src/lib/seedance-validation.ts` | **NEW** — full validation library (constants, rules, functions, payload builder) |
| `src/components/dashboard/seedance-payload-preview.tsx` | **NEW** — payload preview + examples + lifecycle + media warnings panel |
| `src/components/dashboard/step-output.tsx` | Rewrote — 3-way model selector, generation mode toggle, duration 4–15/-1, model-specific resolution, seed disabled |
| `src/components/dashboard/step-references.tsx` | Updated — mode-aware role filtering, mode conflict warning, hide video/audio in frame_mode |
| `src/components/dashboard/step-dryrun.tsx` | Updated — accepts seedanceModelId + generationMode props, passes to API |
| `src/components/dashboard/client.tsx` | Updated — seedanceModelId + generationMode state, passes to children, renders PayloadPreviewPanel |
| `src/components/dashboard/types.ts` | Updated — SeedanceModelId, GenerationMode types, FRAME_MODE_ROLES, REFERENCE_MODE_INTERNAL_ROLES |
| `src/app/api/dry-run/route.ts` | Updated — full Seedance validation, -1 duration support, model-specific resolution, mode conflict detection |
| `PHASE4-SCHEMA-PLANNING.md` | **NEW** — documents future schema migration for real API |

## Files NOT modified (kept from Phase 1+2+3)

- `src/components/dashboard/step-prompt.tsx` (Phase 1 Generate cleanup — intact)
- `src/components/dashboard/step-paid.tsx` (Phase 2 4-state lock — intact)
- `src/components/dashboard/cost-dashboard.tsx` (Phase 2+3 capacity cards + manual entry — intact)
- `src/components/dashboard/production-workflow.tsx` (Phase 3 preset modal — intact)
- `prisma/schema.prisma` (no migration — PHASE4 is payload preview only)
- `prisma/seed-cost.ts`, `scripts/patch-usage-dates.js` (Phase 3 — intact)
