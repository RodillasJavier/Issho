/**
 * tests/e2e/seed.setup.ts
 *
 * Restores supabase/seed.sql before every Playwright run.
 *
 * The specs mutate shared state on purpose — friends.spec accepts a friendship,
 * lists.spec adds to a list, auth.spec creates an account — so a run leaves the
 * database in a state where the *next* run's premises no longer hold. ("Alice
 * must not see Carol's entry" is not a meaningful assertion once a previous run
 * has made them friends.)
 *
 * This runs as a setup project that every spec depends on, rather than as part
 * of the npm script, so it applies to `--ui` and to single-test re-runs too. It
 * talks straight to Postgres instead of shelling out to `supabase db reset`:
 * re-seeding is well under a second, where a full reset replays every migration
 * and would make UI mode unusable for iteration.
 *
 * It does not replay migrations, so run `npm run db:reset` after changing one.
 */
import { test as setup } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

/** The local stack's database, per the ports in supabase/config.toml. */
const DB_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54422/postgres";

const SEED_PATH = fileURLToPath(
  new URL("../../supabase/seed.sql", import.meta.url)
);

setup("reset the seed", async () => {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    // One call, no parameters: node-postgres uses the simple query protocol,
    // which takes the whole file — dollar-quoted do-block included.
    await client.query(readFileSync(SEED_PATH, "utf8"));
  } finally {
    await client.end();
  }
});
