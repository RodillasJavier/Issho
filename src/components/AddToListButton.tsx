/**
 * src/components/AddToListButton.tsx
 *
 * Component for adding anime to user's personal list or showing current status.
 */
import { ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useListStatusEntry } from "../hooks/useListStatusEntry";
import { StatusPickerDropdown } from "./StatusPickerDropdown";
import {
  getUserAnimeEntry,
  addUserAnimeEntry,
  updateUserAnimeEntry,
  removeUserAnimeEntry,
} from "../services/supabase/userAnimeList";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

// #region Types
interface AddToListButtonProps {
  animeId: string;
}
// #endregion Types

// #region Component Logic
export const AddToListButton = ({ animeId }: AddToListButtonProps) => {
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
    queryKey: ["userAnimeList", animeId, user?.id],
    getEntry: () => getUserAnimeEntry(animeId, user!.id),
    addEntry: (status: AnimeStatus) =>
      addUserAnimeEntry(animeId, user!.id, status),
    updateEntry: (entryId, status) => updateUserAnimeEntry(entryId, { status }),
    removeEntry: (entryId) => removeUserAnimeEntry(entryId),
    invalidateKeys: [
      ["userAnimeList", animeId, user?.id],
      ["userAnimeList", user?.id],
      ["entries"],
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
      {/* If the user has an anime in their list already, show the status, otherwise show add to list button */}
      {listEntry ? (
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={`flex cursor-pointer items-center gap-1 rounded px-4 py-2 text-sm font-semibold text-white transition-colors ${STATUS_COLORS[listEntry.status]}`}
        >
          {STATUS_LABELS[listEntry.status]}
          <ChevronDown className="size-4" />
        </button>
      ) : (
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className="cursor-pointer rounded bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
        >
          + Add to your List
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
