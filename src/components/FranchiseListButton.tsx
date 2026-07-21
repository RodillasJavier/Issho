/**
 * src/components/FranchiseListButton.tsx
 *
 * Series-level counterpart of AddToListButton: sets the user's status for a
 * whole franchise. Independent of per-season statuses — never syncs them.
 */
import { Check, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useListStatusEntry } from "../hooks/useListStatusEntry";
import {
  getUserFranchiseEntry,
  addUserFranchiseEntry,
  updateUserFranchiseEntry,
} from "../services/supabase/userFranchiseList";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

// #region Types
interface FranchiseListButtonProps {
  franchiseKey: number;
  onEditClick?: () => void;
}
// #endregion Types

// #region Component Logic
export const FranchiseListButton = ({
  franchiseKey,
  onEditClick,
}: FranchiseListButtonProps) => {
  const { user } = useAuth();

  const {
    entry: listEntry,
    isLoading,
    error,
    showStatusPicker,
    setShowStatusPicker,
    handleStatusSelect,
    isMutating,
  } = useListStatusEntry({
    queryKey: ["userFranchiseList", franchiseKey, user?.id],
    getEntry: () => getUserFranchiseEntry(franchiseKey, user!.id),
    addEntry: (status: AnimeStatus) =>
      addUserFranchiseEntry(franchiseKey, user!.id, status),
    updateEntry: (entryId, status) =>
      updateUserFranchiseEntry(entryId, { status }),
    invalidateKeys: [
      ["userFranchiseList", franchiseKey, user?.id],
      ["userFranchiseList", user?.id],
    ],
    enabled: !!user,
  });
  // #endregion Component Logic

  // #region Render
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-4 py-2 bg-neutral-800 rounded text-sm">Loading...</div>
    );
  }

  if (error) {
    console.error(error);
    return null;
  }

  return (
    <div className="relative">
      {listEntry ? (
        <div className="flex gap-2">
          <button
            onClick={() => setShowStatusPicker(!showStatusPicker)}
            className={`flex items-center gap-1 px-4 py-2 rounded text-white text-sm font-semibold transition-colors ${STATUS_COLORS[listEntry.status]}`}
          >
            Series: {STATUS_LABELS[listEntry.status]}
            <ChevronDown className="size-4" />
          </button>

          {onEditClick && (
            <button
              onClick={onEditClick}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-white text-sm transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-rose-500/50 rounded text-white text-sm font-semibold transition-colors"
        >
          + Track Whole Series
        </button>
      )}

      {/* Status Picker Dropdown */}
      {showStatusPicker && (
        <div className="absolute top-full mt-2 left-0 bg-neutral-900 border border-neutral-800 rounded shadow-lg z-100 min-w-[200px]">
          <div className="py-1">
            {(Object.keys(STATUS_LABELS) as AnimeStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                disabled={isMutating}
                className={`flex w-full items-center justify-between gap-2 text-left px-4 py-2 text-sm hover:bg-neutral-800 transition-colors ${
                  listEntry?.status === status ? "bg-neutral-800" : ""
                }`}
              >
                {STATUS_LABELS[status]}
                {listEntry?.status === status && (
                  <Check className="size-4 text-rose-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showStatusPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowStatusPicker(false)}
        />
      )}
    </div>
  );
  // #endregion Render
};
