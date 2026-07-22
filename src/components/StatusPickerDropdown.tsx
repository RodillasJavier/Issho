/**
 * src/components/StatusPickerDropdown.tsx
 *
 * Shared status-option list behind AddToListButton/FranchiseListButton/
 * SearchResultCard's status-picker dropdowns (useListStatusEntry owns the
 * add/update/remove state machine; this owns only the option rendering).
 * Clicking the already-active status removes the list entry; hovering that
 * option previews "Remove from list" in place of its label.
 */
import { Check, X } from "lucide-react";
import { STATUS_LABELS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

interface StatusPickerDropdownProps {
  currentStatus: AnimeStatus | null | undefined;
  onSelect: (status: AnimeStatus) => void;
  isMutating: boolean;
}

export const StatusPickerDropdown = ({
  currentStatus,
  onSelect,
  isMutating,
}: StatusPickerDropdownProps) => (
  <div className="py-1">
    {(Object.keys(STATUS_LABELS) as AnimeStatus[]).map((status) => {
      const isActive = currentStatus === status;
      return (
        <button
          key={status}
          type="button"
          onClick={() => onSelect(status)}
          disabled={isMutating}
          className={`group flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isActive
              ? "bg-neutral-800 hover:bg-red-500/10"
              : "hover:bg-neutral-800"
          }`}
        >
          {isActive ? (
            <>
              <span className="group-hover:hidden">
                {STATUS_LABELS[status]}
              </span>
              <span className="hidden text-red-300 group-hover:inline">
                Remove from list
              </span>
              <Check className="size-4 text-rose-400 group-hover:hidden" />
              <X className="hidden size-4 text-red-400 group-hover:block" />
            </>
          ) : (
            STATUS_LABELS[status]
          )}
        </button>
      );
    })}
  </div>
);
