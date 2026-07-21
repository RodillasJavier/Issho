/**
 * src/api/animeSearch.ts
 *
 * API functions for searching anime from both AniList API and local database
 */
import supabase from "../supabase-client";
import {
  searchAnime as searchAniList,
  withRetry,
} from "../services/anilistApi";
import type { AniListMedia } from "../services/anilistApi";
import type { Anime } from "../types/database.types";

// #region Types

export interface CombinedSearchResults {
  localResults: Anime[];
  anilistResults: AniListMedia[];
}

// #endregion Types

/**
 * Seach anime in local database by name
 *
 * @param query search string
 * @returns Array of Anime objects matching the query
 */
export const searchAnimeInDB = async (query: string): Promise<Anime[]> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(20);

  if (error) {
    console.error("Error searching anime in DB:", error);
    throw error;
  }

  return data || [];
};

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

/**
 * Combined search: returns both local and AniList results
 *
 * @param query search string
 * @returns CombinedSearchResults object containing local and AniList results
 */
export const searchAnimeCombined = async (
  query: string
): Promise<CombinedSearchResults> => {
  const [localResults, anilistResults] = await Promise.allSettled([
    searchAnimeInDB(query),
    searchAnimeFromAniList(query),
  ]);

  return {
    localResults: localResults.status === "fulfilled" ? localResults.value : [],
    anilistResults:
      anilistResults.status === "fulfilled" ? anilistResults.value : [],
  };
};
