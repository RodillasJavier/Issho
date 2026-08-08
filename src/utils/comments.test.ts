/** src/utils/comments.test.ts */
import { describe, expect, it } from "vitest";
import type { Comment } from "../types/database.types";
import { buildCommentTree, commentScore, sortComments } from "./comments";
import type { CommentNode } from "./comments";

const comment = (overrides: Partial<Comment> = {}): Comment => ({
  id: "c-1",
  created_at: "2026-01-01T00:00:00.000Z",
  entry_id: "entry-1",
  user_id: "user-1",
  parent_comment_id: null,
  content: "hi",
  is_spoiler: false,
  likes_count: 0,
  dislikes_count: 0,
  user_vote: null,
  ...overrides,
});

const node = (overrides: Partial<CommentNode> = {}): CommentNode => ({
  ...comment(overrides),
  children: [],
  ...overrides,
});

describe("commentScore", () => {
  it("subtracts dislikes from likes", () => {
    expect(commentScore(comment({ likes_count: 10, dislikes_count: 3 }))).toBe(
      7
    );
  });

  it("treats missing counts as zero", () => {
    expect(
      commentScore(
        comment({ likes_count: undefined, dislikes_count: undefined })
      )
    ).toBe(0);
  });
});

describe("buildCommentTree", () => {
  it("nests replies under their parent", () => {
    const flat = [
      comment({ id: "root", parent_comment_id: null }),
      comment({ id: "reply", parent_comment_id: "root" }),
    ];

    const tree = buildCommentTree(flat);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("root");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("reply");
  });

  it("nests multiple levels deep", () => {
    const flat = [
      comment({ id: "a", parent_comment_id: null }),
      comment({ id: "b", parent_comment_id: "a" }),
      comment({ id: "c", parent_comment_id: "b" }),
    ];

    const tree = buildCommentTree(flat);

    expect(tree[0].children[0].children[0].id).toBe("c");
  });

  it("silently drops a reply whose parent isn't in the set", () => {
    const flat = [comment({ id: "orphan", parent_comment_id: "missing" })];

    expect(buildCommentTree(flat)).toEqual([]);
  });
});

describe("sortComments", () => {
  it("orders by score, highest first", () => {
    const tree = [
      node({ id: "low", likes_count: 1, dislikes_count: 0 }),
      node({ id: "high", likes_count: 10, dislikes_count: 0 }),
    ];

    expect(sortComments(tree, "top").map((c) => c.id)).toEqual(["high", "low"]);
  });

  it("breaks score ties by created_at ascending", () => {
    const tree = [
      node({ id: "later", created_at: "2026-01-02T00:00:00.000Z" }),
      node({ id: "earlier", created_at: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(sortComments(tree, "top").map((c) => c.id)).toEqual([
      "earlier",
      "later",
    ]);
  });

  it("orders by newest first", () => {
    const tree = [
      node({ id: "old", created_at: "2026-01-01T00:00:00.000Z" }),
      node({ id: "new", created_at: "2026-01-02T00:00:00.000Z" }),
    ];

    expect(sortComments(tree, "new").map((c) => c.id)).toEqual(["new", "old"]);
  });

  it("orders by oldest first", () => {
    const tree = [
      node({ id: "old", created_at: "2026-01-01T00:00:00.000Z" }),
      node({ id: "new", created_at: "2026-01-02T00:00:00.000Z" }),
    ];

    expect(sortComments(tree, "old").map((c) => c.id)).toEqual(["old", "new"]);
  });

  it("recurses into children", () => {
    const tree = [
      node({
        id: "root",
        children: [
          node({ id: "low-reply", likes_count: 1 }),
          node({ id: "high-reply", likes_count: 10 }),
        ],
      }),
    ];

    expect(sortComments(tree, "top")[0].children.map((c) => c.id)).toEqual([
      "high-reply",
      "low-reply",
    ]);
  });

  it("does not mutate the input arrays", () => {
    const original = [node({ id: "a" }), node({ id: "b", likes_count: 5 })];
    const originalOrder = original.map((c) => c.id);

    sortComments(original, "top");

    expect(original.map((c) => c.id)).toEqual(originalOrder);
  });
});
