# PHASE4 Schema Planning — Future Real Seedance API Fields

**Status:** Documentation only. NO destructive migration in PHASE4.
**Safety:** All payload previews are stored in existing JSON/text fields (`dryRunResult`, `safetyWarnings`) or in browser/localStorage. No schema change required for PHASE4.

## Current VideoTask model (existing — NOT modified)

The existing `VideoTask` model in `prisma/schema.prisma` already has these fields that can absorb PHASE4 data without migration:

| Existing field | PHASE4 use |
|---|---|
| `modelType` (String) | Keep — legacy 'full'/'mini' |
| `modelId` (String) | **Reuse** — store the official Seedance model ID here (e.g., `dreamina-seedance-2-0-260128`) |
| `resolution` (String) | Keep — 480p/720p/1080p/4k |
| `duration` (Int) | Keep — 4–15 or -1 for auto |
| `aspectRatio` (String) | Keep — 9:16/16:9/1:1 |
| `dryRunResult` (String?) | **Reuse** — store the full Seedance payload preview JSON here |
| `safetyWarnings` (String?) | **Reuse** — store validation warnings here |
| `taskId` (String?) | **Reuse** — will store `provider_task_id` when real API is connected |
| `videoUrl` (String?) | **Reuse** — will store `content.video_url` (temp provider URL, 24h expiry) |
| `videoFileName` (String?) | **Reuse** — will store the permanent local filename after copy |
| `costEstimate` (Float?) | Keep — estimated cost |
| `costActual` (Float?) | Keep — actual cost from `usage.total_tokens` |
| `status` (String) | Keep — will extend with `queued`/`running`/`succeeded`/`failed`/`expired`/`cancelled` |

## Recommended future schema migration (NOT applied in PHASE4)

When the real Seedance API is connected in a future phase, add these fields to `VideoTask` via a safe additive migration (`prisma migrate dev --name add_seedance_api_fields`):

```prisma
model VideoTask {
  // ... existing fields ...

  // ─── PHASE4+ future: Official Seedance API fields ───
  generationMode         String?   // 'reference_mode' | 'frame_mode'
  // modelId already exists — will store official Seedance model ID
  providerTaskId         String?   // from POST response — the real BytePlus task ID
  // status already exists — will extend to include queued/running/succeeded/failed/expired/cancelled
  // duration already exists — supports -1 for auto
  // resolution already exists — 480p/720p/1080p/4k
  // aspectRatio already exists — renamed conceptually to "ratio"
  generateAudio          Boolean?  @default(false)
  watermark              Boolean?  @default(false)
  returnLastFrame        Boolean?  @default(true)
  callbackUrl            String?
  requestPayloadJson     String?   // the full JSON sent to BytePlus
  responsePayloadJson    String?   // the full JSON received from BytePlus
  outputVideoUrlTemp     String?   // provider's temp video URL (expires in 24h)
  outputVideoUrlStored   String?   // permanent storage URL after copy
  lastFrameUrl           String?   // provider's temp last-frame URL (if return_last_frame=true)
  errorCode              String?
  errorMessage           String?
  estimatedTokens        Int?      // from dry-run calculation
  actualTokens           Int?      // from response.usage.total_tokens
  // estimatedCost already exists
  // actualCost already exists
  // createdAt already exists
  completedAt            DateTime? // when status reached succeeded/failed/expired
}
```

## PHASE4 storage strategy (no migration needed)

In PHASE4, the payload preview JSON is:
1. **Built client-side** by `buildSeedancePayload()` in `src/lib/seedance-validation.ts`
2. **Displayed in the UI** via the `SeedancePayloadPreviewPanel` component (read-only, no save)
3. **NOT persisted to the database** — it's a live preview that updates as the user changes settings

When the user runs a dry-run, the existing `dryRunResult` field stores the validation result (which includes the validation log). The payload preview itself is recomputed on every render from the current form state.

## When to apply the migration

Apply the additive migration ONLY when:
1. You're ready to connect the real Seedance API
2. You need to persist `providerTaskId` for polling
3. You need to store the actual API response JSON
4. You need to track `completedAt` separately from `updatedAt`

Until then, PHASE4 works entirely with in-memory + localStorage + the existing `dryRunResult` JSON field.

## How to apply the migration (future)

```bash
# 1. Add the new fields to prisma/schema.prisma (all optional, all default null)
# 2. Run the additive migration (safe — no data loss):
npx prisma migrate dev --name add_seedance_api_fields
# 3. Regenerate the Prisma client:
npx prisma generate
```

This migration is **additive only** — it adds nullable columns to the existing table. Existing rows will have `null` for all new fields. No data is lost or transformed.
