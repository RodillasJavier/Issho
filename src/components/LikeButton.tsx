/**
 * src/components/LikeButton.tsx
 *
 * Component for liking or disliking an entry.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import supabase from "../supabase-client";
import { useAuth } from "../hooks/useAuth";

// #region Types
interface LikeButtonProps {
  entryId: string;
}

interface Vote {
  id: string;
  entry_id: string;
  user_id: string;
  vote: number;
}
// #endregion Types

// #region Component Logic
const vote = async (voteValue: number, entryId: string, userId: string) => {
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVote) {
    if (existingVote.vote === voteValue) {
      // Remove vote if clicking the same vote again
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);

      return;
    }

    // Update vote if changing vote value
    const { error } = await supabase
      .from("votes")
      .update({ vote: voteValue })
      .eq("id", existingVote.id);

    if (error) throw new Error(error.message);

    return;
  }

  if (!existingVote) {
    // Create new vote (only if no existing vote)
    const { error } = await supabase
      .from("votes")
      .insert({ entry_id: entryId, user_id: userId, vote: voteValue });

    if (error) throw new Error(error.message);
  }
};

const fetchVotes = async (entryId: string): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("entry_id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  return data as Vote[];
};

export const LikeButton = ({ entryId }: LikeButtonProps) => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const {
    data: votes,
    isLoading,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ["votes", entryId],
    queryFn: () => fetchVotes(entryId),
  });

  const { mutate } = useMutation({
    mutationFn: (voteValue: number) => {
      if (!user) {
        throw new Error("You must be logged in to vote!");
      }
      return vote(voteValue, entryId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", entryId] });
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
  const userVote = votes?.find((v) => v.user_id === user?.id)?.vote;

  const buttonClasses = (active: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
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
