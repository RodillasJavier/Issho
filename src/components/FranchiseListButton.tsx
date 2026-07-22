/**
 * src/components/FranchiseListButton.tsx
 *
 * Series-level counterpart of AddToListButton: sets the user's status for a
 * whole franchise. Independent of per-season statuses — never syncs them.
 */
import { ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useListStatusEntry } from "../hooks/useListStatusEntry";
import { StatusPickerDropdown } from "./StatusPickerDropdown";
import {
  getUserFranchiseEntry,
  addUserFranchiseEntry,
  updateUserFranchiseEntry,
  removeUserFranchiseEntry,
} from "../services/supabase/userFranchiseList";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

// #region Types
interface FranchiseListButtonProps {
  franchiseKey: number;
}
// #endregion Types

// #region Component Logic
export const FranchiseListButton = ({
  franchiseKey,
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
    removeEntry: (entryId) => removeUserFranchiseEntry(entryId),
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
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={`flex cursor-pointer items-center gap-1 rounded px-4 py-2 text-sm font-semibold text-white transition-colors ${STATUS_COLORS[listEntry.status]}`}
        >
          Series: {STATUS_LABELS[listEntry.status]}
          <ChevronDown className="size-4" />
        </button>
      ) : (
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className="cursor-pointer rounded border border-rose-500/50 bg-neutral-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          + Track Whole Series
        </button>
      )}

      {/* Status Picker Dropdown */}
      {showStatusPicker && (
        <div className="absolute top-full mt-2 left-0 bg-neutral-900 border border-neutral-800 rounded shadow-lg z-100 min-w-[200px]">
          <StatusPickerDropdown
            currentStatus={listEntry?.status}
            onSelect={handleStatusSelect}
            isMutating={isMutating}
          />
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
