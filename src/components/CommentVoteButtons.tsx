/**
 * src/components/CommentVoteButtons.tsx
 *
 * Compact inline like/dislike control for a single comment, mirroring
 * EntryVoteButtons: reads counts and the viewer's vote straight off the
 * comment (already included in the thread fetch), and after voting patches
 * the comments cache directly rather than refetching the whole thread.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  applyVoteToCommentsCache,
  castCommentVote,
  commentsQueryKey,
} from "../services/supabase/comments";
import type { Comment } from "../types/database.types";

// #region Types
interface CommentVoteButtonsProps {
  comment: Comment;
  entryId: string;
}
// #endregion Types

// #region Component Logic
export const CommentVoteButtons = ({
  comment,
  entryId,
}: CommentVoteButtonsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userVote = comment.user_vote ?? null;

  const { mutate, isPending } = useMutation({
    mutationFn: (voteValue: 1 | -1) => {
      if (!user) {
        throw new Error("You must be logged in to vote!");
      }
      return castCommentVote(comment.id, user.id, voteValue);
    },
    onSuccess: (nextVote) => {
      queryClient.setQueryData<Comment[]>(commentsQueryKey(entryId), (old) =>
        applyVoteToCommentsCache(old, comment.id, userVote, nextVote)
      );
    },
  });

  const handleVote = (
    e: React.MouseEvent<HTMLButtonElement>,
    voteValue: 1 | -1
  ) => {
    e.preventDefault();
    e.stopPropagation();
    mutate(voteValue);
  };
  // #endregion Component Logic

  // #region Render
  const buttonClasses = (active: boolean) =>
    `flex items-center gap-1 text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
      active ? "text-rose-300" : "text-neutral-500 hover:text-white"
    }`;

  return (
    <>
      <button
        type="button"
        aria-pressed={userVote === 1}
        disabled={!user || isPending}
        title={!user ? "Sign in to react" : "Like"}
        className={buttonClasses(userVote === 1)}
        onClick={(e) => handleVote(e, 1)}
      >
        <ThumbsUp className="size-3" />
        {comment.likes_count ?? 0}
      </button>

      <button
        type="button"
        aria-pressed={userVote === -1}
        disabled={!user || isPending}
        title={!user ? "Sign in to react" : "Dislike"}
        className={buttonClasses(userVote === -1)}
        onClick={(e) => handleVote(e, -1)}
      >
        <ThumbsDown className="size-3" />
        {comment.dislikes_count ?? 0}
      </button>
    </>
  );
  // #endregion Render
};
// #endregion
