/**
 * src/services/supabase/votes.ts
 *
 * Direct Supabase queries for the votes table (Reddit-style up/down on
 * entries).
 */
import supabase from "../../supabase-client";
import type { Vote } from "../../types/database.types";

export const getVotes = async (entryId: string): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("entry_id", entryId);

  if (error) throw new Error(error.message);
  return data as Vote[];
};

/**
 * Cast, change, or clear (toggle off by re-clicking the same value) a vote.
 *
 * @returns The caller's resulting vote: 1, -1, or null if it was cleared.
 */
export const castVote = async (
  entryId: string,
  userId: string,
  voteValue: 1 | -1
): Promise<number | null> => {
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVote?.vote === voteValue) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("id", existingVote.id);

    if (error) throw new Error(error.message);
    return null;
  }

  if (existingVote) {
    const { error } = await supabase
      .from("votes")
      .update({ vote: voteValue })
      .eq("id", existingVote.id);

    if (error) throw new Error(error.message);
    return voteValue;
  }

  const { error } = await supabase
    .from("votes")
    .insert({ entry_id: entryId, user_id: userId, vote: voteValue });

  if (error) throw new Error(error.message);
  return voteValue;
};
