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
 *
 * Marking a series completed here offers the same "mark all seasons completed
 * too?" prompt the profile's edit modal does — it's the same transition, so it
 * shouldn't depend on which screen you made it from.
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useListStatusEntry } from "../hooks/useListStatusEntry";
import { StatusPickerDropdown } from "./StatusPickerDropdown";
import { SeasonsCompletedPrompt } from "./SeasonsCompletedPrompt";
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
  /** Series display title, for the seasons prompt. Franchise targets only. */
  franchiseTitle?: string;
}
// #endregion Types

/** Per-target query key, so two targets on one page don't share a cache slot. */
const targetQueryKey = (target: ListTarget, userId: string | undefined) =>
  target.kind === "franchise"
    ? ["userFranchiseList", target.franchise_key, userId]
    : ["userAnimeList", target.anime_id, userId];

// #region Component Logic
export const ListStatusButton = ({
  target,
  franchiseTitle,
}: ListStatusButtonProps) => {
  const { user } = useAuth();
  const copy = LIST_ENTRY_COPY[target.kind];
  // Adding a season is itself the statement; tracking a series is not, since
  // the feed has no series-level post for it to become.
  const announce = target.kind === "anime";
  const [showSeasonsPrompt, setShowSeasonsPrompt] = useState(false);

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
    onApplied: ({ status, previousStatus }) => {
      // Same transition the profile's edit modal watches for: a series that
      // has just *become* completed. Re-completing an already-completed
      // series isn't news, so previousStatus has to differ.
      if (
        target.kind === "franchise" &&
        status === "completed" &&
        previousStatus !== "completed"
      ) {
        setShowSeasonsPrompt(true);
      }
    },
    enabled: !!user,
  });
  // Same chrome as SearchResultCard's status button, so the app's two
  // "current list status" buttons don't drift apart in shape or sizing —
  // only the fill (STATUS_COLORS / copy.addButtonClassName) changes. cursor
  // is intentionally left out of the shared base (and added per usage
  // below) rather than baked in here: the loading state below pairs this
  // with `cursor-default`, and two cursor-* utilities on one element leave
  // the actual cursor up to Tailwind's generated rule order, not the order
  // written here.
  const buttonBase =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400";
  // #endregion Component Logic

  // #region Render
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`${buttonBase} cursor-default bg-zinc-800 text-zinc-500`}>
        Loading...
      </div>
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
          type="button"
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={`${buttonBase} cursor-pointer ${STATUS_COLORS[listEntry.status]}`}
        >
          {copy.statusPrefix}
          {STATUS_LABELS[listEntry.status]}
          <ChevronDown className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={`${buttonBase} cursor-pointer ${copy.addButtonClassName}`}
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

      {/* Offered on the series → completed transition, same as the profile's
          edit modal. Dismissing changes nothing; the seasons keep their own
          statuses unless the user asks for the sweep. */}
      {showSeasonsPrompt && target.kind === "franchise" && (
        <SeasonsCompletedPrompt
          franchiseKey={target.franchise_key}
          franchiseTitle={franchiseTitle ?? "this series"}
          onClose={() => setShowSeasonsPrompt(false)}
        />
      )}
    </div>
  );
  // #endregion Render
};
