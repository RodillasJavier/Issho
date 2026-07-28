/**
 * src/components/ListStatusButton.tsx
 *
 * Sets the user's status for a list slot — a single season or a whole series
 * — from a detail page. The two levels differ only in copy and in whether the
 * add announces itself in the feed, so this is one component rather than a
 * per-level pair.
 *
 * The feed is per-anime, so only season adds post. Adding a season also seeds
 * the series row for its franchise; `addListEntry` owns that rule.
 */
import { ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useListStatusEntry } from "../hooks/useListStatusEntry";
import { StatusPickerDropdown } from "./StatusPickerDropdown";
import {
  getListEntry,
  addListEntry,
  updateListEntry,
  removeListEntry,
  listInvalidationKeys,
} from "../services/supabase/userLists";
import { LIST_ENTRY_COPY } from "../constants/listEntry";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import type { ListEntry, ListTarget } from "../types/listEntry";
import type { AnimeStatus } from "../types/database.types";

// #region Types
interface ListStatusButtonProps {
  target: ListTarget;
}
// #endregion Types

/** Per-target query key, so two targets on one page don't share a cache slot. */
const targetQueryKey = (target: ListTarget, userId: string | undefined) =>
  target.kind === "franchise"
    ? ["userFranchiseList", target.franchise_key, userId]
    : ["userAnimeList", target.anime_id, userId];

// #region Component Logic
export const ListStatusButton = ({ target }: ListStatusButtonProps) => {
  const { user } = useAuth();
  const copy = LIST_ENTRY_COPY[target.kind];
  // Adding a season is itself the statement; tracking a series is not, since
  // the feed has no series-level post for it to become.
  const announce = target.kind === "anime";

  const {
    entry: listEntry,
    isLoading,
    error,
    showStatusPicker,
    setShowStatusPicker,
    handleStatusSelect,
    isMutating,
  } = useListStatusEntry<ListEntry>({
    queryKey: targetQueryKey(target, user?.id),
    getEntry: () => getListEntry(target, user!.id),
    addEntry: (status: AnimeStatus) =>
      addListEntry(target, user!.id, status, { announce }),
    updateEntry: (entry, status) =>
      updateListEntry(entry, { status }, { announce }),
    removeEntry: (entry) => removeListEntry(entry),
    invalidateKeys: [
      targetQueryKey(target, user?.id),
      ...listInvalidationKeys(user?.id),
      ...(announce ? [["entries"]] : []),
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
      <div className="rounded bg-neutral-800 px-4 py-2 text-sm">Loading...</div>
    );
  }

  if (error) {
    console.error(error);
    return null;
  }

  return (
    <div className="relative">
      {/* Show the current status when the slot is already in the list */}
      {listEntry ? (
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={`flex cursor-pointer items-center gap-1 rounded px-4 py-2 text-sm font-semibold text-white transition-colors ${STATUS_COLORS[listEntry.status]}`}
        >
          {copy.statusPrefix}
          {STATUS_LABELS[listEntry.status]}
          <ChevronDown className="size-4" />
        </button>
      ) : (
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={copy.addButtonClassName}
        >
          + {copy.addButtonLabel}
        </button>
      )}

      {/* Status Picker Dropdown */}
      {showStatusPicker && (
        <div className="absolute top-full left-0 z-100 mt-2 min-w-[200px] rounded border border-neutral-800 bg-neutral-900 shadow-lg">
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
