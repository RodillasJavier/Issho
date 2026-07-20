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
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { EditFranchiseEntryModal } from "./EditFranchiseEntryModal";
import { addUserFranchiseEntry } from "../services/supabase/userFranchiseList";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
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
  const coverUrl = lead?.anime?.cover_image_url;
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
  // #endregion Component Logic

  // #region Render
  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-950 to-rose-400 blur-sm opacity-0 group-hover:opacity-25 transition duration-250" />

        <div className="relative h-full z-10 bg-neutral-950 border border-neutral-800 rounded-md overflow-hidden transition-colors duration-250 group-hover:border-rose-400/50">
          {/* Image Container */}
          <Link to={`/anime/${lead.anime_id}`} className="block relative">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-neutral-800 flex items-center justify-center text-neutral-600">
                No Image
              </div>
            )}
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs font-semibold text-rose-300">
              {entries.length} in list
            </span>
          </Link>

          {/* Content */}
          <div className="px-4 py-3 space-y-3">
            {/* Title */}
            <Link
              to={`/anime/${lead.anime_id}`}
              className="block group-hover:text-rose-400 transition-colors"
            >
              <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
            </Link>

            {/* Metadata Row */}
            {yearRange && (
              <div className="flex gap-1 text-xs text-gray-400">
                <span>{yearRange}</span>
                <span>• Series</span>
              </div>
            )}

            {/* Series Status Badge */}
            <div className="flex items-center gap-2 justify-between">
              {franchiseEntry ? (
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${STATUS_COLORS[franchiseEntry.status]}`}
                >
                  {STATUS_LABELS[franchiseEntry.status]}
                </span>
              ) : (
                <span className="px-3 py-1 rounded text-xs border border-neutral-700 text-neutral-400">
                  No series status
                </span>
              )}

              {franchiseEntry?.rating && (
                <span className="text-yellow-500 font-semibold">
                  ⭐ {franchiseEntry.rating}/10
                </span>
              )}
            </div>

            {/* Display-only hint from per-season entries */}
            <p className="text-xs text-neutral-500">
              {watchedCount} / {entries.length} in list completed
            </p>

            {/* Series Review Preview */}
            {franchiseEntry?.review ? (
              <p className="text-sm text-neutral-400 line-clamp-2">
                {franchiseEntry.review}
              </p>
            ) : (
              <p className="text-sm italic text-neutral-400 line-clamp-2">
                No series review added.
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isOwnProfile &&
                (franchiseEntry ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending ? "Adding..." : "Set Status"}
                  </button>
                ))}

              <Link
                to={`/anime/${lead.anime_id}`}
                className="flex-1 px-3 py-2 bg-rose-500 hover:bg-rose-900 border border-rose-500 rounded text-sm text-center hover:text-rose-100 transition-colors"
              >
                Community
              </Link>
            </div>

            {/* Last Updated */}
            {franchiseEntry && (
              <p className="text-xs text-neutral-500">
                Updated{" "}
                {new Date(franchiseEntry.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

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
