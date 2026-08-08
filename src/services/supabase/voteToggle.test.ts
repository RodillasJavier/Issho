/**
 * src/services/supabase/voteToggle.test.ts
 *
 * castTableVote is shared by votes.ts and comment_votes.ts, so its full
 * select-then-branch toggle (including the retry-on-conflict path added
 * alongside the unique(idColumn, user_id) constraints) is tested once here
 * rather than per call site. The Supabase client is faked with a minimal
 * chainable-and-thenable builder — .eq() returns the same object so any
 * number of .eq() calls can be chained, and awaiting the object at any
 * point resolves it, matching how supabase-js's query builder behaves.
 */
import { describe, expect, it, vi } from "vitest";

interface MockResult {
  data?: unknown;
  error?: { code?: string; message: string } | null;
}

const chainable = (result: MockResult) => {
  const obj: PromiseLike<MockResult> & { eq: () => typeof obj } = {
    eq: () => obj,
    then: (onFulfilled, onRejected) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return obj;
};

/**
 * @param existingVote row returned by the initial select, or null/undefined
 * @param insertError error the insert call should return
 */
const mockSupabaseFor = (options: {
  existingVote?: { id: string; vote: number } | null;
  insertError?: { code?: string; message: string };
}) => {
  const update = vi.fn(() => chainable({ error: null }));
  const del = vi.fn(() => chainable({ error: null }));
  const insert = vi.fn(() =>
    Promise.resolve({ error: options.insertError ?? null })
  );

  const from = vi.fn(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: options.existingVote ?? null }),
        }),
      }),
    }),
    insert,
    update,
    delete: del,
  }));

  return { from, update, delete: del, insert };
};

// Reassigned per-test before each castTableVote call. vi.mock is hoisted
// above this file's other statements, so the factory below can't close
// over a per-test variable directly — instead it wraps `from` in a
// function that reads mockClientRef at call time, once it's been set.
let mockClientRef: ReturnType<typeof mockSupabaseFor>;

vi.mock("../../supabase-client", () => ({
  default: {
    from: (...args: Parameters<ReturnType<typeof mockSupabaseFor>["from"]>) =>
      mockClientRef.from(...args),
  },
}));

const { castTableVote } = await import("./voteToggle");

describe("castTableVote", () => {
  it("inserts a fresh vote when none exists", async () => {
    const mock = mockSupabaseFor({ existingVote: null });
    mockClientRef = mock;

    const result = await castTableVote(
      "votes",
      "entry_id",
      "entry-1",
      "user-1",
      1
    );

    expect(result).toBe(1);
    expect(mock.insert).toHaveBeenCalledWith({
      entry_id: "entry-1",
      user_id: "user-1",
      vote: 1,
    });
  });

  it("deletes (toggles off) when re-casting the same value", async () => {
    const mock = mockSupabaseFor({
      existingVote: { id: "vote-1", vote: 1 },
    });
    mockClientRef = mock;

    const result = await castTableVote(
      "votes",
      "entry_id",
      "entry-1",
      "user-1",
      1
    );

    expect(result).toBeNull();
    expect(mock.delete).toHaveBeenCalled();
  });

  it("updates when changing to a different value", async () => {
    const mock = mockSupabaseFor({
      existingVote: { id: "vote-1", vote: 1 },
    });
    mockClientRef = mock;

    const result = await castTableVote(
      "votes",
      "entry_id",
      "entry-1",
      "user-1",
      -1
    );

    expect(result).toBe(-1);
    expect(mock.update).toHaveBeenCalledWith({ vote: -1 });
  });

  it("retries as an update when a concurrent insert wins the unique-constraint race", async () => {
    const mock = mockSupabaseFor({
      existingVote: null,
      insertError: { code: "23505", message: "duplicate key value" },
    });
    mockClientRef = mock;

    const result = await castTableVote(
      "comment_votes",
      "comment_id",
      "comment-1",
      "user-1",
      1
    );

    expect(result).toBe(1);
    expect(mock.update).toHaveBeenCalledWith({ vote: 1 });
  });

  it("surfaces a non-conflict insert error instead of retrying", async () => {
    const mock = mockSupabaseFor({
      existingVote: null,
      insertError: { code: "42501", message: "permission denied" },
    });
    mockClientRef = mock;

    await expect(
      castTableVote("votes", "entry_id", "entry-1", "user-1", 1)
    ).rejects.toThrow("permission denied");
    expect(mock.update).not.toHaveBeenCalled();
  });
});
