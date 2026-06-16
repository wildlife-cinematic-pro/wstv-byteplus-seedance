# Local WSTV Dashboard

The local dashboard is a private browser UI for the verified WSTV Seedance workflow.

Start it from macOS Finder by double-clicking:

```text
start_wstv_dashboard.command
```

Or start it from Terminal:

```bash
.venv/bin/python scripts/wstv_server.py --host 127.0.0.1 --port 8765
```

Open:

```text
http://127.0.0.1:8765
```

Generated MP4 files are saved outside the Git repository by default:

```text
/Users/acharyabimal/Movies/WSTV/SeedanceVideos/
```

If the dashboard output field contains only a filename such as:

```text
elephant-mud-test.mp4
```

the backend resolves it to:

```text
/Users/acharyabimal/Movies/WSTV/SeedanceVideos/elephant-mud-test.mp4
```

The folder is created automatically if it is missing. Open it in Finder:

```bash
open /Users/acharyabimal/Movies/WSTV/SeedanceVideos
```

To use a different local non-cloud folder, set `WSTV_VIDEO_OUTPUT_DIR` before starting the dashboard. Avoid iCloud, Dropbox, and Google Drive folders unless you deliberately want generated video files synced.

## PR #12 Dashboard Safety Quick Wins

- Use `Dry Run (no cost)` before any paid generation.
- Safe Mode ON hides the Paid Zone with `display: none`, so the paid button cannot be clicked.
- Safe Mode OFF is neutral and makes the Paid Zone visible again.
- Paid Zone is styled as dangerous and clearly says `SUBMIT PAID TASK`.
- Paid submission still requires exact `SUBMIT_ONE_PAID_TASK`.
- After a successful paid flow, the confirmation input is cleared and the paid button stays disabled until the phrase is retyped.
- The prompt counter shows `Characters: X / 3500`; paid submit is blocked above 3,500 characters.
- Reference image preview requires a direct HTTPS image URL.
- The dashboard has two separate reference image fields. `Reference Image 1` is the master identity/environment anchor. `Reference Image 2` is optional storyboard/motion guide only.
- Comma-separated image URLs are rejected. Use separate boxes.
- If a reference host is not `images.wildstoriestv.com` or under `wildstoriestv.com`, the UI shows a warning before paid generation.
- If `Reference Image 2` is filled, paid generation is blocked until `I understand storyboard text/grid may be copied.` is checked.
- 3-5 reference images are not enabled for paid workflow yet.
- The log box is capped to about 200px high and scrolls for long output.
- QA checklist items are unchecked by default, including `Loop ending clean`.
- Status badges show states such as `READY`, `DRY RUN OK`, `GENERATING`, `BUDGET LOW`, `ERROR`, `PAID RECORDED`, and `SAFE MODE`.
- Errors show a human-readable message first, with technical details collapsed.
- `Open video folder`, `Open latest video`, and `Open this video` are local-only helper actions.
- Budget warnings are checked on the server before paid submit; UI-only warnings are not trusted.

## Cost / Budget Tracker

The dashboard includes a local-only `Cost / Budget Tracker` panel. Budget settings are stored locally in:

```text
data/wstv_budget_settings.json
```

Paid generation cost entries are appended to:

```text
data/wstv_cost_ledger.jsonl
```

Both files are gitignored. The ledger stores safe metadata only: timestamp, status, model, duration, resolution, aspect ratio, audio setting, output filename, final local MP4 path, token count, token source, verified rate, calculated cost, image URL host, and optional task ID. It does not store API keys, signed output URLs, full image URLs, private task response JSON, or `.mp4` files.

Cost is calculated with:

```text
tokens * rate_usd_per_million_tokens / 1000000
```

If `usage.completion_tokens` is available, the dashboard records `token_source = actual`. If not, it records the local estimate with `token_source = estimated`. Dry-runs do not append to the ledger and do not count as paid videos. Paid generation is counted only after the paid task result is recorded; duplicate task/result entries are not double-counted.

The dashboard shows:

- Pack Summary: model, package size, quantity, total purchased tokens, total price, effective rate, purchase date, expiry date, and status.
- Usage Summary: videos recorded, actual tokens used, estimated tokens used, total used tokens, remaining tokens, used value, and remaining value.
- Resolution Comparison: `720p` and `1080p` tokens/video, PAYG cost/video, pack cost/video, total videos from pack, remaining videos now, tokens after next, and warning.
- Recent Usage: date, filename, resolution, token source, tokens, PAYG cost, pack-rate cost, and note.

Dry-runs do not append usage. Failed paid attempts do not count against the token pack unless actual Console usage is explicitly entered.

BytePlus Console Billing remains the final source of truth.

### Resolution And Token Pack Estimates

The dashboard token tracker supports `720p` and `1080p` estimates for 9:16, 15-second WSTV Seedance videos.

- Use `720p` for testing and normal iteration.
- Use `1080p` only for final or high-value scenes.
- `1080p` uses more than 2x the tokens of `720p`.

Current BytePlus UI screenshot-backed presets:

| Resolution | Projected tokens | Pay-as-you-go rate | PAYG cost/video | Example pack rate | Pack cost/video |
| --- | ---: | ---: | ---: | ---: | ---: |
| `720p` | `324000` | `$7.00/M` | `$2.2680` | `$4.30/M` | `$1.3932` |
| `1080p` | `801900` | `$7.00/M` | `$5.6133` | `$4.30/M` | `$3.4482` |

For a 7M token resource pack at `$30.10`, the effective pack rate is `$4.30/M`.

- Total possible `720p` videos: `floor(7000000 / 324000) = 21`
- Total possible `1080p` videos: `floor(7000000 / 801900) = 8`
- After two existing 720p videos using `649800` tokens, remaining tokens are `6350200`.
- Remaining `720p` videos: `floor(6350200 / 324000) = 19`
- Remaining `1080p` videos: `floor(6350200 / 801900) = 7`

When the dashboard resolution selector changes, the estimated next-video tokens, PAYG cost, pack cost/video, total videos possible, remaining videos possible, and token warnings update automatically. Paid submit is blocked when the active token pack cannot cover the selected resolution. Dry-run remains free and does not append pack usage.

### Manual Backfill For Previous Paid Videos

If a paid video was generated before the cost tracker existed, backfill it from verified BytePlus Console usage with the dashboard `Add Console Usage Manually` form or the CLI helper. The dashboard form requires exact confirmation text: `ADD_CONSOLE_USAGE`.

Example for a missing second `720p` video:

```bash
python3 scripts/backfill_cost_ledger.py \
  --output-filename second-wstv-video.mp4 \
  --date 2026-06-16 \
  --resolution 720p \
  --tokens 324900 \
  --token-source actual_from_console \
  --note "second BytePlus Console usage entry" \
  --confirm BACKFILL_VERIFIED_CONSOLE_COST
```

The helper is reusable and local-only. It makes no BytePlus API request, stores no signed URLs or private JSON, and blocks duplicate filename/date/token entries.

Safety rules:

- The server binds only to `127.0.0.1`.
- It is not deployed publicly.
- It does not expose `.env` or API keys to the browser.
- It does not expose signed output URLs or private response JSON.
- Dry-run runs first and makes no paid BytePlus request.
- Paid generation requires exact `SUBMIT_ONE_PAID_TASK`.
- The paid button disables immediately after click.
- There is no automatic retry for paid create-task.
- Duplicate blocking remains inside `scripts/wstv_pipeline.py`.
- Temporary prompt files are stored under gitignored `data/dashboard/`.
- Dashboard history is stored under gitignored `data/dashboard_history.json`.
- Cost ledger is stored under gitignored `data/wstv_cost_ledger.jsonl`.
- Budget settings are stored under gitignored `data/wstv_budget_settings.json`.
- Private task responses stay under `outputs/private-responses/`.
- Task logs stay under `data/`.

The backend calls `scripts/wstv_pipeline.py` as a subprocess. Paid safety logic remains in the existing pipeline.

## Two Reference Images

Use one image for normal production when possible. Add a second image only when it is useful as a storyboard or motion guide.

- `Reference Image 1 - Master identity / environment`: animal anatomy, identity, setting, lighting, realism, and composition anchor.
- `Reference Image 2 - Storyboard / motion guide`: shot order, framing, pacing, or motion guide only.

When Image 2 is used, include this intent in the final prompt:

```text
Use Image 1 as the master identity, animal anatomy, environment, lighting, and realism anchor.
Use Image 2 only as storyboard shot order, framing, pacing, and motion guide.
Do not copy storyboard grid, borders, frame numbers, captions, text, logo, or watermark.
```

Storyboard grids, captions, labels, text, logos, or watermarks can be copied by the model. Review the dry-run preview first. Paid generation still requires exact `SUBMIT_ONE_PAID_TASK`, budget checks, duplicate blocking, API key gate, and the storyboard acknowledgement checkbox.
