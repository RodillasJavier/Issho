/**
 * src/components/EntryVoteButtons.tsx
 *
 * Compact inline like/dislike control for a feed card footer — lets users
 * react to an entry without opening it. Reads its counts and the viewer's
 * current vote straight off the entry (already included in the bulk feed
 * fetch), and after voting patches that same cached list so the numbers
 * update immediately without refetching the whole feed.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { castVote } from "../services/supabase/votes";
import {
  applyVoteToEntriesCache,
  entriesQueryKey,
} from "../services/supabase/entries";
import {
  hasAuthor,
  type Entry,
  type PublicEntry,
} from "../types/database.types";

// #region Types
interface EntryVoteButtonsProps {
  entry: Entry | PublicEntry;
}
// #endregion Types

// #region Component Logic
export const EntryVoteButtons = ({ entry }: EntryVoteButtonsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Public (logged-out) entries carry no viewer vote — the buttons render
  // disabled for them anyway, since voting requires a session.
  const userVote = hasAuthor(entry) ? (entry.user_vote ?? null) : null;

  const { mutate, isPending } = useMutation({
    mutationFn: (voteValue: 1 | -1) => {
      if (!user) {
        throw new Error("You must be logged in to vote!");
      }
      return castVote(entry.id, user.id, voteValue);
    },
    onSuccess: (nextVote) => {
      queryClient.setQueryData<Entry[]>(entriesQueryKey(user?.id), (old) =>
        applyVoteToEntriesCache(old, entry.id, userVote, nextVote)
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
    `flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
      active ? "text-rose-300" : "text-neutral-500 hover:text-white"
    }`;

  return (
    <>
      <button
        type="button"
        aria-pressed={userVote === 1}
        disabled={!user || isPending}
        title={!user ? "Sign in to react" : "Helpful"}
        className={buttonClasses(userVote === 1)}
        onClick={(e) => handleVote(e, 1)}
      >
        <ThumbsUp className="size-3.5" />
        {entry.likes_count ?? 0}
      </button>

      <button
        type="button"
        aria-pressed={userVote === -1}
        disabled={!user || isPending}
        title={!user ? "Sign in to react" : "Not helpful"}
        className={buttonClasses(userVote === -1)}
        onClick={(e) => handleVote(e, -1)}
      >
        <ThumbsDown className="size-3.5" />
        {entry.dislikes_count ?? 0}
      </button>
    </>
  );
  // #endregion Render
};
// #endregion
