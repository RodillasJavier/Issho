/**
 * src/services/supabase/userLists.test.ts
 *
 * `seriesStatusFor` (write side, here) and `deriveSeriesStatus` (display side,
 * in utils/listEntries.ts) encode one product rule in two files that share no
 * code. Until now the only thing keeping them in step was a pair of docstrings
 * asking nicely.
 */
import { describe, expect, it, vi } from "vitest";
import type { AnimeStatus } from "../../types/database.types";
import { deriveSeriesStatus } from "../../utils/listEntries";

// The module builds a Supabase client at import time; nothing here touches it.
vi.mock("../../supabase-client", () => ({ default: {} }));

const { listInvalidationKeys, seriesStatusFor, userListQueryKey } =
  await import("./userLists");

const ALL_STATUSES: AnimeStatus[] = [
  "not_started",
  "watching",
  "completed",
  "dropped",
];

describe("seriesStatusFor", () => {
  it("caps a completed season at watching", () => {
    expect(seriesStatusFor("completed")).toBe("watching");
  });

  it.each(["not_started", "watching", "dropped"] satisfies AnimeStatus[])(
    "passes %s through unchanged",
    (status) => {
      expect(seriesStatusFor(status)).toBe(status);
    }
  );
});

describe("the series-status rule, across both sides", () => {
  // If someone teaches one side that a finished season means a finished
  // series, this fails — whichever side they changed.
  it("never declares a series completed on either side", () => {
    for (const status of ALL_STATUSES) {
      expect(seriesStatusFor(status)).not.toBe("completed");
      expect(deriveSeriesStatus([status])).not.toBe("completed");
    }
  });

  it("agrees on what a single season implies about its series", () => {
    for (const status of ALL_STATUSES) {
      expect(seriesStatusFor(status)).toBe(deriveSeriesStatus([status]));
    }
  });
});

describe("query keys", () => {
  it("scopes the list key to the viewer", () => {
    expect(userListQueryKey("user-a")).toEqual(["userList", "user-a"]);
    expect(userListQueryKey(undefined)).toEqual(["userList", undefined]);
  });

  it("invalidates both physical tables alongside the facade key", () => {
    // Seeding a series row on a season add writes to both levels, so a write
    // that only invalidated its own table would leave the other stale.
    expect(listInvalidationKeys("user-a")).toEqual([
      ["userList", "user-a"],
      ["userAnimeList"],
      ["userFranchiseList"],
    ]);
  });
});
