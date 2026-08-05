/**
 * src/services/supabase/entries.test.ts
 *
 * The vote cache is patched by arithmetic rather than a refetch, from three
 * separate call sites. Getting the delta wrong doesn't throw — the counter
 * just drifts away from the database until something else refetches it.
 */
import { describe, expect, it, vi } from "vitest";
import type { Entry } from "../../types/database.types";

vi.mock("../../supabase-client", () => ({ default: {} }));

const { applyVoteToEntriesCache, incrementEntryCommentCount } =
  await import("./entries");

const entry = (overrides: Partial<Entry> = {}): Entry =>
  ({
    id: "entry-1",
    created_at: "2026-01-01T00:00:00.000Z",
    content: null,
    anime_id: "anime-1",
    entry_type: "review",
    user_id: "user-1",
    rating_value: null,
    status_value: null,
    franchise_key: null,
    likes_count: 5,
    dislikes_count: 2,
    comment_count: 1,
    user_vote: null,
    ...overrides,
  }) as Entry;

const target = (entries: Entry[] | undefined) =>
  entries!.find((e) => e.id === "entry-1")!;

describe("applyVoteToEntriesCache", () => {
  it("adds an upvote", () => {
    const result = target(
      applyVoteToEntriesCache([entry()], "entry-1", null, 1)
    );

    expect(result.likes_count).toBe(6);
    expect(result.dislikes_count).toBe(2);
    expect(result.user_vote).toBe(1);
  });

  it("adds a downvote", () => {
    const result = target(
      applyVoteToEntriesCache([entry()], "entry-1", null, -1)
    );

    expect(result.likes_count).toBe(5);
    expect(result.dislikes_count).toBe(3);
    expect(result.user_vote).toBe(-1);
  });

  it("retracts a vote", () => {
    const result = target(
      applyVoteToEntriesCache([entry({ user_vote: 1 })], "entry-1", 1, null)
    );

    expect(result.likes_count).toBe(4);
    expect(result.user_vote).toBeNull();
  });

  it("moves both counters when a vote flips", () => {
    // The case that regresses silently: -1 to +1 has to decrement dislikes
    // AND increment likes, not just set the new one.
    const result = target(
      applyVoteToEntriesCache([entry({ user_vote: -1 })], "entry-1", -1, 1)
    );

    expect(result.likes_count).toBe(6);
    expect(result.dislikes_count).toBe(1);
    expect(result.user_vote).toBe(1);
  });

  it("flips the other way symmetrically", () => {
    const result = target(
      applyVoteToEntriesCache([entry({ user_vote: 1 })], "entry-1", 1, -1)
    );

    expect(result.likes_count).toBe(4);
    expect(result.dislikes_count).toBe(3);
  });

  it("treats missing counters as zero", () => {
    const result = target(
      applyVoteToEntriesCache(
        [entry({ likes_count: undefined, dislikes_count: undefined })],
        "entry-1",
        null,
        1
      )
    );

    expect(result.likes_count).toBe(1);
    expect(result.dislikes_count).toBe(0);
  });

  it("leaves other entries untouched", () => {
    const entries = [entry(), entry({ id: "entry-2", likes_count: 99 })];
    const result = applyVoteToEntriesCache(entries, "entry-1", null, 1);

    expect(result!.find((e) => e.id === "entry-2")!.likes_count).toBe(99);
  });

  it("does not mutate the cached array or its entries", () => {
    const entries = [entry()];
    applyVoteToEntriesCache(entries, "entry-1", null, 1);

    expect(entries[0].likes_count).toBe(5);
    expect(entries[0].user_vote).toBeNull();
  });

  it("passes undefined through for an unpopulated cache", () => {
    expect(
      applyVoteToEntriesCache(undefined, "entry-1", null, 1)
    ).toBeUndefined();
  });
});

describe("incrementEntryCommentCount", () => {
  it("bumps the target entry only", () => {
    const entries = [entry(), entry({ id: "entry-2", comment_count: 7 })];
    const result = incrementEntryCommentCount(entries, "entry-1");

    expect(target(result).comment_count).toBe(2);
    expect(result!.find((e) => e.id === "entry-2")!.comment_count).toBe(7);
  });

  it("treats a missing count as zero", () => {
    const result = incrementEntryCommentCount(
      [entry({ comment_count: undefined })],
      "entry-1"
    );

    expect(target(result).comment_count).toBe(1);
  });

  it("passes undefined through for an unpopulated cache", () => {
    expect(incrementEntryCommentCount(undefined, "entry-1")).toBeUndefined();
  });
});
