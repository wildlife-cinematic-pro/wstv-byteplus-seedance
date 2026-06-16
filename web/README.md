# WSTV Seedance Dashboard (web)

React + TypeScript + Vite front-end for the local WSTV Seedance pipeline.
It talks to the Python dashboard server (`scripts/wstv_server.py`) over the
`/api/*` JSON endpoints.

## Develop

```bash
cd web
yarn install
yarn dev          # http://localhost:5173  (proxies /api → 127.0.0.1:8765)
```

Run the Python server in another terminal so the API is reachable:

```bash
python3 scripts/wstv_server.py --host 127.0.0.1 --port 8765
```

## Build

```bash
cd web
yarn build        # type-checks, then emits web/dist/index.html
```

`vite-plugin-singlefile` inlines all JS/CSS into one self-contained
`web/dist/index.html`. The Python server serves that file at `/` when it
exists, and falls back to the legacy `web/wstv_ui.html` if `dist/` is absent —
so a fresh checkout still works before the first build.

To ship the new UI through the normal launcher, just build once:

```bash
yarn --cwd web build
./start_wstv_dashboard.command
```

## Structure

```
src/
  lib/         types, api client, constants, formatting
  context/     DashboardContext — shared form state, validation, actions
  hooks/       useTheme (light/dark)
  components/
    ui/        Button, Card, Field, Switch, Badge, Callout, Icon
    create/    guided stepper (Step, CreatePanel, GenerateStep)
    budget/    Metrics, BudgetPanel, PackTables
    TopBar, StatusPanel, ImageField, HistoryPanel
```

The safety model is unchanged from the original dashboard: Safe Mode hides the
paid zone, paid generation stays disabled until a dry run succeeds and the exact
confirmation token is typed, and all gating is re-checked server-side.
