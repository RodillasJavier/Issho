/**
 * src/services/supabase/entries.ts
 *
 * Bulk activity-feed fetch: entries with vote/comment counts (via the
 * get_entries_with_counts RPC) joined with anime and profile data in
 * memory. Shared under the ["entries"] query key by EntryList (the
 * homepage feed), FriendsPage (per-friend channel previews), and
 * FranchisePage (series-level posts, filtered client-side by
 * franchise_key), so the second consumer to mount never triggers an extra
 * network fetch once the first has warmed the cache.
 */
import supabase from "../../supabase-client";
import type { Entry } from "../../types/database.types";

// #region Types
interface EntryWithCounts {
  id: string;
  anime_id: string;
  user_id: string;
  entry_type: string;
  content: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  comment_count: number;
  rating_value: number | null;
  status_value: string | null;
  franchise_key: number | null;
  user_vote: number | null;
}

interface AnimeData {
  id: string;
  name: string;
  cover_image_url: string | null;
  franchise_title: string | null;
  franchise_key: number | null;
  banner_image_url: string | null;
}

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
}
// #endregion Types

export const fetchEntriesWithCounts = async (): Promise<Entry[]> => {
  const { data: entriesWithCounts, error } = await supabase.rpc(
    "get_entries_with_counts"
  );
  if (error) throw new Error(error.message);

  const entries = entriesWithCounts as EntryWithCounts[];
  if (entries.length === 0) {
    return [];
  }

  // Fetch anime and profile data separately (independent, so run them
  // concurrently) and join in memory
  const animeIds = [...new Set(entries.map((entry) => entry.anime_id))];
  const userIds = [...new Set(entries.map((entry) => entry.user_id))];

  const [{ data: animeData }, { data: profileData }] = await Promise.all([
    supabase
      .from("anime")
      .select(
        "id, name, cover_image_url, franchise_title, franchise_key, banner_image_url"
      )
      .in("id", animeIds),
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds),
  ]);

  return entries.map((entry) => ({
    ...entry,
    anime: animeData?.find((a: AnimeData) => a.id === entry.anime_id),
    profile: profileData?.find((p: ProfileData) => p.id === entry.user_id),
  })) as Entry[];
};

/**
 * Patch a cached ["entries"] list with the result of casting a vote,
 * computing the new like/dislike counts from the vote delta rather than
 * refetching. Shared by every vote surface (LikeButton, EntryVoteButtons)
 * so there's one place that knows how to reconcile a vote into this cache.
 */
export const applyVoteToEntriesCache = (
  entries: Entry[] | undefined,
  entryId: string,
  prevVote: number | null,
  nextVote: number | null
): Entry[] | undefined =>
  entries?.map((entry) => {
    if (entry.id !== entryId) return entry;

    let likes = entry.likes_count ?? 0;
    let dislikes = entry.dislikes_count ?? 0;
    if (prevVote === 1) likes -= 1;
    if (prevVote === -1) dislikes -= 1;
    if (nextVote === 1) likes += 1;
    if (nextVote === -1) dislikes += 1;

    return {
      ...entry,
      user_vote: nextVote,
      likes_count: likes,
      dislikes_count: dislikes,
    };
  });

/** Patch a cached ["entries"] list after a new comment is posted. */
export const incrementEntryCommentCount = (
  entries: Entry[] | undefined,
  entryId: string
): Entry[] | undefined =>
  entries?.map((entry) =>
    entry.id === entryId
      ? { ...entry, comment_count: (entry.comment_count ?? 0) + 1 }
      : entry
  );
