/**
 * src/hooks/useFranchiseMembers.ts
 *
 * Fetches an anime's franchise members and derives whether it's a real
 * multi-entry franchise (vs. a singleton with a franchise_key of its own).
 *
 * Also seeds each member's own `["anime", id]` cache entry from this batch
 * fetch — fetchFranchiseMembers and fetchAnime both select("*") off the same
 * `anime` table, so a franchise's members response already contains exactly
 * what AnimeFeed's own per-season query would fetch for any one of them.
 * This is what makes flipping to a sibling season the viewer hasn't opened
 * yet this session instant instead of showing a loading skeleton — no new
 * request, just reusing data already in hand for the sidebar's SeasonsList.
 * Stamped with the batch's own dataUpdatedAt (not "now"), and skipped when
 * the target entry is already equal-or-newer, so a direct fetchAnime call for
 * the season currently being viewed never has its freshness clock clobbered
 * by a franchiseMembers fetch that actually happened earlier. Also skipped
 * when the cached row is already byte-identical to the incoming one — the
 * dataUpdatedAt-only guard above would otherwise still rewrite every member
 * on every refetch (window refocus, staleTime expiry, ...) even when nothing
 * actually changed, since dataUpdatedAt advances on every fetch regardless
 * of whether the response differs.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFranchiseMembers } from "../services/supabase/franchises";

// Anime metadata (title, banner, description, genres) changes on the order
// of "someone re-imports/corrects it," not per session. Also used by
// AnimeFeed's own ["anime", animeId] query — staleTime is observer-level, so
// setting it only here has no effect on that separate query's own freshness.
export const ANIME_METADATA_STALE_TIME = 5 * 60 * 1000;

export const useFranchiseMembers = (franchiseKey: number | null) => {
  const queryClient = useQueryClient();

  const { data: franchiseMembers, dataUpdatedAt } = useQuery({
    queryKey: ["franchiseMembers", franchiseKey],
    queryFn: () => fetchFranchiseMembers(franchiseKey!),
    enabled: franchiseKey != null,
    staleTime: ANIME_METADATA_STALE_TIME,
  });

  useEffect(() => {
    if (!franchiseMembers) return;
    for (const member of franchiseMembers) {
      const existing = queryClient.getQueryState(["anime", member.id]);
      if (existing && existing.dataUpdatedAt >= dataUpdatedAt) continue;
      if (
        existing &&
        JSON.stringify(existing.data) === JSON.stringify(member)
      ) {
        continue;
      }
      queryClient.setQueryData(["anime", member.id], member, {
        updatedAt: dataUpdatedAt,
      });
    }
  }, [franchiseMembers, dataUpdatedAt, queryClient]);

  return {
    franchiseMembers,
    isMultiEntryFranchise: (franchiseMembers?.length ?? 0) > 1,
  };
};
