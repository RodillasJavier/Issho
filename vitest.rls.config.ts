/// <reference types="vitest/config" />
import { defineConfig } from "vite";

/**
 * The RLS suite runs against a real Postgres, not jsdom, and shares no setup
 * with the unit tests — hence its own config rather than a `projects` entry.
 * `npm run test:rls`, or `npm run test:all` for both.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/rls/**/*.test.ts"],
    // Each file builds its own scratch database; running them concurrently
    // would have them fighting over `create database`.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
