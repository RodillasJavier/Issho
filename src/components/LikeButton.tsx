/**
 * src/components/LikeButton.tsx
 *
 * Component for liking or disliking an entry.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  return (
    <div className="flex items-center gap-4">
      <button
        className={`cursor-pointer p-2 rounded transition-colors duration-250 ${Number(userVote) === 1 ? "bg-green-500/50" : "bg-neutral-900"}`}
        onClick={() => mutate(1)}
      >
        👍 {likes}
      </button>

      <button
        className={`cursor-pointer p-2 rounded transition-colors duration-250 ${Number(userVote) === -1 ? "bg-red-500/50" : "bg-neutral-900"}`}
        onClick={() => mutate(-1)}
      >
        👎 {dislikes}
      </button>
    </div>
  );
};
// #endregion Render
