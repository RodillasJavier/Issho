/**
 * src/api/franchiseLookup.ts
 *
 * Franchise-resolution DB short-circuit shared by the live import path
 * (animeImport.ts, browser Supabase client) and the one-time backfill script
 * (scripts/backfill-anilist.ts, Node client) — parameterized by client so
 * neither pulls in the other's.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FranchiseInfo } from "../services/anilistFranchise";

/**
 * Reuse an already-resolved neighbour's franchise key so seasons of one show
 * don't each re-walk the whole spine.
 *
 * @param supabase Supabase client to query with
 * @returns lookup function suitable for `createResolveContext`
 */
export const createKnownFranchiseLookup =
  (supabase: SupabaseClient) =>
  async (anilistId: number): Promise<FranchiseInfo | null> => {
    const { data } = await supabase
      .from("anime")
      .select("franchise_key, franchise_title")
      .eq("anilist_id", anilistId)
      .not("franchise_key", "is", null)
      .maybeSingle();

    if (!data?.franchise_key) return null;
    return {
      key: data.franchise_key,
      title: data.franchise_title ?? String(data.franchise_key),
    };
  };
