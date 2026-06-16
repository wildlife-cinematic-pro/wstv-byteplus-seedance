# WSTV BytePlus Seedance Toolkit

This is a safety-first Python CLI toolkit for preparing 15-second vertical 9:16 wildlife video generation requests for the official BytePlus ModelArk Dreamina Seedance 2.0 API.

## Current Readiness Status

Status: **SAFE MANUAL STATUS CHECKING AND DOWNLOAD ENABLED** for existing verified Seedance task IDs and completed task outputs.

Dry runs, local validation, cost previews, tests, and documentation are ready. A real paid create-task request is locked by default and requires `--submit`, `--capture-create-response`, `--max-cost-usd`, `--confirm SUBMIT_ONE_PAID_TASK`, a local `ARK_API_KEY`, duplicate-check pass, writable task log, and the verified redacted sample file. The create-task response task ID field is verified as `$.id`, and succeeded task output URL is verified as `$.content.video_url`.

No command in the normal setup makes a paid API call.

## Official Values Verified On 2026-06-15

- Base URL: `https://ark.ap-southeast.bytepluses.com/api/v3`
- API key env convention: `ARK_API_KEY`
- Create task: `POST /contents/generations/tasks`
- Create-task response task ID: `$.id`
- Retrieve task: `GET /contents/generations/tasks/{id}`
- List tasks: `GET /contents/generations/tasks`
- Cancel/delete task: `DELETE /contents/generations/tasks/{id}`
- Model IDs: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`
- Task statuses: `queued`, `running`, `cancelled`, `succeeded`, `failed`, `expired`
- Output URL field: `$.content.video_url`
- Output video URL is deleted after 24 hours; download promptly after success.

Console billing and returned `usage.completion_tokens` are final.

## Safety Warning About Paid Calls

Never run `--submit` until you have:

1. Confirmed Console model access, region, rate limits, billing, and budget.
2. Added a local API key through your shell or password manager.
3. Added the redacted official Playground REST sample.
4. Run `scripts/doctor.py`.
5. Run a dry run and reviewed the cost preview.

The toolkit never retries a paid create-task request automatically.

## macOS Setup

```bash
cd wstv-byteplus-seedance
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Optional but recommended for downloaded video verification:

```bash
brew install ffmpeg
```

## Environment Setup

Do not create a real `.env` unless you understand that it is local-only and ignored by Git.

Template:

```bash
cp .env.example .env
```

Preferred key variable:

```text
ARK_API_KEY=
```

Deprecated fallback:

```text
BYTEPLUS_API_KEY
```

The fallback is supported temporarily for migration, but scripts warn and never print either value.

## API-Key Security

- Never paste keys into chat, GitHub, screenshots, logs, or docs.
- Never commit `.env`.
- Rotate/revoke a key immediately if it may have leaked.
- Use a key scoped to the minimum project/permission possible.
- Treat signed output URLs as sensitive; logs redact query strings.

## Doctor Command

Local-only check, no API request:

```bash
python3 scripts/doctor.py
```

Expected without a local key: `BLOCKED`, not unsafe success. With dependencies, a local key, and the verified task ID field, status checking can pass local gates.

## Dry-Run Example

This makes no network request:

```bash
python3 scripts/generate_video.py \
  --prompt-file prompts/wstv-wildlife-template.txt \
  --image-url "https://example.com/master-image.jpg" \
  --duration 15 \
  --ratio 9:16 \
  --resolution 720p
```

It saves a redacted request preview in `outputs/request-previews/`.

## Cost-Preview Example

```bash
python3 scripts/cost_calculator.py \
  --model dreamina-seedance-2-0-260128 \
  --duration 15 \
  --resolution 720p \
  --ratio 9:16 \
  --max-cost-usd 3
```

The estimate is not final billing. Confirm actual spend in BytePlus Console and task `usage`.

## Controlled One-Task Response Capture

Production automation, auto-polling, and auto-download remain blocked. Paid create-task calls are still allowed only through the manually approved response-capture flow for `dreamina-seedance-2-0-260128`.

Do not run this command until `scripts/doctor.py` shows the expected manual approval state and you have confirmed the budget in BytePlus Console:

```bash
python3 scripts/generate_video.py \
  --prompt-file prompts/wstv-wildlife-template.txt \
  --image-url "https://example.com/master-image.jpg" \
  --duration 15 \
  --ratio 9:16 \
  --resolution 720p \
  --max-cost-usd 3 \
  --confirm SUBMIT_ONE_PAID_TASK \
  --capture-create-response \
  --submit
```

The command saves a redacted request preview and a redacted create-task response capture. It does not auto-poll or auto-download. No automatic retry is allowed. If a submit call fails or times out, check the local task log and BytePlus Console before trying again.

See `docs/ONE_PAID_RESPONSE_CAPTURE.md`.

## One-Command Pipeline

Dry-run only by default:

```bash
python3 scripts/wstv_pipeline.py --prompt-file data/example.txt --out downloads/example.mp4
```

Paid submit still requires explicit approval:

```bash
python3 scripts/wstv_pipeline.py \
  --prompt-file data/example.txt \
  --out downloads/example.mp4 \
  --submit \
  --max-cost-usd 3 \
  --confirm SUBMIT_ONE_PAID_TASK
```

See `docs/ONE_COMMAND_PIPELINE.md`.

## Reference Image URLs

Use public HTTPS direct image URLs only, for example:

```text
https://images.wildstoriestv.com/elephant_mud_master.png
```

The toolkit validates `--image-url` before dry-run preview or paid submit. Local image upload and BytePlus Files API upload are intentionally not implemented yet. See `docs/REFERENCE_IMAGE_URLS.md`.

## Task Status Process

One-shot status check for an existing task ID:

```bash
python3 scripts/check_task.py TASK_ID
```

Bounded polling:

```bash
python3 scripts/check_task.py TASK_ID --poll --interval 10 --timeout 900
```

Unknown statuses are treated cautiously and never as success.

## Download Process

Save full private completed task responses only under `outputs/private-responses/`; this path is gitignored. Do not commit signed output URLs.

After a task succeeds, use the verified `$.content.video_url` promptly:

```bash
python3 scripts/download_video.py \
  --url "SIGNED_OUTPUT_URL" \
  --out downloads/wstv-output.mp4 \
  --expect-duration 15 \
  --expect-width 720 \
  --expect-height 1280
```

Or pass a local completed task response JSON that still contains `content.video_url`:

```bash
python3 scripts/download_video.py \
  --response-json outputs/private-responses/TASK_ID.json \
  --out downloads/wstv-output.mp4 \
  --expect-duration 15 \
  --expect-width 720 \
  --expect-height 1280
```

Do not commit raw task responses that contain signed URLs. Do not commit downloaded `.mp4` files or verification sidecars.

The downloader streams to a temporary file, rejects HTML/error pages, saves atomically, and writes verification metadata.

## Troubleshooting

- `Overall: BLOCKED` from doctor is expected until the official sample and local key exist.
- `BYTEPLUS_BASE_URL` must be `https://ark.ap-southeast.bytepluses.com/api/v3`.
- `ARK_API_KEY is missing` means no API call can run.
- `Duplicate active/recent request fingerprint found` means the same paid task may already have been submitted.
- `Cost is UNVERIFIED` means do not submit.
- Store private full task responses in `outputs/private-responses/`.
- Store downloaded videos in `downloads/`.

## BytePlus Console Verification Checklist

See `docs/CONSOLE_CHECKLIST.md`.

## Actual Billing Audit

After any paid task, compare:

- local request fingerprint
- BytePlus task ID
- returned `usage.completion_tokens`
- Console usage/billing page
- downloaded output path

Record only safe metadata in `data/tasks.jsonl`; never store API keys or full authorization headers.

## Revoke A Leaked Key

1. Open BytePlus ModelArk API Key management.
2. Disable or delete the exposed key.
3. Create a replacement key.
4. Update only your local environment.
5. Search GitHub history and logs for exposure.
6. Treat all tasks submitted with the leaked key as auditable security events.
