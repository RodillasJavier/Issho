/**
 * src/api/animeImport.ts
 *
 * Functions for importing anime from the AniList API to the database
 */
import supabase from "../supabase-client";
import { getAnimeById, withRetry } from "../services/anilistApi";
import {
  collectBackbone,
  createResolveContext,
  resolveFranchiseKey,
} from "../services/anilistFranchise";
import type {
  FranchiseInfo,
  ResolveContext,
} from "../services/anilistFranchise";
import { createKnownFranchiseLookup } from "./franchiseLookup";
import { mapAniListToAnime } from "./animeMapping";
import type { Anime } from "../types/database.types";

/**
 * Check if anime exists in database by AniList ID
 *
 * @param anilistId AniList media ID
 * @returns Anime object if found, otherwise null
 */
export const getAnimeByAnilistId = async (
  anilistId: number
): Promise<Anime | null> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  if (error) {
    console.error("Error checking anime:", error);
    throw error;
  }

  return data;
};

const lookupKnownFranchise = createKnownFranchiseLookup(supabase);

/**
 * Import the rest of a franchise's backbone (every season the sequel chain
 * reaches from the root). Best-effort: the clicked entry is already saved, so
 * an AniList hiccup here shouldn't fail the add — missing seasons fill in the
 * next time any member is imported.
 *
 * @param importedId AniList id of the row already upserted by the caller
 * @param franchise Resolved franchise of the chain
 * @param ctx Shared resolution context (reuses already-fetched media)
 */
const importBackboneMembers = async (
  importedId: number,
  franchise: FranchiseInfo,
  ctx: ResolveContext
): Promise<void> => {
  try {
    const members = await collectBackbone(franchise.key, ctx);
    const rows = members
      .filter((member) => member.id !== importedId)
      .map((member) => mapAniListToAnime(member, franchise));
    if (rows.length === 0) return;

    const { error } = await supabase
      .from("anime")
      .upsert(rows, { onConflict: "anilist_id" });
    if (error) throw error;
  } catch (e) {
    console.error("Error importing franchise members:", e);
  }
};

/**
 * Import anime from the AniList API to the database. Also imports the rest of
 * the series: every backbone member (sequel/prequel chain) of the entry's
 * franchise is upserted alongside it.
 *
 * @param anilistId AniList media ID
 * @returns Returns the anime record (either newly created or existing)
 */
export const importAnimeFromAniList = async (
  anilistId: number
): Promise<Anime> => {
  // Check if anime already exists
  const existingAnime = await getAnimeByAnilistId(anilistId);
  if (existingAnime) {
    // Check if data is stale (e.g., older than 7 days)
    const lastUpdated = new Date(existingAnime.updated_at);
    const daysSinceUpdate =
      (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 7) {
      return refreshAnimeFromAniList(existingAnime.id);
    }

    return existingAnime;
  }

  // Fetch details and resolve the franchise from AniList
  const media = await withRetry(() => getAnimeById(anilistId));
  if (!media) {
    throw new Error(`AniList has no anime with id ${anilistId}`);
  }
  const ctx = createResolveContext(lookupKnownFranchise);
  const franchise = await resolveFranchiseKey(media, ctx);
  const animeData = mapAniListToAnime(media, franchise);

  // Upsert keyed on anilist_id so the same season added twice never
  // creates two rows
  const { data, error } = await supabase
    .from("anime")
    .upsert(animeData, { onConflict: "anilist_id" })
    .select()
    .single();

  if (error) {
    console.error("Error importing anime:", error);
    throw error;
  }

  // Bring in the rest of the series so the franchise arrives whole
  await importBackboneMembers(media.id, franchise, ctx);

  return data;
};

/**
 * Update existing anime with latest AniList data
 *
 * @param animeId uuid of the anime in our database
 * @returns Updated Anime object
 */
export const refreshAnimeFromAniList = async (
  animeId: string
): Promise<Anime> => {
  // Get current anime record to find anilist_id
  const { data: currentAnime, error: fetchError } = await supabase
    .from("anime")
    .select("anilist_id")
    .eq("id", animeId)
    .single();

  if (fetchError || !currentAnime?.anilist_id) {
    throw new Error("Cannot refresh anime without anilist_id");
  }

  // Fetch latest data from AniList (re-resolving the franchise too)
  const media = await withRetry(() => getAnimeById(currentAnime.anilist_id));
  if (!media) {
    throw new Error(`AniList has no anime with id ${currentAnime.anilist_id}`);
  }
  const franchise = await resolveFranchiseKey(
    media,
    createResolveContext(lookupKnownFranchise)
  );
  const animeData = mapAniListToAnime(media, franchise);

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
