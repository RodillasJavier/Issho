import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against the local Supabase stack — real GoTrue, real RLS, real Postgres.
 *
 * Start the backend first (`supabase start`), then `npm run test:e2e`. The dev
 * server is launched here and pointed at the local API rather than production.
 *
 * The anon key below is Supabase's well-known local development key. It is the
 * same for every local stack in the world and only works against 127.0.0.1, so
 * it is committed deliberately rather than hidden in an env file no one has.
 */
const LOCAL_SUPABASE_URL = "http://127.0.0.1:54421";
const LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const PORT = 5273;

export default defineConfig({
  testDir: "./tests/e2e",
  // One seeded database, shared by every spec, and several of them act as the
  // same user — so parallel workers trip over each other's writes. The whole
  // suite runs in about 20s serially, which is a cheap price for not chasing
  // order-dependent flakes.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Restores supabase/seed.sql. A setup project rather than a step in the npm
    // script, so it also covers `--ui` and single-test re-runs — the specs
    // mutate shared state, so every run needs a clean fixture, not just the
    // first one after a `supabase db reset`.
    { name: "setup", testMatch: /seed\.setup\.ts$/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    // --host is load-bearing: Vite otherwise binds IPv6 localhost only, and
    // the 127.0.0.1 health check never answers.
    command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: LOCAL_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: LOCAL_ANON_KEY,
    },
  },
});
