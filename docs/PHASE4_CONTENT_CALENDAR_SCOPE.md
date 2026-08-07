# ASTV Professional Dashboard — Phase 4 Content Calendar Scope

Status: scope freeze
Base: `main` at `a3717ac54f08279d631fa581671675f463b2e33c`

## Objective

Build a professional, authenticated Content Calendar workspace at `/phase4` using the existing `ContentCalendar` data model and authenticated calendar APIs.

## Source-of-truth constraints

- The professional dashboard navigation places **Content Calendar** immediately after the completed **History** workspace.
- The existing Prisma `ContentCalendar` model stores `scheduledDate`, project/story labels, workflow status, linked record IDs, notes, and timestamps.
- Existing authenticated API routes already support calendar list/create/update/delete operations:
  - `GET /api/content-calendar`
  - `POST /api/content-calendar`
  - `PUT /api/content-calendar/[id]`
  - `DELETE /api/content-calendar/[id]`
- Global proxy/auth protection and same-origin mutation checks remain authoritative and must not be weakened.

## Phase 4 deliverable

Create `/phase4` as a professional planning and publishing calendar with:

1. Header/breadcrumb consistent with Phases 1–3 and a visible server-owned boundary such as `Safe Mode ON · PLANNING ONLY · no provider actions`.
2. Current-month calendar grid with previous/next month navigation and a Today action.
3. Month summary cards for loaded entries, scheduled/posted items, active pipeline items, and open calendar days.
4. Status lifecycle using the existing values: `idea`, `master_image`, `storyboard`, `prompted`, `generated`, `capcut_edit`, `scheduled`, `posted`, `reviewed`.
5. Day/entry inspector showing privacy-safe calendar metadata only.
6. Authenticated create flow using the existing `POST /api/content-calendar` route.
7. Authenticated edit/status-update flow using the existing `PUT /api/content-calendar/[id]` route.
8. Explicit-confirmation delete flow using the existing `DELETE /api/content-calendar/[id]` route.
9. Search/filter controls over loaded entries and a compact agenda/list view for the selected month.
10. Empty/loading/error/saving states with non-leaking error messages.
11. Responsive desktop/mobile behavior with no document-level horizontal overflow and keyboard-accessible controls.
12. Focused regression tests covering route wiring, status values, CRUD endpoint use, mutation confirmation, auth/safety boundaries, and absence of provider execution calls.

## Mutation boundary

Phase 4 may mutate **ContentCalendar records only** through the existing authenticated calendar APIs.

Do not add or expose:

- provider execution controls;
- `/api/generate`, `/api/real-generate`, image generation, or paid-provider calls;
- budget, usage, token, pricing, generation-task, prompt, reference-asset, or post-production mutations;
- API keys, credentials, signed URLs, raw provider bodies, or environment values;
- browser controls that alter server-owned Safe Mode;
- direct browser-side Prisma/database access;
- Prisma migrations or environment changes.

Delete must require an explicit user confirmation in the UI before the DELETE request is sent.

## Data handling

- Treat calendar data as planning metadata, not as provider execution state.
- Use only fields already present in the `ContentCalendar` model unless a separately reviewed scope expansion is approved.
- Do not expose unrelated linked-record contents merely because IDs exist on a calendar entry.
- Keep API and UI error responses generic; do not surface stack traces or connection strings.

## Allowed implementation surface

Expected new files:

- `src/app/phase4/page.tsx`
- `src/components/dashboard/phase4/phase4-content-calendar.tsx`
- `src/lib/phase4-content-calendar.test.ts`

Expected minimal existing-file edit:

- `src/components/dashboard/phase1/phase1-dashboard.tsx` — make the existing Content Calendar navigation item link to `/phase4`.

Existing auth/proxy, provider, database schema, environment, generation, and production safety files are protected from modification unless a blocking defect is separately identified and reviewed before editing.

## Review gate

Do not merge Phase 4 until all of the following pass:

- focused and full tests;
- TypeScript check;
- production build;
- `git diff --check`;
- protected-file diff review;
- desktop responsive/interaction QA;
- 390px mobile overflow/interaction QA;
- create/edit/delete calendar CRUD QA against a safe test/preview context;
- confirmation that no provider or paid call can be initiated from `/phase4`;
- Vercel Preview authenticated visual QA;
- post-merge production smoke test.
