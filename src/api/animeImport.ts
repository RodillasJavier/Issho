/**
 * src/api/animeImport.ts
 *
 * Functions for importing anime from Jikan API to the database
 */
import supabase from "../supabase-client";
import { getAnimeById } from "../services/jikanApi";
import type { JikanAnime } from "../services/jikanApi";
import type { Anime, AnimeInsert } from "../types/database.types";

/**
 * Check if anime exists in database by MAL ID
 *
 * @param malId MyAnimeList ID of the anime
 * @returns Anime object if found, otherwise null
 */
export const getAnimeByExternalId = async (
  malId: number
): Promise<Anime | null> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .eq("external_id", malId)
    .maybeSingle();

  if (error) {
    console.error("Error checking anime:", error);
    throw error;
  }

  return data;
};

/**
 * Convert Jikan anime data to our database format. Only stores essential data
 * to avoid bloat, and prefers English titles when available.
 *
 * @param jikanAnime JikanAnime object from Jikan API
 * @returns AnimeInsert object for database insertion
 */
const mapJikanToAnime = (jikanAnime: JikanAnime): AnimeInsert => {
  const primaryTitle = jikanAnime.title_english || jikanAnime.title;
  const alternateTitle =
    jikanAnime.title_english && jikanAnime.title !== jikanAnime.title_english
      ? jikanAnime.title
      : null;

  return {
    name: primaryTitle,
    name_japanese: alternateTitle,
    external_id: jikanAnime.mal_id,
    cover_image_url:
      jikanAnime.images.jpg.large_image_url || jikanAnime.images.jpg.image_url,
    description: jikanAnime.synopsis || null,
    episode_count: jikanAnime.episodes || null,
    year: jikanAnime.year || null,
    genres: jikanAnime.genres.map((g) => g.name).join(", ") || null,
    status: jikanAnime.status || null,
    mal_url: jikanAnime.url,
  };
};

/**
 * Import anime from Jikan API to database
 *
 * @param malId MyAnimeList ID of the anime
 * @returns Returns the anime record (either newly created or existing)
 */
export const importAnimeFromJikan = async (malId: number): Promise<Anime> => {
  // Check if anime already exists
  const existingAnime = await getAnimeByExternalId(malId);
  if (existingAnime) {
    // Check if data is stale (e.g., older than 7 days)
    const lastUpdated = new Date(existingAnime.updated_at);
    const daysSinceUpdate =
      (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 7) {
      return refreshAnimeFromJikan(existingAnime.id);
    }

    return existingAnime;
  }

  // Fetch anime details from Jikan
  const jikanAnime = await getAnimeById(malId);
  const animeData = mapJikanToAnime(jikanAnime);

  // Insert into database
  const { data, error } = await supabase
    .from("anime")
    .insert(animeData)
    .select()
    .single();

  if (error) {
    console.error("Error importing anime:", error);
    throw error;
  }

  return data;
};

/**
 * Update existing anime with latest Jikan data
 *
 * @param animeId uuid of the anime in our database
 * @returns Updated Anime object
 */
export const refreshAnimeFromJikan = async (
  animeId: string
): Promise<Anime> => {
  // Get current anime record to find external_id
  const { data: currentAnime, error: fetchError } = await supabase
    .from("anime")
    .select("external_id")
    .eq("id", animeId)
    .single();

  if (fetchError || !currentAnime?.external_id) {
    throw new Error("Cannot refresh anime without external_id");
  }

  // Fetch latest data from Jikan
  const jikanAnime = await getAnimeById(currentAnime.external_id);
  const animeData = mapJikanToAnime(jikanAnime);

  // Update database
  const { data, error } = await supabase
    .from("anime")
    .update(animeData)
    .eq("id", animeId)
    .select()
    .single();

  if (error) {
    console.error("Error refreshing anime:", error);
    throw error;
  }

  return data;
};
