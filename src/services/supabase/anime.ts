/**
 * src/services/supabase/anime.ts
 *
 * Queries over the anime table itself (not franchise groupings — see
 * franchises.ts for those).
 */
import supabase from "../../supabase-client";
import type { Anime } from "../../types/database.types";

/**
 * Fetch anime details by ID.
 *
 * @param animeId uuid of the anime to fetch
 * @returns Anime details
 */
export const fetchAnime = async (animeId: string): Promise<Anime> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .eq("id", animeId)
    .single();

  if (error) throw new Error(error.message);
  return data as Anime;
};
