/**
 * src/services/supabase/userFranchiseList.ts
 *
 * API functions for managing series-level (franchise) status/rating/review.
 * Independent of the per-entry list in userAnimeList.ts: the two levels are
 * never auto-reconciled. No feed entries are created here — the community
 * feed stays per-anime.
 */
import supabase from "../../supabase-client";
import type {
  UserFranchiseEntry,
  UserAnimeEntry,
  AnimeStatus,
} from "../../types/database.types";

/**
 * Get a user's franchise entry if it exists
 *
 * @param franchiseKey franchise key (AniList id of the backbone root)
 * @param userId uuid of the user
 * @returns a promise that resolves to the UserFranchiseEntry if found, or null otherwise
 */
export const getUserFranchiseEntry = async (
  franchiseKey: number,
  userId: string
): Promise<UserFranchiseEntry | null> => {
  const { data, error } = await supabase
    .from("user_franchise_entries")
    .select("*")
    .eq("franchise_key", franchiseKey)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data as UserFranchiseEntry | null;
};

/**
 * Fetch all franchise entries for a user
 *
 * @param userId uuid of the user
 * @returns array of the user's UserFranchiseEntry rows
 */
export const fetchUserFranchiseList = async (
  userId: string
): Promise<UserFranchiseEntry[]> => {
  const { data, error } = await supabase
    .from("user_franchise_entries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as UserFranchiseEntry[];
};

/**
 * Add a franchise to the user's list
 *
 * @param franchiseKey franchise key (AniList id of the backbone root)
 * @param userId uuid of the user
 * @param status series-level status (default: "not_started")
 * @returns the newly created UserFranchiseEntry
 */
export const addUserFranchiseEntry = async (
  franchiseKey: number,
  userId: string,
  status: AnimeStatus = "not_started"
): Promise<UserFranchiseEntry> => {
  const { data, error } = await supabase
    .from("user_franchise_entries")
    .insert({
      franchise_key: franchiseKey,
      user_id: userId,
      status: status,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as UserFranchiseEntry;
};

/**
 * Update an existing user franchise entry
 *
 * @param entryId uuid of the user franchise entry
 * @param updates partial updates to apply (status, rating, or review)
 * @returns the updated UserFranchiseEntry
 */
export const updateUserFranchiseEntry = async (
  entryId: string,
  updates: Partial<Pick<UserFranchiseEntry, "status" | "rating" | "review">>
): Promise<UserFranchiseEntry> => {
  const { data, error } = await supabase
    .from("user_franchise_entries")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as UserFranchiseEntry;
};

/**
 * Remove a franchise from the user's list
 *
 * @param entryId uuid of the user franchise entry to remove
 */
export const removeUserFranchiseEntry = async (
  entryId: string
): Promise<void> => {
  const { error } = await supabase
    .from("user_franchise_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw new Error(error.message);
};

/**
 * Mark all of a user's per-season entries in a franchise as completed.
 * Only ever called from the optional, user-dismissible "mark all seasons
 * completed too?" prompt — never automatically.
 *
 * @param franchiseKey franchise key shared by the anime rows
 * @param userId uuid of the user
 * @returns the updated per-season entries
 */
export const markFranchiseSeasonsCompleted = async (
  franchiseKey: number,
  userId: string
): Promise<UserAnimeEntry[]> => {
  const { data: animeRows, error: animeError } = await supabase
    .from("anime")
    .select("id")
    .eq("franchise_key", franchiseKey);
  if (animeError) throw new Error(animeError.message);

  const animeIds = (animeRows ?? []).map((row) => row.id);
  if (animeIds.length === 0) return [];

  const { data, error } = await supabase
    .from("user_anime_entries")
    .update({ status: "completed" })
    .eq("user_id", userId)
    .in("anime_id", animeIds)
    .neq("status", "completed")
    .select("*");

  if (error) throw new Error(error.message);

  return (data ?? []) as UserAnimeEntry[];
};
