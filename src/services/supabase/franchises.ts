/**
 * src/services/supabase/franchises.ts
 *
 * Queries over franchise groupings of the anime table.
 */
import supabase from "../../supabase-client";
import type { Anime, Franchise } from "../../types/database.types";

/**
 * Fetch several franchises' derived metadata in one round trip.
 *
 * @param anilistRootIds AniList ids of the chain roots
 * @returns the matching franchise rows
 */
export const fetchFranchises = async (
  anilistRootIds: number[]
): Promise<Franchise[]> => {
  if (anilistRootIds.length === 0) return [];

  const { data, error } = await supabase
    .from("franchises")
    .select("*")
    .in("anilist_root_id", anilistRootIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as Franchise[];
};

/**
 * Fetch all anime rows sharing a franchise key, ordered chronologically.
 *
 * @param franchiseKey shared franchise key (AniList id of the backbone root)
 * @returns member anime rows
 */
export const fetchFranchiseMembers = async (
  franchiseKey: number
): Promise<Anime[]> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .eq("franchise_key", franchiseKey)
    .order("year", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Anime[];
};
