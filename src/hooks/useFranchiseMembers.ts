/**
 * src/hooks/useFranchiseMembers.ts
 *
 * Fetches an anime's franchise members and derives whether it's a real
 * multi-entry franchise (vs. a singleton with a franchise_key of its own).
 */
import { useQuery } from "@tanstack/react-query";
import { fetchFranchiseMembers } from "../services/supabase/franchises";

export const useFranchiseMembers = (franchiseKey: number | null) => {
  const { data: franchiseMembers } = useQuery({
    queryKey: ["franchiseMembers", franchiseKey],
    queryFn: () => fetchFranchiseMembers(franchiseKey!),
    enabled: franchiseKey != null,
  });

  return {
    franchiseMembers,
    isMultiEntryFranchise: (franchiseMembers?.length ?? 0) > 1,
  };
};
