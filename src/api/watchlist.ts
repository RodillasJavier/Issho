/**
 * src/api/watchlist.ts
 *
 * Bridges an AniList search result straight into a user's watchlist: imports
 * the title (and its franchise backbone) into the local database if needed,
 * then adds it to the user's list. Lets the UI hide the separate "add to
 * database" step behind a single "add to list" action.
 */
import { importAnimeFromAniList } from "./animeImport";
import { addUserAnimeEntry } from "../services/supabase/userAnimeList";
import type { AnimeStatus, UserAnimeEntry } from "../types/database.types";

/**
 * Import an AniList title (idempotent — reuses the existing row if already
 * present, refreshing stale data) and add it to the user's list.
 *
 * @param anilistId AniList media id
 * @param userId uuid of the user
 * @param status status to set for the new list entry
 * @returns the newly created UserAnimeEntry
 */
export const addAniListAnimeToList = async (
  anilistId: number,
  userId: string,
  status: AnimeStatus
): Promise<UserAnimeEntry> => {
  const anime = await importAnimeFromAniList(anilistId);
  return addUserAnimeEntry(anime.id, userId, status);
};
