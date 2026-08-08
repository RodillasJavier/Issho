/**
 * src/services/supabase/votes.ts
 *
 * Direct Supabase queries for the votes table (Reddit-style up/down on
 * entries). The toggle logic itself lives in voteToggle.ts, shared with
 * comments.ts's castCommentVote.
 */
import supabase from "../../supabase-client";
import type { Vote } from "../../types/database.types";
import { castTableVote } from "./voteToggle";

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
export const castVote = (
  entryId: string,
  userId: string,
  voteValue: 1 | -1
): Promise<number | null> =>
  castTableVote("votes", "entry_id", entryId, userId, voteValue);
