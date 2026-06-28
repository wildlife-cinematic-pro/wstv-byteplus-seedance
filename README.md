# WSTV BytePlus Seedance Dashboard

Local planning dashboard for WSTV Seedance 2.0 payload validation, dry-run simulation, reference media checks, and token-based cost estimation.

## Safety Mode

This repository is configured for DRY RUN / PLANNING MODE by default.

- No real BytePlus ModelArk generation tasks are submitted.
- `/api/generate` is simulation-only.
- Payload Preview is preview-only.
- Safe Mode defaults ON in the app.
- API keys must stay server-side only and must never use a `NEXT_PUBLIC_` prefix.

Default safety flags in `.env.example`:

```bash
DRY_RUN=true
ENABLE_REAL_API=false
ALLOW_PAID_CALLS=false
```

## Local Setup

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment

Use `.env.local` for local development. It is gitignored.

Required for the local SQLite database:

```bash
DATABASE_URL="file:./prisma/dev.db"
```

For dry-run planning, leave the server-side API key empty. Do not add real keys to frontend code, commits, logs, screenshots, or public files.

## Pricing Notes

The dashboard uses official Seedance token pricing rates for planning estimates, but the estimate is not final billing.

Actual billing requires the real provider response usage fields, such as `usage.completion_tokens`, after a future real API task completes. Real API activation remains disabled in this app.

## Verification

Suggested local checks:

```bash
npx prisma generate
npx prisma db push
npm run build
git diff --check
```

Security greps:

```bash
rg -n "fetch\\([^\\n]*(ark|bytepluses)|axios\\(|requests\\.post|httpx|contents/generations/tasks" src
rg -n "NEXT_PUBLIC_.*(KEY|SECRET|ARK|BYTEPLUS)" .
```
