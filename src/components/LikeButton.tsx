/**
 * src/components/LikeButton.tsx
 *
 * Component for liking or disliking an entry.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getVotes, castVote } from "../services/supabase/votes";
import { applyVoteToEntriesCache } from "../services/supabase/entries";
import type { Entry } from "../types/database.types";

// #region Types
interface LikeButtonProps {
  entryId: string;
}
// #endregion Types

// #region Component Logic
export const LikeButton = ({ entryId }: LikeButtonProps) => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const {
    data: votes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["votes", entryId],
    queryFn: () => getVotes(entryId),
  });

  const userVote = votes?.find((v) => v.user_id === user?.id)?.vote ?? null;

  const { mutate, isPending } = useMutation({
    mutationFn: (voteValue: 1 | -1) => {
      if (!user) {
        throw new Error("You must be logged in to vote!");
      }
      return castVote(entryId, user.id, voteValue);
    },
    onSuccess: async (nextVote) => {
      const freshVotes = await getVotes(entryId);
      queryClient.setQueryData(["votes", entryId], freshVotes);

      // Keep the cached feed list's counts in sync so navigating back
      // shows the up-to-date numbers instead of the stale initial fetch.
      queryClient.setQueryData<Entry[]>(["entries"], (old) =>
        applyVoteToEntriesCache(old, entryId, userVote, nextVote)
      );
    },
  });
  // #endregion Component Logic

  // #region Render
  if (isLoading) {
    return <div>Loading votes...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading post: {error.message}</div>;
  }

  const likes = votes?.filter((v) => v.vote === 1).length || 0;
  const dislikes = votes?.filter((v) => v.vote === -1).length || 0;

  const buttonClasses = (active: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
      active
        ? "border-rose-400/50 bg-rose-400/10 text-rose-200"
        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
    }`;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Reaction
        </p>
        <p className="text-[11px] text-neutral-600">Was this helpful?</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          aria-pressed={Number(userVote) === 1}
          disabled={!user || isPending}
          title={!user ? "Sign in to react" : undefined}
          className={buttonClasses(Number(userVote) === 1)}
          onClick={() => mutate(1)}
        >
          <span className="flex items-center gap-1.5">
            <ThumbsUp className="size-3.5" />
            Helpful
          </span>
          <span className="font-mono text-neutral-500">{likes}</span>
        </button>

        <button
          aria-pressed={Number(userVote) === -1}
          disabled={!user || isPending}
          title={!user ? "Sign in to react" : undefined}
          className={buttonClasses(Number(userVote) === -1)}
          onClick={() => mutate(-1)}
        >
          <span className="flex items-center gap-1.5">
            <ThumbsDown className="size-3.5" />
            Not helpful
          </span>
          <span className="font-mono text-neutral-500">{dislikes}</span>
        </button>
      </div>
    </div>
  );
};
// #endregion Render
