# ASTV Professional Dashboard — Phase 3 History Scope

Status: scope freeze
Base: `main` at `d4f507771ecf9373a95ead66f4a55a835d83ac9c`

## Objective

Build a professional, read-only History workspace at `/phase3` using the existing ASTV task/history data model and authentication boundaries.

## Source-of-truth constraints

- Phase 1 explicitly designates **History** as **Phase 3**.
- Existing authenticated `GET /api/history` returns the latest 50 `VideoTask` records with privacy-preserving prompt text (`Private task`).
- Existing `VideoTask` fields support status, model, resolution, duration, dry-run state, estimated/actual cost/token metadata, timestamps, provider task/output metadata, and safety state.

## Phase 3 deliverable

Create `/phase3` as a professional task-history and audit workspace with:

1. Header/breadcrumb consistent with Phase 1/2 and a visible server-owned Safe Mode / DRY RUN boundary.
2. Read-only summary cards for task count, dry-run passes, completed/failed tasks, and estimated cost totals from the currently loaded history set.
3. Search/filter/sort controls over the loaded history set without mutating task records.
4. History table/list showing only non-secret operational metadata: task ID (shortened), status, model, resolution, duration, dry-run state, estimate, and created time.
5. Task detail inspector for the selected task using only fields already returned by the history source or an explicitly privacy-safe server projection.
6. Client-side sanitized JSON export of the currently loaded history metadata.
7. Empty, loading, and error states.
8. Responsive desktop/mobile behavior and keyboard-accessible controls.
9. Focused regression tests for route wiring, privacy masking, read-only behavior, and absence of provider/mutation actions.

## Safety / privacy boundary

Phase 3 must remain read-only.

Do not add or expose:

- provider execution controls;
- `/api/generate` or `/api/real-generate` calls;
- retries, deletes, task mutations, or budget mutations;
- API keys, credentials, signed URLs, raw provider bodies, or full private prompts;
- browser controls that change server-owned Safe Mode;
- Prisma migrations or environment changes.

Preserve the existing history privacy behavior unless a deliberately reviewed privacy-safe projection is introduced.

## Allowed implementation surface

Expected new files:

- `src/app/phase3/page.tsx`
- `src/components/dashboard/phase3/phase3-history-dashboard.tsx`
- `src/lib/phase3-history.test.ts`

Expected minimal existing-file edit:

- `src/components/dashboard/phase1/phase1-dashboard.tsx` — make the existing History / Phase 3 navigation item link to `/phase3`.

Existing auth, provider, database schema, environment, and production safety files are protected from modification in this phase.

## Review gate

Do not merge Phase 3 until local tests/typecheck/build, Vercel Preview, authenticated visual QA, privacy review, responsive QA, and read-only diff review all pass.
