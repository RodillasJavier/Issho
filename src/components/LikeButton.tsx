import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { useAuth } from "../hooks/useAuth";

interface LikeButtonProps {
  postId: number;
}

interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
}

const vote = async (voteValue: number, postId: number, userId: string) => {
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVote) {
    if (existingVote.vote === voteValue) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (existingVote.vote !== voteValue) {
      const { error } = await supabase
        .from("votes")
        .update({ vote: voteValue })
        .eq("id", existingVote.id);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  if (!existingVote) {
    const { error } = await supabase
      .from("votes")
      .insert({ post_id: postId, user_id: userId, vote: voteValue });

    if (error) {
      throw new Error(error.message);
    }
  }
};

const fetchVotes = async (postId: number): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId);

  if (error) {
    throw new Error(error.message);
  }

  return data as Vote[];
};

export const LikeButton = ({ postId }: LikeButtonProps) => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const {
    data: votes,
    isLoading,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ["votes", postId],
    queryFn: () => fetchVotes(postId),
  });

  const { mutate } = useMutation({
    mutationFn: (voteValue: number) => {
      if (!user) {
        throw new Error("You must be logged in to vote!");
      }

      return vote(voteValue, postId, user?.id);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", postId] });
    },
  });

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
