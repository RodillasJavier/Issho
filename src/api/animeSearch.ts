/**
 * src/api/animeSearch.ts
 *
 * Anime search against the AniList API. Local search happens in-memory over
 * the already-loaded `["anime"]` list, so there's no DB search here.
 */
import {
  searchAnime as searchAniList,
  withRetry,
} from "../services/anilistApi";
import type { AniListMedia } from "../services/anilistApi";

/**
 * Search anime from the AniList API
 *
 * @param query search string
 * @returns Array of AniListMedia objects matching the query
 */
export const searchAnimeFromAniList = async (
  query: string
): Promise<AniListMedia[]> => {
  try {
    return await withRetry(() => searchAniList(query, 10));
  } catch (error) {
    console.error("Error searching anime from AniList:", error);
    throw error;
  }
};
