/**
 * src/services/supabase/comments.ts
 *
 * Comment CRUD and voting for an entry's thread: a flat fetch (via the
 * get_comments_with_counts RPC, joined with profiles in memory — same
 * RPC-then-join pattern as fetchEntriesWithCounts in entries.ts), posting a
 * root comment or reply through one function, and a Reddit-style vote toggle
 * on comment_votes built on voteToggle.ts's shared mechanics.
 */
import supabase from "../../supabase-client";
import type { Comment } from "../../types/database.types";
import { applyVoteToCache, castTableVote } from "./voteToggle";

// #region Types
interface CommentWithCounts {
  id: string;
  created_at: string;
  entry_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_spoiler: boolean;
  likes_count: number;
  dislikes_count: number;
  user_vote: number | null;
}

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
}
// #endregion Types

/** Query key for a single entry's comment thread, scoped by entryId since
 * comments are RLS-scoped just like votes/entries. */
export const commentsQueryKey = (entryId: string) =>
  ["comments", entryId] as const;

export const fetchComments = async (entryId: string): Promise<Comment[]> => {
  const { data, error } = await supabase.rpc("get_comments_with_counts", {
    p_entry_id: entryId,
  });
  if (error) throw new Error(error.message);

  const comments = data as CommentWithCounts[];
  if (comments.length === 0) {
    return [];
  }

  const userIds = [...new Set(comments.map((comment) => comment.user_id))];
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  if (profileError) throw new Error(profileError.message);

  return comments.map((comment) => ({
    ...comment,
    profile: profileData?.find((p: ProfileData) => p.id === comment.user_id),
  })) as Comment[];
};

/** Post a root comment (parentCommentId omitted) or a reply. */
export const postComment = async (
  entryId: string,
  userId: string | undefined,
  content: string,
  parentCommentId: string | null = null
): Promise<void> => {
  if (!userId) {
    throw new Error(
      parentCommentId
        ? "You must be logged in to reply."
        : "You must be logged in to comment."
    );
  }

  const { error } = await supabase.from("comments").insert({
    entry_id: entryId,
    content,
    parent_comment_id: parentCommentId,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Cast, change, or clear (toggle off by re-clicking the same value) a vote
 * on a comment.
 *
 * @returns The caller's resulting vote: 1, -1, or null if it was cleared.
 */
export const castCommentVote = (
  commentId: string,
  userId: string,
  voteValue: 1 | -1
): Promise<number | null> =>
  castTableVote("comment_votes", "comment_id", commentId, userId, voteValue);

/**
 * Patch a cached flat comment list with the result of casting a vote.
 * Operates on the flat array cached under commentsQueryKey — the reply
 * tree is rebuilt from it at render time (buildCommentTree), so no
 * recursive walk is needed here.
 */
export const applyVoteToCommentsCache = (
  comments: Comment[] | undefined,
  commentId: string,
  prevVote: number | null,
  nextVote: number | null
): Comment[] | undefined =>
  applyVoteToCache(comments, commentId, prevVote, nextVote);
