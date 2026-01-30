/**
 * src/api/animeSearch.ts
 *
 * API functions for searching anime from both Jikan API and local database
 */
import supabase from "../supabase-client";
import { searchAnime as searchJikan } from "../services/jikanApi";
import type { JikanAnime } from "../services/jikanApi";
import type { Anime } from "../types/database.types";

// #region Types

export interface CombinedSearchResults {
  localResults: Anime[];
  jikanResults: JikanAnime[];
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
 * Search anime from Jikan API
 *
 * @param query search string
 * @returns Array of JikanAnime objects matching the query
 */
export const searchAnimeFromJikan = async (
  query: string
): Promise<JikanAnime[]> => {
  try {
    const response = await searchJikan(query, 1, 10);
    return response.data;
  } catch (error) {
    console.error("Error searching anime from Jikan:", error);
    throw error;
  }
};

/**
 * Combined search: returns both local and Jikan results
 *
 * @param query search string
 * @returns CombinedSearchResults object containing local and Jikan results
 */
export const searchAnimeCombined = async (
  query: string
): Promise<CombinedSearchResults> => {
  const [localResults, jikanResults] = await Promise.allSettled([
    searchAnimeInDB(query),
    searchAnimeFromJikan(query),
  ]);

  return {
    localResults: localResults.status === "fulfilled" ? localResults.value : [],
    jikanResults: jikanResults.status === "fulfilled" ? jikanResults.value : [],
  };
};
