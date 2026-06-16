# Safe Download Workflow

Verified fields:

- Task ID: `$.id`
- Completed output video URL: `$.content.video_url`

Rules:

- Do not make a new generation request to download a video.
- Save full private task responses only under `outputs/private-responses/`.
- Save generated/downloaded videos under `/Users/acharyabimal/Movies/WSTV/SeedanceVideos/` by default.
- Do not commit signed output URLs, private responses, `.mp4` files, or verification sidecars.
- Use one explicit download command per completed task.

From a completed private response:

```bash
python3 scripts/download_video.py \
  --response-json outputs/private-responses/TASK_ID.json \
  --out /Users/acharyabimal/Movies/WSTV/SeedanceVideos/wstv-output.mp4 \
  --expect-duration 15 \
  --expect-width 720 \
  --expect-height 1280
```

From a copied verified signed URL:

```bash
python3 scripts/download_video.py \
  --url "SIGNED_OUTPUT_URL" \
  --out /Users/acharyabimal/Movies/WSTV/SeedanceVideos/wstv-output.mp4 \
  --expect-duration 15 \
  --expect-width 720 \
  --expect-height 1280
```

The downloader streams to a temporary file, rejects HTML or JSON error pages, atomically renames the file, verifies non-zero size, and writes local verification metadata.
