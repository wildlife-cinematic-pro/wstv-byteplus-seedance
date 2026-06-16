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

The backend calls `scripts/wstv_pipeline.py` as a subprocess. Paid safety logic remains in the existing pipeline.
