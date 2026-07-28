/**
 * src/api/watchlist.ts
 *
 * Bridges an AniList search result straight into a user's watchlist: imports
 * the title (and its franchise backbone) into the local database if needed,
 * then adds it to the user's list. Lets the UI hide the separate "add to
 * database" step behind a single "add to list" action.
 */
import { importAnimeFromAniList } from "./animeImport";
import { addListEntry } from "../services/supabase/userLists";
import type { AnimeStatus } from "../types/database.types";
import type { ListEntry } from "../types/listEntry";

/**
 * Import an AniList title (idempotent — reuses the existing row if already
 * present, refreshing stale data) and add it to the user's list.
 *
 * Goes through addListEntry rather than the anime service directly, so the
 * franchise this season belongs to lands on the user's profile too — the
 * import has just pulled in its whole backbone, and adding one season of a
 * show means you're watching the show.
 *
 * @param anilistId AniList media id
 * @param userId uuid of the user
 * @param status status to set for the new list entry
 * @returns the newly created list entry
 */
export const addAniListAnimeToList = async (
  anilistId: number,
  userId: string,
  status: AnimeStatus
): Promise<ListEntry> => {
  const anime = await importAnimeFromAniList(anilistId);
  return addListEntry({ kind: "anime", anime_id: anime.id }, userId, status, {
    announce: true,
  });
};
