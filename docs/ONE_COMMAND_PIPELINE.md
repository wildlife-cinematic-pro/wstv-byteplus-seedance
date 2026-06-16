# WSTV One-Command Pipeline

This command runs the verified WSTV Seedance workflow:

```text
dry-run preview
-> one approved submit
-> bounded status polling
-> private response save
-> safe download
-> ffprobe verification
-> local cost ledger append
```

Dry-run only by default:

```bash
python3 scripts/wstv_pipeline.py \
  --prompt-file data/example.txt \
  --out example.mp4
```

Optional two-reference-image dry-run:

```bash
python3 scripts/wstv_pipeline.py \
  --prompt-file data/example.txt \
  --out example.mp4 \
  --image-url https://images.wildstoriestv.com/elephant_mud_master.png \
  --image-url-2 https://images.wildstoriestv.com/elephant_storyboard.png
```

Paid submit requires all explicit gates:

```bash
python3 scripts/wstv_pipeline.py \
  --prompt-file data/example.txt \
  --out example.mp4 \
  --submit \
  --max-cost-usd 3 \
  --confirm SUBMIT_ONE_PAID_TASK
```

If `--image-url-2` is used for paid generation, add the explicit storyboard-risk acknowledgement:

```bash
python3 scripts/wstv_pipeline.py \
  --prompt-file data/example.txt \
  --out example.mp4 \
  --image-url https://images.wildstoriestv.com/elephant_mud_master.png \
  --image-url-2 https://images.wildstoriestv.com/elephant_storyboard.png \
  --ack-storyboard-risk \
  --submit \
  --max-cost-usd 3 \
  --confirm SUBMIT_ONE_PAID_TASK
```

Defaults:

- model: `dreamina-seedance-2-0-260128`
- ratio: `9:16`
- duration: `15`
- resolution: `720p`
- generate_audio: `true`
- watermark: `false`
- expected width: `720`
- expected height: `1280`
- expected duration: `15`
- polling interval: `30`
- polling timeout: `900`
- video output folder: `/Users/acharyabimal/Movies/WSTV/SeedanceVideos/`
- reference image 1: master identity/environment anchor
- reference image 2: optional storyboard/motion guide only

Safety rules:

- Dry-run prints `No network request was made.`
- Dry-run preview prints the reference image count and host-only image summary.
- One reference image is the safest production default.
- Two reference images are supported cautiously using two separate `image_url` content items.
- 3-5 reference images are not enabled for paid workflow yet.
- Comma-separated image URLs are rejected.
- Storyboard/grid/captions may be copied by the model; paid generation with `--image-url-2` requires `--ack-storyboard-risk`.
- Paid submit still uses the same gates as `scripts/generate_video.py`.
- Duplicate blocking is enabled by default.
- The pipeline intentionally does not expose `--allow-duplicate`.
- Private full task responses are saved under `outputs/private-responses/`.
- Generated videos and verification sidecars are saved under `/Users/acharyabimal/Movies/WSTV/SeedanceVideos/` by default.
- Successful paid generations append safe cost metadata to `data/wstv_cost_ledger.jsonl`.
- If `usage.completion_tokens` is present, cost uses actual tokens; otherwise it is labeled estimated.
- Dry-runs do not append to the cost ledger.
- Signed URLs, private task responses, and `.mp4` files must not be committed.
- ffprobe verification is required for the production pipeline.

Cost formula:

```text
tokens * rate_usd_per_million_tokens / 1000000
```

BytePlus Console Billing remains the final source of truth.
