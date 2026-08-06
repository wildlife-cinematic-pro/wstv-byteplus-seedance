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
# Set DATABASE_URL and DIRECT_URL to your PostgreSQL connection strings (see Environment).
npx prisma generate
npm run db:migrate
npm run dev
```

Open:

```text
http://localhost:3000
```

### Database rollout (Prisma Migrate)

Schema changes ship as Prisma migrations under `prisma/migrations`. Do not use
`db push` in production — apply migrations explicitly.

Locally, sync your development database with the schema:

```bash
npx prisma generate
npm run db:migrate        # prisma migrate dev
```

For production (e.g. Neon on Vercel), apply pending migrations exactly once:

```bash
npm run db:migrate:deploy # prisma migrate deploy
```

Never run migrations automatically from a Preview deployment — deploy them
deliberately against the production database. Check drift with
`npm run db:migrate:status` (`prisma migrate status`).

## Environment

Use `.env.local` for local development. It is gitignored.

The app requires a PostgreSQL database (Neon is recommended for Vercel):

```bash
# Pooled Neon runtime URL — used by the application at runtime
DATABASE_URL="postgresql://<user>:<password>@<host>-pooler.neon.tech/<db>?sslmode=require"

# Direct Neon migration URL — used by prisma migrate / the Prisma CLI (DDL)
DIRECT_URL="postgresql://<user>:<password>@<host>.neon.tech/<db>?sslmode=require"
```

`DATABASE_URL` must be the pooled Neon URL so serverless connections stay within
Neon's connection limit. `DIRECT_URL` must be the direct (non-pooled) Neon URL —
`prisma migrate deploy` runs DDL that the pooler cannot execute.

The legacy local SQLite database file (`prisma/dev.db`) is preserved for
reference but is no longer the datasource. For dry-run planning, leave the
server-side API key empty. Do not add real keys to frontend code, commits,
logs, screenshots, or public files.

## Production deployment (Vercel + Neon)

1. Create a Neon PostgreSQL project (region close to your Vercel deployment).
2. In Vercel → Project → Settings → Environment Variables, add for the
   **Production** environment:
   - `DATABASE_URL` — the pooled Neon runtime URL
   - `DIRECT_URL` — the direct Neon migration URL
3. Run the one-time production migration:
   `npm run db:migrate:deploy` (`prisma migrate deploy`).
4. Redeploy production so the app boots with the new datasource.
5. Perform authenticated read/write smoke tests: sign in, open the dashboard,
   save a budget setting, create a dry-run task, and confirm history updates.

Migrations are never run from Preview deployments — only from the explicit
`db:migrate:deploy` step above.

## Pricing Notes

The dashboard uses official Seedance token pricing rates for planning estimates, but the estimate is not final billing.

Actual billing requires the real provider response usage fields, such as `usage.completion_tokens`, after a future real API task completes. Real API activation remains disabled in this app.

## Verification

Suggested local checks:

```bash
npx prisma generate
npx prisma validate
npm run build
git diff --check
```

Security greps:

```bash
rg -n "fetch\\([^\\n]*(ark|bytepluses)|axios\\(|requests\\.post|httpx|contents/generations/tasks" src
rg -n "NEXT_PUBLIC_.*(KEY|SECRET|ARK|BYTEPLUS)" .
```
# Local security setup

The development and production servers bind to `127.0.0.1` by default. Start the
development server with `npm run dev`; do not expose it through a public tunnel
without deliberately reviewing the deployment configuration.

Configure server-side login in a local `.env.local` file. Generate a password
hash with `node scripts/hash-password.mjs '<password>'`, then set
`ASTV_AUTH_USER`, `ASTV_AUTH_PASSWORD_HASH`, and a random `ASTV_SESSION_SECRET`
(at least 32 characters). `ASTV_SESSION_HOURS` is capped at 8. Production fails
closed if login configuration is incomplete.

Paid generation remains disabled by default: keep `DRY_RUN=true`,
`ENABLE_REAL_API=false`, and `ALLOW_PAID_CALLS=false`. Never commit `.env`,
`.env.local`, API keys, plaintext passwords, password hashes, session secrets,
cookies, authorization headers, provider responses, signed URLs, local
databases, logs, MP4 files, absolute private paths, or private task records.
