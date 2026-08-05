# Testing

## Running

```bash
npm test              # unit tests, one pass
npm run test:watch    # watch mode
npm run test:coverage # coverage report

npm run db:up         # starts a throwaway Postgres on port 55432
npm run test:rls      # policy tests against that database
npm run db:down       # stops the throwaway Postgres (run when finished with RLS tests)

npm run test:all      # unit + RLS

supabase start        # full local stack, for E2E (once)
npm run test:e2e      # Playwright; re-seeds automatically first (see below)
npm run test:e2e:ui   # Playwright's UI mode; re-seeds too
npm run db:reset      # replays migrations — needed after changing one
supabase stop         # stops the full local stack (run when finished with E2E)
```

Vitest is configured in the `test` block of `vite.config.ts` — jsdom
environment, globals on, `TZ=UTC` pinned (`formatRelativeTime` falls through to
`toLocaleDateString`, which is timezone-dependent, so an unpinned run passes
locally and fails in CI). `src/test/setup.ts` registers jest-dom matchers and
clears the DOM and mocks between tests.

Tests live next to what they test: `src/utils/listEntries.test.ts`.

## Writing

Build fixtures with `src/test/factories.ts` rather than by hand — every builder
takes a partial override, so a test states only the fields it cares about.
Render components with `renderWithProviders` (`src/test/renderWithProviders.tsx`),
which mirrors `main.tsx`'s provider order and injects the auth context directly.
It returns a `location` probe for asserting on redirects.

Two seams are worth knowing:

- **AniList franchise resolution** needs no network mocking. `resolveFranchiseKey`
  reads `ctx.mediaCache` before it ever fetches, so `seededContext([...media])`
  runs the whole algorithm offline. `anilistApi` is additionally mocked to throw,
  so a node a test forgets to seed fails loudly instead of hitting the real API.
- **Supabase services** import the client as a module-scope singleton, so a test
  touching one needs `vi.mock("../../supabase-client", () => ({ default: {} }))`
  with a `default` key. Use `await import(...)` for the module under test so the
  mock is registered first.

Mock modules partially when the real one exports more than you're stubbing —
`vi.mock(path, async (importOriginal) => ({ ...(await importOriginal()), fn }))`.
Replacing `services/supabase/profiles` wholesale, for instance, strips the
constants `AvatarField` needs and the failure looks unrelated.

## What's covered, and why

Priority went to logic that fails *quietly* — where a regression produces wrong
data or wrong grouping rather than a crash:

| Area | Why it's covered |
| --- | --- |
| `services/anilistFranchise.ts` | Decides which seasons the UI treats as one show. The one-hop `PARENT` attach is guarded by a reciprocal `SIDE_STORY` check; without it, spin-offs merge into their parent franchise. |
| `utils/listEntries.ts` | The `isFranchise` predicate fans out into eight card fields. Also pins that a series status is derived but a series rating never is. |
| `userLists.seriesStatusFor` ↔ `deriveSeriesStatus` | One product rule in two files with no shared code. Both must refuse to infer `completed`. |
| `utils/franchise.ts` | Group-key precedence and the year/name-length sort. |
| `api/animeMapping.ts` | Fallback chains feeding NOT NULL and externally-keyed columns. Shared with `scripts/backfill-anilist.ts`. |
| `services/supabase/entries.ts` | Vote-delta arithmetic patched from three call sites; a wrong delta drifts silently. |
| `constants/listSort.ts` | Unrated cards must sink to the bottom in *both* directions. |
| `context/AuthProvider.tsx`, `pages/SettingsPage.tsx` | Regression cover for the auth-initialization bug (see below). |

### The auth-initialization regression

`AuthContext` exposes `initializing` alongside `user`. Until it existed, `user`
was `null` on first paint for everyone, and `SettingsPage`'s `!user` guard
redirected signed-in visitors to `/signin` — which forwarded them to `/`, losing
the URL they asked for, `?tab=` and all.

Any new consumer that renders one thing for signed-in and another for signed-out
must wait on `initializing`, or it will flash the wrong half. `SettingsPage.test.tsx`
and `AuthProvider.test.tsx` pin the behavior.

## RLS policy tests (`tests/rls/`)

The privacy model is enforced in Postgres, so it's tested in Postgres.

`tests/rls/db.ts` builds a scratch database per test file: it applies
`supabase/tests/harness.sql` (the auth roles, `auth.users`, and `auth.uid()`)
then every file in `supabase/migrations/` in filename order. Tests impersonate a
user the same way PostgREST does — `set local role` plus the user's id in the
`request.jwt.claims` GUC — inside a transaction that is rolled back, so files
are order-independent.

**This deliberately does not run the Supabase stack.** Kong, GoTrue, PostgREST
and Studio are a lot of moving parts, and none of them is where the risk is: the
risk is in the policy predicates, which are pure SQL. Skipping them keeps the
suite at well under a second and lets CI use a stock `postgres:17` service
container with no Supabase CLI at all.

What's asserted:

- **The friend gate** — own and friends' rows visible, non-friends' invisible,
  visibility flipping the instant a friendship is accepted, a *pending* request
  granting nothing.
- **`can_view_entry`** keying off the entry's author, so a visible thread renders
  in full.
- **`get_entries_with_counts` is not `SECURITY DEFINER`** — making it definer
  would silently reopen global visibility.
- **Friendship write hardening**, the privilege-escalation boundary: no
  born-accepted rows, only the addressee may accept, a second accept is a no-op
  (which is what makes `acceptFriendRequest` idempotent), `authenticated` holds
  `UPDATE` on `status` and nothing else, and the trigger refuses to repoint a
  friendship even for a writer that bypasses RLS.
- **The anonymous surface** — `get_public_feed`/`get_public_entry` callable by
  `anon` and *not* by members, `user_id` absent from their return type, the limit
  clamped, and no direct read on any user-content table.
- **`franchises`** readable by `anon` and select-only. Note this is asserted on
  the *grant*: the view's `GROUP BY` makes it non-auto-updatable, so an attempted
  write fails with `55000` before privileges are consulted — a Postgres
  implementation detail that would evaporate if the view were ever simplified.

Adding a table that holds user content? It needs its own `can_view_user`-based
SELECT policy — nothing grants that by default — and a case in
`visibility.test.ts`.

`supabase/config.toml` exists for CLI work (`supabase db diff` and friends) and
has its ports shifted into the 544xx range so it can't collide with another
Supabase project running locally. Note that `supabase start` has *not* been
verified to work here — its schema-init container fails on this machine for
reasons unrelated to the schema — which is part of why the RLS suite depends on
plain Postgres instead.

## Schema baseline

`supabase/migrations/20260101000000_baseline_schema.sql` is the schema the RLS
suite builds from, reconstructed from the live project's catalog. Before it,
this repo had no `create table` anywhere: the tables were made through the
dashboard and the migration files only patched them, so a database could not be
built from source. Migrations that ran before the baseline are kept in
`archive/` for their commentary; see the README there.

## E2E (`tests/e2e/`)

Playwright against the **full local Supabase stack** — real GoTrue sign-in, real
RLS, real Postgres. `supabase start` first, then `npm run test:e2e`.

Accounts and fixtures come from `supabase/seed.sql`; `tests/e2e/helpers.ts`
mirrors them. Alice and Bob are friends, **Carol is friends with nobody** — she
is what makes "not visible" assertable. Password is `TestPass1!` for all three.

### The seed is restored before every run

The specs mutate shared state deliberately: `friends.spec` accepts a friendship,
`lists.spec` adds to a list, `auth.spec` creates an account. So a run leaves the
database in a state where the *next* run's premises no longer hold — "Alice must
not see Carol's entry" stops being a meaningful assertion once a previous run has
made them friends.

`tests/e2e/seed.setup.ts` re-applies `seed.sql` before every run. It is wired as
a **setup project** that `chromium` depends on, not as a step in the npm script,
so it covers `--ui` and single-test re-runs as well as `npm run test:e2e`. Wiring
it into the script instead is the trap: UI mode never invokes the script, so the
suite would pass in the terminal and fail in UI mode — with failures that look
like app bugs rather than stale fixtures.

Re-seeding takes well under a second because it talks straight to Postgres rather
than shelling out to `supabase db reset`. It therefore does **not** replay
migrations — run `npm run db:reset` after changing one, or you will be testing
last week's schema. CI gets a fresh stack every time and is immune.

`seed.sql` opens with a reset region to make this possible. It truncates the
public tables before deleting the accounts, because `user_franchise_entries.user_id`
is the one FK to `profiles` that is `NO ACTION` rather than `CASCADE` and would
otherwise block the delete.

Runs with `workers: 1`. One seeded database is shared by every spec and several
act as the same user, so parallel workers trip over each other's writes; the
whole suite is ~17s serially.

Covered: sign-in and sign-up (through the real confirmation step — local
`enable_confirmations` is set to `true` to match production), the friend request
→ accept visibility flip across two browser contexts, adding a season and the
franchise row it seeds, series-level tracking, the anonymous public feed, and
the two regressions worth pinning — `/settings` surviving a hard reload, and
logged-out visitors getting a CTA rather than a redirect on protected-looking
URLs.

Two gotchas worth knowing before adding a spec:

- The browse grid links a multi-season franchise to `/series/:key`, never to a
  season, so you cannot click through to a season detail page. Navigate by the
  seeded id.
- Stat labels and similar are uppercased in CSS, so the DOM text is `Watching`
  even though the page reads `WATCHING`. Match case-insensitively.

## Not covered yet

The Create composer (`publishEntry`), comments and voting, avatar upload, and
search/import are only exercised at the unit layer, not through the UI.
