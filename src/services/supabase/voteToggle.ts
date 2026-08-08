/**
 * src/services/supabase/voteToggle.ts
 *
 * Shared mechanics behind Reddit-style up/down voting, used by both
 * votes.ts (entries) and comments.ts (comment_votes) so the toggle logic
 * and cache arithmetic each live in one place instead of two copies that
 * have to be kept in sync by hand.
 */
import supabase from "../../supabase-client";

/**
 * Cast, change, or clear (toggle off by re-clicking the same value) a vote
 * row in `table`, matched on `idColumn = targetId` and `user_id = userId`.
 *
 * @returns The caller's resulting vote: 1, -1, or null if it was cleared.
 */
export const castTableVote = async (
  table: string,
  idColumn: string,
  targetId: string,
  userId: string,
  voteValue: 1 | -1
): Promise<number | null> => {
  const { data: existingVote } = await supabase
    .from(table)
    .select("*")
    .eq(idColumn, targetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVote?.vote === voteValue) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", existingVote.id);

    if (error) throw new Error(error.message);
    return null;
  }

  if (existingVote) {
    const { error } = await supabase
      .from(table)
      .update({ vote: voteValue })
      .eq("id", existingVote.id);

    if (error) throw new Error(error.message);
    return voteValue;
  }

  const { error } = await supabase
    .from(table)
    .insert({ [idColumn]: targetId, user_id: userId, vote: voteValue });

  if (error) {
    // A concurrent request (double-click before the button disables, a
    // retry, two open tabs) can win the race between this function's
    // select and insert above, creating the row first. The unique
    // (idColumn, user_id) constraint then rejects this insert instead of
    // silently duplicating the row — fall back to updating the row that
    // won, rather than surfacing an error for what the user experiences
    // as one click.
    if (error.code === "23505") {
      const { error: retryError } = await supabase
        .from(table)
        .update({ vote: voteValue })
        .eq(idColumn, targetId)
        .eq("user_id", userId);

      if (retryError) throw new Error(retryError.message);
      return voteValue;
    }

    throw new Error(error.message);
  }
  return voteValue;
};

interface Votable {
  id: string;
  likes_count?: number;
  dislikes_count?: number;
  user_vote?: number | null;
}

/**
 * Patch a cached list with the result of casting a vote, computing new
 * like/dislike counts from the vote delta rather than refetching.
 */
export const applyVoteToCache = <T extends Votable>(
  items: T[] | undefined,
  targetId: string,
  prevVote: number | null,
  nextVote: number | null
): T[] | undefined =>
  items?.map((item) => {
    if (item.id !== targetId) return item;

    let likes = item.likes_count ?? 0;
    let dislikes = item.dislikes_count ?? 0;
    if (prevVote === 1) likes -= 1;
    if (prevVote === -1) dislikes -= 1;
    if (nextVote === 1) likes += 1;
    if (nextVote === -1) dislikes += 1;

    return {
      ...item,
      user_vote: nextVote,
      likes_count: likes,
      dislikes_count: dislikes,
    };
  });
