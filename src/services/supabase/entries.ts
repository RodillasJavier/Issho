/**
 * src/services/supabase/entries.ts
 *
 * Bulk activity-feed fetch: entries with vote/comment counts (via the
 * get_entries_with_counts RPC) joined with anime and profile data in
 * memory. Shared under the entriesQueryKey(userId) key by EntryList (the
 * homepage feed), FriendsPage (per-friend channel previews), and
 * FranchisePage (series-level posts, filtered client-side by
 * franchise_key), so the second consumer to mount never triggers an extra
 * network fetch once the first has warmed the cache.
 *
 * What comes back is already friend-scoped: RLS on `entries` only exposes
 * rows the viewer authored or whose author they're friends with, and
 * get_entries_with_counts is deliberately NOT security definer so it
 * inherits that. Logged-out visitors take the separate fetchPublicFeed
 * path, which never receives author identity at all.
 */
import supabase from "../../supabase-client";
import type { Entry, PublicEntry } from "../../types/database.types";

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

/**
 * Query key for the shared feed cache. Keyed on the viewer because the rows
 * are RLS-scoped to them — without this, signing out and back in as someone
 * else would serve the previous user's entries from cache.
 */
export const entriesQueryKey = (userId: string | undefined) =>
  ["entries", userId] as const;

/** Query key for the de-identified logged-out feed. */
export const publicEntriesQueryKey = ["publicEntries"] as const;

/** Attach anime rows (public data) to a set of entries, joined in memory. */
const attachAnime = async <T extends { anime_id: string }>(
  entries: T[]
): Promise<(T & { anime?: AnimeData })[]> => {
  const animeIds = [...new Set(entries.map((entry) => entry.anime_id))];
  const { data: animeData } = await supabase
    .from("anime")
    .select(
      "id, name, cover_image_url, franchise_title, franchise_key, banner_image_url"
    )
    .in("id", animeIds);

  return entries.map((entry) => ({
    ...entry,
    anime: animeData?.find((a: AnimeData) => a.id === entry.anime_id),
  }));
};

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
  const userIds = [...new Set(entries.map((entry) => entry.user_id))];

  const [withAnime, { data: profileData }] = await Promise.all([
    attachAnime(entries),
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds),
  ]);

  return withAnime.map((entry) => ({
    ...entry,
    profile: profileData?.find((p: ProfileData) => p.id === entry.user_id),
  })) as Entry[];
};

/**
 * The logged-out feed. Goes through get_public_feed rather than the entries
 * table: that RPC's return type has no user_id column and there is no
 * profiles lookup here, so no author identity ever reaches the browser.
 * Anime art is still joined — it carries nothing identifying.
 */
export const fetchPublicFeed = async (): Promise<PublicEntry[]> => {
  const { data, error } = await supabase.rpc("get_public_feed");
  if (error) throw new Error(error.message);

  const entries = (data ?? []) as PublicEntry[];
  if (entries.length === 0) return [];

  return (await attachAnime(entries)) as PublicEntry[];
};

/** Single de-identified entry, for /entry/:id when logged out. */
export const fetchPublicEntry = async (
  entryId: string
): Promise<PublicEntry | null> => {
  const { data, error } = await supabase.rpc("get_public_entry", {
    e_id: entryId,
  });
  if (error) throw new Error(error.message);

  const entries = (data ?? []) as PublicEntry[];
  if (entries.length === 0) return null;

  return (await attachAnime(entries))[0] as PublicEntry;
};

/**
 * Patch a cached feed list with the result of casting a vote,
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

/** Patch a cached feed list after a new comment is posted. */
export const incrementEntryCommentCount = (
  entries: Entry[] | undefined,
  entryId: string
): Entry[] | undefined =>
  entries?.map((entry) =>
    entry.id === entryId
      ? { ...entry, comment_count: (entry.comment_count ?? 0) + 1 }
      : entry
  );
