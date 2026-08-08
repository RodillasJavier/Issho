/**
 * src/services/supabase/comments.test.ts
 *
 * The comment vote cache is patched by arithmetic rather than a refetch,
 * mirroring entries.test.ts's coverage of applyVoteToEntriesCache.
 */
import { describe, expect, it, vi } from "vitest";
import type { Comment } from "../../types/database.types";

vi.mock("../../supabase-client", () => ({ default: {} }));

const { applyVoteToCommentsCache } = await import("./comments");

const comment = (overrides: Partial<Comment> = {}): Comment =>
  ({
    id: "comment-1",
    created_at: "2026-01-01T00:00:00.000Z",
    entry_id: "entry-1",
    user_id: "user-1",
    parent_comment_id: null,
    content: "hi",
    is_spoiler: false,
    likes_count: 5,
    dislikes_count: 2,
    user_vote: null,
    ...overrides,
  }) as Comment;

const target = (comments: Comment[] | undefined) =>
  comments!.find((c) => c.id === "comment-1")!;

describe("applyVoteToCommentsCache", () => {
  it("adds an upvote", () => {
    const result = target(
      applyVoteToCommentsCache([comment()], "comment-1", null, 1)
    );

    expect(result.likes_count).toBe(6);
    expect(result.dislikes_count).toBe(2);
    expect(result.user_vote).toBe(1);
  });

  it("adds a downvote", () => {
    const result = target(
      applyVoteToCommentsCache([comment()], "comment-1", null, -1)
    );

    expect(result.likes_count).toBe(5);
    expect(result.dislikes_count).toBe(3);
    expect(result.user_vote).toBe(-1);
  });

  it("retracts a vote", () => {
    const result = target(
      applyVoteToCommentsCache(
        [comment({ user_vote: 1 })],
        "comment-1",
        1,
        null
      )
    );

    expect(result.likes_count).toBe(4);
    expect(result.user_vote).toBeNull();
  });

  it("moves both counters when a vote flips", () => {
    const result = target(
      applyVoteToCommentsCache([comment({ user_vote: -1 })], "comment-1", -1, 1)
    );

    expect(result.likes_count).toBe(6);
    expect(result.dislikes_count).toBe(1);
    expect(result.user_vote).toBe(1);
  });

  it("flips the other way symmetrically", () => {
    const result = target(
      applyVoteToCommentsCache([comment({ user_vote: 1 })], "comment-1", 1, -1)
    );

    expect(result.likes_count).toBe(4);
    expect(result.dislikes_count).toBe(3);
  });

  it("treats missing counters as zero", () => {
    const result = target(
      applyVoteToCommentsCache(
        [comment({ likes_count: undefined, dislikes_count: undefined })],
        "comment-1",
        null,
        1
      )
    );

    expect(result.likes_count).toBe(1);
    expect(result.dislikes_count).toBe(0);
  });

  it("leaves other comments untouched", () => {
    const comments = [comment(), comment({ id: "comment-2", likes_count: 99 })];
    const result = applyVoteToCommentsCache(comments, "comment-1", null, 1);

    expect(result!.find((c) => c.id === "comment-2")!.likes_count).toBe(99);
  });

  it("does not mutate the cached array or its comments", () => {
    const comments = [comment()];
    applyVoteToCommentsCache(comments, "comment-1", null, 1);

    expect(comments[0].likes_count).toBe(5);
    expect(comments[0].user_vote).toBeNull();
  });

  it("passes undefined through for an unpopulated cache", () => {
    expect(
      applyVoteToCommentsCache(undefined, "comment-1", null, 1)
    ).toBeUndefined();
  });
});
