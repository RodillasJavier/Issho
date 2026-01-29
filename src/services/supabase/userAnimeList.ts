/**
 * src/api/userAnimeList.ts
 *
 * API functions for managing user anime lists.
 */
import supabase from "../../supabase-client";
import type { UserAnimeEntry, AnimeStatus } from "../../types/database.types";

/**
 * Fetch all anime entries for a user, optionally filtered by status
 *
 * @param userId uuid of the user
 * @param status (optional) filter by anime status
 * @returns a promise that resolves to an array of UserAnimeEntry objects
 */
export const fetchUserAnimeList = async (
  userId: string,
  status?: AnimeStatus
): Promise<UserAnimeEntry[]> => {
  let query = supabase
    .from("user_anime_entries")
    .select("*, anime(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data as UserAnimeEntry[];
};

/**
 * Get a user's anime entry if it exists
 *
 * @param animeId uuid of the anime
 * @param userId uuid of the user
 * @returns a promise that resolves to the UserAnimeEntry if found, or null otherwise
 */
export const getUserAnimeEntry = async (
  animeId: string,
  userId: string
): Promise<UserAnimeEntry | null> => {
  const { data, error } = await supabase
    .from("user_anime_entries")
    .select("*, anime(*)")
    .eq("anime_id", animeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data as UserAnimeEntry | null;
};

/**
 * Add an anime to the user's list
 *
 * @param animeId uuid of the anime
 * @param userId uuid of the user
 * @param status status of the anime in the user's list (default: "not_started")
 * @returns the newly created UserAnimeEntry
 */
export const addUserAnimeEntry = async (
  animeId: string,
  userId: string,
  status: AnimeStatus = "not_started"
): Promise<UserAnimeEntry> => {
  const { data, error } = await supabase
    .from("user_anime_entries")
    .insert({
      anime_id: animeId,
      user_id: userId,
      status: status,
    })
    .select("*, anime(*)")
    .single();

  if (error) throw new Error(error.message);

  return data as UserAnimeEntry;
};

/**
 * Update an existing user anime entry
 *
 * @param entryId uuid of the user anime entry
 * @param updates partial updates to apply (status, rating, or review)
 * @returns the updated UserAnimeEntry
 */
export const updateUserAnimeEntry = async (
  entryId: string,
  updates: Partial<Pick<UserAnimeEntry, "status" | "rating" | "review">>
): Promise<UserAnimeEntry> => {
  const { data, error } = await supabase
    .from("user_anime_entries")
    .update(updates)
    .eq("id", entryId)
    .select("*, anime(*)")
    .single();

  if (error) throw new Error(error.message);

  return data as UserAnimeEntry;
};

/**
 * Remove an anime from the user's list
 *
 * @param entryId uuid of the user anime entry to remove
 */
export const removeUserAnimeEntry = async (entryId: string): Promise<void> => {
  const { error } = await supabase
    .from("user_anime_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw new Error(error.message);
};

/**
 * Get statistics for a user's anime list
 *
 * @param userId uuid of the user
 * @returns an object containing list statistics
 */
export const getUserListStats = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_anime_entries")
    .select("status, rating")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const stats = {
    total: data.length,
    watching: data.filter((entry) => entry.status === "watching").length,
    completed: data.filter((entry) => entry.status === "completed").length,
    dropped: data.filter((entry) => entry.status === "dropped").length,
    notStarted: data.filter((entry) => entry.status === "not_started").length,
    avgRating:
      data.filter((entry) => entry.rating !== null).length > 0
        ? (
            data
              .filter((entry) => entry.rating !== null)
              .reduce((sum, entry) => sum + (entry.rating || 0), 0) /
            data.filter((entry) => entry.rating !== null).length
          ).toFixed(1)
        : "N/A",
  };

  return stats;
};
