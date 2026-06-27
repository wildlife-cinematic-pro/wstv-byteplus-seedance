# WSTV Seedance Dashboard — Budget Widget Fix

## What was fixed

The top-right header was stuck showing `$0.00 / $50.00 budget` even after
saving a new monthly budget ($150) on the Settings page. The fixes address
three independent root causes:

### 1. `src/app/api/cost-summary/route.ts` — silent DB save failure

The POST endpoint previously wrapped its Prisma write in a `try/catch` that
only `console.warn`'ed the error and still returned `{ success: true }`. If
your local Prisma client was out of sync with the schema (e.g. you changed
`monthlyBudgetUsd` → `monthlyLimit` in `schema.prisma` but forgot to run
`npx prisma generate` + `npx prisma db push`), the save APPEARED to succeed
but never wrote to the DB. The next GET then returned the default 50.

**Fix:**
- DB errors now propagate as HTTP 500 with `success: false` + error detail.
- POST response returns the actual persisted row (re-fetched after save), so
  the client can update its UI directly without a follow-up GET.
- Added `export const dynamic = 'force-dynamic'` and
  `Cache-Control: no-store, no-cache, must-revalidate` headers to every
  response to prevent Next.js 16 from caching stale budget data.
- Canonical field name is `monthlyLimit`. Legacy `monthlyBudgetUsd` is still
  ACCEPTED in the request body for backward compatibility, but is never
  written to the DB.

### 2. `src/app/api/budget/route.ts` — same caching issue

Added `force-dynamic` + no-store headers to GET and PUT.

### 3. `src/components/dashboard/cost-settings.tsx` — wrong field name in POST body

The Settings form was sending `{ monthlyBudgetUsd: 150 }` in the POST body.
The route handler accepted this via a fallback, but the local state was
named `monthlyBudgetUsd`, creating confusion. The `wstv-budget-updated`
CustomEvent was also dispatched WITHOUT a `detail` payload, forcing the
parent dashboard to do a follow-up GET (which could be cached).

**Fix:**
- Renamed local state `monthlyBudgetUsd` → `monthlyLimit` (matches schema).
- POST body now sends `{ monthlyLimit }` (canonical field).
- New `initialBudget` prop — server-side value wins on first paint, so the
  Settings tab shows the same value as the top-right header.
- localStorage writes to BOTH `wstv_monthly_limit` (canonical) AND
  `wstv_monthly_budget_usd` (legacy) for backward compatibility.
- On save: parses POST response, updates local state to the actual DB value,
  dispatches `wstv-budget-updated` event WITH `detail.monthlyLimit` payload.
- Error responses now show a toast with the actual error message.

### 4. `src/components/dashboard/client.tsx` — header didn't refresh

**Fix:**
- Passes `initialData.budget` (= `budgetInfo`) as `initialBudget` prop to
  `<CostSettings />`.
- Listens for `wstv-budget-updated` event WITH detail payload — applies
  `detail.monthlyLimit` directly to `budgetInfo` state (no network round
  trip). Header updates INSTANTLY when the user clicks "Save Budget Settings".
- Falls back to full GET refresh only when detail is missing.
- Added `cache: 'no-store'` + `Cache-Control: no-cache` headers to refresh.

## How to run

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Generate Prisma client (IMPORTANT — do not skip)
npx prisma generate

# 3. (Optional) Sync schema with DB if you changed anything
#    This is SAFE — it will NOT delete your existing data
npx prisma db push

# 4. Start dev server
npm run dev
```

Open http://localhost:3000 — the top-right header should now show your saved
budget. Try this flow to verify the fix:

1. Click the **Settings** tab.
2. Change "Monthly Budget (USD)" from 50 to 150.
3. Click **Save Budget Settings**.
4. Switch back to the **Generate** tab.
5. The top-right header should now read `Estimated: $0.00 / $150.00 budget`.
6. Refresh the browser (Cmd+R / Ctrl+R).
7. The header should STILL show `$150.00 budget` (persisted to DB).

## Safe Mode / Dry Run preserved

- `safeMode: true` in `/api/settings` (verified)
- `dryRunOnly: true` in `/api/cost-summary` response meta
- `realApiConnected: false` in every response
- `/api/dry-run` correctly reads `budget.monthlyLimit` and reports
  `$0.24 ≤ $150.00 remaining — OK`
- **No real Seedance API calls are made.**
- **No API keys are required or added.**
- **No real paid generation tasks are submitted.**

## Files modified

| File | Change |
|------|--------|
| `src/app/api/cost-summary/route.ts` | Full rewrite — force-dynamic, no-store headers, no silent error swallowing, returns persisted row, accepts `monthlyLimit` (canonical) and `monthlyBudgetUsd` (legacy) |
| `src/app/api/budget/route.ts` | Added force-dynamic + no-store headers to GET and PUT |
| `src/components/dashboard/cost-settings.tsx` | Renamed state to `monthlyLimit`, accepts `initialBudget` prop, dispatches event with `detail.monthlyLimit` payload |
| `src/components/dashboard/client.tsx` | Passes `budgetInfo` to `<CostSettings initialBudget={...} />`, applies event detail directly to state |

## Schema source of truth

`prisma/schema.prisma`:

```prisma
model BudgetSetting {
  id             String   @id @default(cuid())
  monthlyLimit   Float
  spentThisMonth Float    @default(0)
  currency       String   @default("USD")
  alertThreshold Float    @default(0.8)
  updatedAt      DateTime @updatedAt
}
```

The canonical field is **`monthlyLimit`** — not `monthlyBudgetUsd`.
