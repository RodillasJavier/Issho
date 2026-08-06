/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    // Only the co-located unit tests. `tests/` holds the RLS suite, which
    // needs a real Postgres and runs from vitest.rls.config.ts — without this
    // the default glob would pull it in here and fail whenever no database
    // happens to be running.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Every suite gets a DOM. The pure-logic tests don't need one, but a
    // single environment keeps component and unit tests in one run rather
    // than splitting the config for a startup cost that isn't worth it.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Nothing asserts on styles, and Tailwind v4 processing them is pure cost.
    css: false,
    // formatRelativeTime falls through to toLocaleDateString past two days,
    // which is timezone-dependent. Pin it so a test that passes here passes
    // in CI and in whatever timezone the next contributor lives in.
    env: { TZ: "UTC" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Barrel/type-only and entry files have nothing to assert about.
      exclude: ["src/main.tsx", "src/test/**", "**/*.d.ts", "src/types/**"],
    },
  },
});
