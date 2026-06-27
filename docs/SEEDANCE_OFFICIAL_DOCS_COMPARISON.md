# Seedance Official Docs Comparison

Research date: 2026-06-27

This document compares the current WSTV Seedance Dashboard against the official BytePlus ModelArk Seedance 2.0 documentation. It is a PHASE5.1 planning and validation artifact only.

## Official Sources Researched

- ModelArk Overview: https://docs.byteplus.com/en/docs/ModelArk/1099455
- ModelArk Quick start / authentication flow: https://docs.byteplus.com/en/docs/ModelArk/1399008
- Dreamina Seedance 2.0 series tutorial: https://docs.byteplus.com/en/docs/ModelArk/2291680
- Dreamina Seedance 2.0 series prompt guide: https://docs.byteplus.com/en/docs/ModelArk/2222480
- Video generation tutorial / API examples: https://docs.byteplus.com/en/docs/ModelArk/2298881
- Model list: https://docs.byteplus.com/en/docs/ModelArk/1330310
- Pricing: https://docs.byteplus.com/en/docs/ModelArk/1544106
- Region availability: https://docs.byteplus.com/en/docs/ModelArk/2191806

## Quickstart Package Status

The requested `modelark_seedance2.0_quickstart_package.zip` was not available in this checkout. No bundled `README.md`, `python/demo_standard.py`, `python/preview.html`, `scripts/init_dev_env/setup_mac.sh`, or `scripts/init_dev_env/setup_windows.bat` files were found locally.

Existing WSTV PHASE5 notes and UI panels still describe the quickstart package as reference material only. This PR does not execute demo scripts, does not create an API key, and does not make a real ModelArk request.

## Safety Summary

- No real BytePlus / Seedance API is connected.
- No `ARK_API_KEY` is committed or added.
- No API key input fields are added.
- No real paid task execution is enabled.
- Safe Mode ON by default is preserved.
- Paid Zone locked by default is preserved.
- Dry Run / Planning Mode is preserved.
- Payload Preview only is preserved.
- Endpoint URLs remain documentation-only warning/reference text.
- Anything involving real API integration is PHASE6 FUTURE, not PHASE5.1.

## Comparison Table

| Official requirement | Current repo status: OK / Missing / Wrong / Future Phase | Repo file(s) | Recommended patch |
|---|---|---|---|
| BytePlus account is required before ModelArk use. | OK | `src/components/dashboard/official-quickstart-reference.tsx`, `PHASE5-README.md` | Keep as safety checklist item. |
| ModelArk access is required. | OK | `src/components/dashboard/official-quickstart-reference.tsx` | Keep documented only. |
| Region-specific base URL is required. Official docs list `ap-southeast-1` as `https://ark.ap-southeast.bytepluses.com/api/v3` and `eu-west-1` as `https://ark.eu-west.bytepluses.com/api/v3`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/seedance-payload-preview.tsx` | Keep endpoint URLs inside warning/reference panels only; do not call them before PHASE6. |
| Seedance models must be activated in the ModelArk console before calling. | OK | `src/components/dashboard/official-quickstart-reference.tsx`, `PHASE5-README.md` | Keep documented only. |
| Seedance 2.0 activation requires prepaid resource package or sufficient account setup per official tutorial. | OK | `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/resource-pack-billing.tsx`, `src/lib/seedance-validation.ts` | Keep Paid Zone locked; verify console state before PHASE6. |
| `ARK_API_KEY` is required for real API calls. | Future Phase | `src/components/dashboard/official-quickstart-reference.tsx`, `PHASE5-README.md` | PHASE6 only. Do not add key, env loading, or key input in PHASE5.1. |
| API key should be stored server-side, typically in an environment variable such as `ARK_API_KEY`. | Future Phase | `src/components/dashboard/official-quickstart-reference.tsx` | PHASE6 only. Keep warnings; no key committed. |
| Reference media URLs must be publicly accessible for real calls. | OK | `src/lib/seedance-validation.ts`, `src/app/api/dry-run/route.ts`, `src/components/dashboard/official-quickstart-reference.tsx` | Keep HTTPS/public URL warnings. Future support for `asset://` and Base64 can be PHASE6. |
| BytePlus TOS public-read storage is recommended for media references. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx` | Patched media notes to mention public-read storage. |
| Create task endpoint: `POST /contents/generations/tasks`. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/seedance-payload-preview.tsx` | Documentation only until PHASE6. Do not call the endpoint. |
| Get task endpoint: `GET /contents/generations/tasks/{id}`. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx` | Documentation only until PHASE6. |
| List task endpoint: `GET /contents/generations/tasks`. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx` | Documentation only until PHASE6. |
| Delete/cancel task endpoint: `DELETE /contents/generations/tasks/{id}`. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx` | Documentation only until PHASE6. |
| Required headers include `Content-Type: application/json` and `Authorization: Bearer $ARK_API_KEY` for real calls. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx` | Keep placeholder warning only; no real key or auth implementation in PHASE5.1. |
| Async flow is create task -> provider task id -> poll -> `succeeded` / `failed` -> `content.video_url`. | OK | `src/components/dashboard/seedance-payload-preview.tsx`, `src/components/dashboard/official-quickstart-reference.tsx` | Keep documented. Implement real persistence/polling in PHASE6 only. |
| Polling interval examples use 10 seconds; quickstart references also use 30 seconds. | OK | `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/seedance-payload-preview.tsx` | Keep 10-30 second planning guidance. |
| Output task data and original output URLs are retained for only 24 hours. | OK | `src/components/dashboard/seedance-payload-preview.tsx`, `src/components/dashboard/official-quickstart-reference.tsx` | Keep immediate-copy warning. PHASE6 should copy provider URLs to permanent storage. |
| Save `content.video_url` and `content.last_frame_url` when returned. | OK | `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/seedance-payload-preview.tsx` | Keep as future lifecycle requirement. |
| Usage response fields include actual token usage such as `usage.completion_tokens`; docs/examples may also expose other usage fields. | OK | `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/seedance-payload-preview.tsx`, `src/components/dashboard/resource-pack-billing.tsx` | PHASE6 should persist all returned `usage` fields and base actual cost on returned completion tokens. |
| `callback_url` can receive status-change POST callbacks matching retrieve-task response shape. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx` | Payload builder supports optional `callback_url`; no webhook route should be added before PHASE6. |
| Standard model ID is `dreamina-seedance-2-0-260128`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/types.ts` | Keep. |
| Fast model ID is `dreamina-seedance-2-0-fast-260128`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/types.ts` | Keep. |
| Mini model ID is `dreamina-seedance-2-0-mini-260615`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/types.ts` | Keep. |
| Standard supports 480p, 720p, 1080p, and 4k. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/step-output.tsx` | Keep. |
| Fast supports 480p and 720p only. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/step-output.tsx` | Keep. |
| Mini supports 480p and 720p only. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/step-output.tsx` | Keep. |
| Seedance 2.0 duration supports integer 4-15 seconds or `-1` auto where applicable. | OK | `src/lib/seedance-validation.ts`, `src/app/api/dry-run/route.ts` | Keep. |
| Supported ratios include `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9`, and `adaptive`; 9:16 is supported. | OK | `src/lib/seedance-validation.ts`, `src/app/api/dry-run/route.ts` | Patched `VALID_RATIOS` and dry-run to use the full official set while preserving WSTV 9:16 default. |
| Supported content block types include `text`, `image_url`, `video_url`, and `audio_url`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx` | Keep. |
| Supported roles include `reference_image`, `reference_video`, `reference_audio`, `first_frame`, and `last_frame`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx` | Keep. |
| Reference image limit is 0-9. | OK | `src/lib/seedance-validation.ts`, `src/app/api/dry-run/route.ts` | Keep. |
| Reference video limit is 0-3. | OK | `src/lib/seedance-validation.ts`, `src/app/api/dry-run/route.ts` | Keep. |
| Reference audio limit is 0-3. | OK | `src/lib/seedance-validation.ts`, `src/app/api/dry-run/route.ts` | Keep. |
| Audio-only and text+audio-only submissions are unsupported; audio references need image or video context. | OK | `src/lib/seedance-validation.ts`, `src/app/api/dry-run/route.ts` | Keep. |
| `generate_audio=true` asks Seedance to generate audio. WSTV default final preview payloads should use native audio ON. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx`, `src/components/dashboard/official-quickstart-reference.tsx`, `PHASE5-README.md` | Confirmed and patched README default to `generate_audio=true`. |
| `watermark` controls whether provider watermark is included. WSTV default is `false`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx`, `src/components/dashboard/official-quickstart-reference.tsx` | Keep. |
| `return_last_frame=true` returns the last-frame URL when supported. WSTV default is `true`. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx`, `src/components/dashboard/official-quickstart-reference.tsx` | Keep. |
| Prompt guide recommends structured shot/action/camera guidance; exact per-second timing may not be reliable. | OK | `src/app/api/dry-run/route.ts`, `src/components/dashboard/step-prompt.tsx`, `worklog.md` | Keep prompt length warning-only; avoid hard API blocks for long cinematic prompts. |
| Negative prompt parameter was not found in the researched Seedance 2.0 video docs. | OK | `src/components/dashboard/step-prompt.tsx`, `src/lib/seedance-validation.ts` | Keep no negative-prompt field in PHASE5.1. Use prompt text exclusions only. |
| `seed` is documented for some video generation flows. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx`, `src/components/dashboard/step-output.tsx` | Patched copy: `seed` stays inactive in PHASE5.1 and should be evaluated in PHASE6 before entering payloads. |
| `camera_fixed` is documented for some video generation flows. | Future Phase | `src/lib/seedance-validation.ts`, `src/components/dashboard/seedance-payload-preview.tsx` | Patched copy: `camera_fixed` stays inactive in PHASE5.1 and should be evaluated in PHASE6 before entering payloads. |
| Real API integration must create paid tasks only after explicit final confirmation and server-side auth. | Future Phase | `src/app/api/generate/route.ts`, `src/components/dashboard/step-paid.tsx`, `src/components/dashboard/client.tsx` | Kept mock route behind Safe Mode; relabeled it as PHASE5.1 simulation with no real BytePlus call. |
| Prompt length guidance should not be a hard block unless official API docs define a hard limit. | OK | `src/app/api/dry-run/route.ts`, `src/app/api/generate/route.ts`, `src/components/dashboard/step-prompt.tsx`, `src/components/dashboard/step-dryrun.tsx` | Patched generate simulation route to warning-only. |
| Pricing depends on token rate and token consumption; higher resolution and video input cost more. | OK | `src/components/dashboard/resource-pack-billing.tsx`, `src/lib/seedance-validation.ts`, `src/lib/pricing.ts` | Keep estimates clearly labeled; PHASE6 should reconcile with returned usage. |
| Only successful generations are charged; moderation or generation failures are not charged per pricing docs. | Future Phase | `src/components/dashboard/resource-pack-billing.tsx`, `src/app/api/generate/route.ts` | PHASE6 should record actual provider status and billing outcome. PHASE5.1 remains simulation. |
| Actual token consumption should come from returned usage fields, especially `usage.completion_tokens`. | Future Phase | `src/components/dashboard/resource-pack-billing.tsx`, `src/app/api/generate/route.ts`, `prisma/schema.prisma` | PHASE6 should persist provider usage JSON and actual cost; no schema migration in PHASE5.1. |
| Standard/Fast/Mini pricing and resource packs are separated by model. | OK | `src/components/dashboard/resource-pack-billing.tsx`, `src/lib/seedance-validation.ts` | Keep model-specific pack warnings. |
| WSTV active pack notes: Standard pack purchased 2026-06-16, $30.10, 7,000,000 tokens, expires 2026-09-14, Standard only. | OK | `src/lib/seedance-validation.ts`, `src/components/dashboard/resource-pack-billing.tsx` | Treat as local WSTV planning data. Verify in BytePlus console before PHASE6 paid use. |
| Generated provider URLs must be copied to permanent storage before expiry. | Future Phase | `src/components/dashboard/official-quickstart-reference.tsx`, `src/components/dashboard/seedance-payload-preview.tsx` | PHASE6 should add storage copy workflow before enabling paid generation. |
| Safe Mode / Dry Run / Payload Preview only should remain the PHASE5.1 behavior. | OK | `src/components/dashboard/client.tsx`, `src/components/dashboard/step-paid.tsx`, `src/app/api/generate/route.ts` | Keep default locks and mock route. |
| Build/runtime artifacts and secrets should remain ignored. | OK | `.gitignore` | Existing ignore rules cover `.env`, `.env.*`, `node_modules/`, `.next/`, `db/`, `server/`, `static/`, `cache/`, and `trace`. |

## Required Safe Patches Applied

- WSTV native audio default remains ON in final preview payloads: `generate_audio=true`.
- `buildSeedancePayload` default remains `generateAudio = true`.
- Official quickstart reference displays `generate_audio: true`.
- Payload preview examples use `generate_audio: true`.
- README references that describe WSTV defaults now use `generate_audio=true`.
- Official ratios were expanded from WSTV's narrow subset to the full documented Seedance 2.0 set.
- Prompt length is warning-only in both dry-run and simulated generate paths.
- The generate route is clearly labeled as PHASE5.1 simulation/mock and returns `simulation: true`, `realApiConnected: false`.
- Real API endpoints remain documentation-only.
- `seed` and `camera_fixed` are described as inactive PHASE5.1 controls that require PHASE6 evaluation.

## Remaining PHASE6 Future Work

- Add server-side environment handling for `ARK_API_KEY` only after explicit PHASE6 approval.
- Implement real create task call to `POST /contents/generations/tasks`.
- Persist provider task IDs, raw request JSON, raw response JSON, provider status, and provider error payloads.
- Poll `GET /contents/generations/tasks/{id}` every 10-30 seconds or implement `callback_url` webhook handling.
- Copy `content.video_url` and `content.last_frame_url` to permanent storage before the 24-hour provider URL expiry.
- Persist all returned usage fields, including `usage.completion_tokens`, for actual cost tracking.
- Reconcile resource-pack estimates against actual BytePlus console billing.
- Verify active resource pack and account balance in BytePlus console before any paid task.
- Decide whether to expose `seed`, `camera_fixed`, `callback_url`, `asset://`, and Base64 media support.
- Add task cancellation/deletion handling only after real task persistence exists.
- Keep Safe Mode and explicit paid confirmation gates even after PHASE6 integration is implemented.
