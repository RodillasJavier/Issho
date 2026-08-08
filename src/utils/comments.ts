/**
 * src/utils/comments.ts
 *
 * Client-side derivation over a flat comment list: turning it into a reply
 * tree, and ordering that tree by score or recency. Pure and DB-free, unlike
 * services/supabase/comments.ts.
 */
import type { CommentSort } from "../constants/commentSort";
import type { Comment } from "../types/database.types";

// #region Types
export type CommentNode = Comment & { children: CommentNode[] };
// #endregion Types

/**
 * Turn a flat comment list (as fetched for one entry) into a tree of roots
 * with nested `children`. A reply whose parent isn't in the set (e.g. a
 * mid-fetch delete race) is silently dropped rather than surfaced as an
 * orphaned root — it can't happen under normal use since parent_comment_id
 * cascades on delete, but the fetch itself isn't transactional.
 */
export const buildCommentTree = (flatComments: Comment[]): CommentNode[] => {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  flatComments.forEach((comment) => {
    map.set(comment.id, { ...comment, children: [] });
  });

  flatComments.forEach((comment) => {
    const node = map.get(comment.id)!;

    if (comment.parent_comment_id) {
      map.get(comment.parent_comment_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const commentScore = (comment: Comment): number =>
  (comment.likes_count ?? 0) - (comment.dislikes_count ?? 0);

/**
 * Sort a comment tree by the given mode, recursing into every node's
 * children so reply order within a thread also respects the active sort.
 * Returns new arrays at every level rather than mutating in place.
 *
 * "top" falls back to created_at ascending as a stable tiebreak: buildCommentTree
 * produces a new array reference on every fetch/render, so relying on
 * Array.sort's stability alone would still let equal-score comments jitter
 * between renders.
 */
export const sortComments = (
  comments: CommentNode[],
  sort: CommentSort
): CommentNode[] => {
  const compare = (a: CommentNode, b: CommentNode): number => {
    if (sort === "top") {
      return (
        commentScore(b) - commentScore(a) ||
        Date.parse(a.created_at) - Date.parse(b.created_at)
      );
    }

    const timeDiff = Date.parse(b.created_at) - Date.parse(a.created_at);
    return sort === "new" ? timeDiff : -timeDiff;
  };

  return [...comments].sort(compare).map((comment) => ({
    ...comment,
    children: sortComments(comment.children, sort),
  }));
};
