# CI/CD

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`
and `production`. Two jobs:

- **verify** — `lint`, `typecheck`, `test`, `build`. Needs nothing but Node.
- **rls** — the policy suite, against a `postgres:17` service container. Kept
  separate because it needs a database; it does *not* need the Supabase CLI,
  since the suite applies `supabase/migrations/` itself.
- **e2e** — Playwright against the full local Supabase stack (`supabase start`),
  so sign-in goes through real GoTrue. Uploads the HTML report on failure.

The three run in parallel; the fast checks aren't gated behind the slow ones.

Runs for the same ref cancel each other (`concurrency` with
`cancel-in-progress`), so pushing to a PR doesn't leave stale runs burning
minutes.

The build step is a compile check, not a deployable artifact. Vite inlines
`import.meta.env` at build time and CI has no `VITE_SUPABASE_ANON_KEY`, so the
output has `undefined` baked in — it exists to catch bad import paths and Vite
or Tailwind config errors that `tsc` can't see. Vercel builds separately with
its own environment.

## Project board

Every PR should sit in either **In Review** or **Done** on the
[Issho project board](https://github.com/users/RodillasJavier/projects/1).

- **In Review** — `.github/workflows/project-board.yml` runs when a PR is
  opened or reopened (drafts included), adds it to the board if it isn't there
  yet, and sets Status to In Review. GitHub's built-in board workflows have no
  "PR opened" trigger, which is why this one is an Action.
- **Done** — the board's built-in "Pull request merged" and "Item closed"
  workflows. No Action involved.

Setup it depends on:

- A `PROJECT_TOKEN` repository secret: a personal access token that can write
  to the board (classic with the `project` scope, or fine-grained with account
  Projects read/write). `GITHUB_TOKEN` can't reach a user-owned Project.
  Without the secret the job logs a warning and passes, rather than failing
  every PR.
- The built-in "Item added to project" workflow limited to **issues** (board →
  ⋯ → Workflows). Otherwise it sets every new PR to Todo and races the Action.

The workflow hardcodes the project, Status-field and option IDs. Renaming a
column is fine; deleting and recreating one changes its ID, so re-read them with
`gh project field-list 1 --owner RodillasJavier --format json` and update the
workflow.

## Deployment

Vercel's git integration deploys on push; there is no deploy step in the
workflow. `vercel.json` holds a single SPA rewrite (all paths → `/index.html`).

`VITE_SUPABASE_ANON_KEY` is set in the Vercel project environment. It's a
public, RLS-gated client credential — the visibility rules in `CLAUDE.md` are
what actually protect user data, not the secrecy of this key.

`VITE_SUPABASE_URL` is optional. `src/supabase-client.ts` falls back to the
production URL when it's unset, so existing environments keep working; set it
only to point the app at a local stack or a preview branch.

## Adding a check

Add a step to the `verify` job when it's fast and needs nothing but Node. Give
it its own job when it needs services (Docker, a database) or takes long enough
to be worth running in parallel — the planned RLS integration suite needs
`supabase start`, and the Playwright suite needs browsers, so both will be
separate jobs rather than steps here.
