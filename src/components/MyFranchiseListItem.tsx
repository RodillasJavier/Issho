/**
 * src/components/MyFranchiseListItem.tsx
 *
 * Profile-list card for a multi-entry franchise, showing only series-level
 * information: the user's status/rating/review from user_franchise_entries.
 * Per-season statuses are edited on each anime's own page; the only trace of
 * them here is the display-only "X / Y completed" hint, which never overrides
 * the series status.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { EditFranchiseEntryModal } from "./EditFranchiseEntryModal";
import { ProfileListCard } from "./ProfileListCard";
import { addUserFranchiseEntry } from "../services/supabase/userFranchiseList";
import { yearRangeLabel } from "../utils/franchise";

// #region Types
import type {
  UserAnimeEntry,
  UserFranchiseEntry,
} from "../types/database.types";

interface MyFranchiseListItemProps {
  franchiseKey: number;
  title: string;
  entries: UserAnimeEntry[];
  franchiseEntry: UserFranchiseEntry | null;
  isOwnProfile: boolean;
}
// #endregion Types

// #region Component Logic
export const MyFranchiseListItem = ({
  franchiseKey,
  title,
  entries,
  franchiseEntry,
  isOwnProfile,
}: MyFranchiseListItemProps) => {
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const lead = entries[0];
  const watchedCount = entries.filter(
    (entry) => entry.status === "completed"
  ).length;
  const yearRange = yearRangeLabel(
    entries
      .map((entry) => entry.anime?.year)
      .filter((year): year is number => year != null)
  );

  // "Add series status" first creates the row, then opens the edit modal
  const createMutation = useMutation({
    mutationFn: () => addUserFranchiseEntry(franchiseKey, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userFranchiseList"] });
      setShowEditModal(true);
    },
  });

  const primaryAction = !isOwnProfile
    ? null
    : franchiseEntry
      ? { label: "Edit", onClick: () => setShowEditModal(true) }
      : {
          label: createMutation.isPending ? "Adding..." : "Set Status",
          onClick: () => createMutation.mutate(),
          disabled: createMutation.isPending,
        };
  // #endregion Component Logic

  // #region Render
  return (
    <>
      <ProfileListCard
        href={`/anime/${lead.anime_id}`}
        coverUrl={lead?.anime?.cover_image_url}
        coverAlt={title}
        title={title}
        badge={
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs font-semibold text-rose-300">
            {entries.length} in list
          </span>
        }
        metaLine={
          yearRange && (
            <div className="flex gap-1 text-xs text-gray-400">
              <span>{yearRange}</span>
              <span>• Series</span>
            </div>
          )
        }
        status={franchiseEntry?.status ?? null}
        noStatusLabel="No series status"
        rating={franchiseEntry?.rating ?? null}
        reviewText={franchiseEntry?.review ?? null}
        noReviewText="No series review added."
        hintLine={
          <p className="text-xs text-neutral-500">
            {watchedCount} / {entries.length} in list completed
          </p>
        }
        updatedAt={franchiseEntry?.updated_at}
        primaryAction={primaryAction}
      />

      {/* Series Edit Modal */}
      {showEditModal && franchiseEntry && (
        <EditFranchiseEntryModal
          entry={franchiseEntry}
          franchiseTitle={title}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
  // #endregion Render
};
