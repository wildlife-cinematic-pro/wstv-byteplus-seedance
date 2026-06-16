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
- If the reference host is not `images.wildstoriestv.com` or under `wildstoriestv.com`, the UI shows a warning before paid generation.
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

The dashboard shows total spent, remaining budget, paid video count, successful/failed paid attempts, total tokens, average cost per successful video, next estimated cost, estimated remaining videos, today/month/all-time filters, and budget warnings.

BytePlus Console Billing remains the final source of truth.

### Manual Backfill For Previous Paid Videos

If a paid video was generated before the cost tracker existed, backfill it from verified BytePlus Console usage with:

```bash
python3 scripts/backfill_cost_ledger.py --confirm BACKFILL_VERIFIED_CONSOLE_COST
```

The default backfill records the verified `2026-06-16` `elephant-mud-test.mp4` entry:

- tokens: `324900`
- token source: `actual_from_console`
- rate: `$7.00 per 1,000,000 output tokens`
- calculated cost: `$2.2743`
- source note: `BytePlus Console usage screenshot`

The helper is local-only, makes no BytePlus API request, stores no signed URLs or private JSON, and blocks duplicate filename/date/token entries.

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
