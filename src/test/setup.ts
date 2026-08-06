/**
 * src/test/setup.ts
 *
 * Global test setup: DOM matchers, and a clean slate between tests.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  // RTL only auto-cleans when globals are injected by its own framework
  // adapter; doing it here keeps it true regardless of how a suite renders.
  cleanup();
  vi.restoreAllMocks();
});
