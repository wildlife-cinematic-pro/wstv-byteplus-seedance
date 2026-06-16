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
- Private task responses stay under `outputs/private-responses/`.
- Task logs stay under `data/`.

The backend calls `scripts/wstv_pipeline.py` as a subprocess. Paid safety logic remains in the existing pipeline.
