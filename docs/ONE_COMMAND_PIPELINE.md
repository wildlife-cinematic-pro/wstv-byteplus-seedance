# WSTV One-Command Pipeline

This command runs the verified WSTV Seedance workflow:

```text
dry-run preview
-> one approved submit
-> bounded status polling
-> private response save
-> safe download
-> ffprobe verification
```

Dry-run only by default:

```bash
python3 scripts/wstv_pipeline.py \
  --prompt-file data/example.txt \
  --out example.mp4
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

Safety rules:

- Dry-run prints `No network request was made.`
- Paid submit still uses the same gates as `scripts/generate_video.py`.
- Duplicate blocking is enabled by default.
- The pipeline intentionally does not expose `--allow-duplicate`.
- Private full task responses are saved under `outputs/private-responses/`.
- Generated videos and verification sidecars are saved under `/Users/acharyabimal/Movies/WSTV/SeedanceVideos/` by default.
- Signed URLs, private task responses, and `.mp4` files must not be committed.
- ffprobe verification is required for the production pipeline.
