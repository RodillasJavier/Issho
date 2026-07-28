/**
 * src/hooks/useListStatusEntry.ts
 *
 * Shared state machine behind AddToListButton/FranchiseListButton: fetch the
 * current entry, toggle a status-picker dropdown, and branch add/update/
 * remove on selection — picking the already-active status removes the entry
 * (the picker's checkmark acts as a toggle), otherwise add vs. update
 * depends on whether an entry already exists.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AnimeStatus } from "../types/database.types";

interface ListStatusEntryLike {
  id: string;
  status: AnimeStatus;
}

export interface UseListStatusEntryParams<TEntry extends ListStatusEntryLike> {
  queryKey: readonly unknown[];
  getEntry: () => Promise<TEntry | null>;
  addEntry: (status: AnimeStatus) => Promise<unknown>;
  /** Receives the whole entry, not just its id, so callers that need more of
   * it (which table it came from, say) don't have to re-fetch or close over
   * the hook's own return value. */
  updateEntry: (entry: TEntry, status: AnimeStatus) => Promise<unknown>;
  /** Called when the user picks the already-active status, to remove it. */
  removeEntry: (entry: TEntry) => Promise<unknown>;
  /** Caller-owned query keys to invalidate after a successful add/update/remove. */
  invalidateKeys: readonly (readonly unknown[])[];
  /**
   * Called after a status is successfully added or changed, with the status
   * applied and the one it replaced (null when there was no entry). Lets a
   * caller react to a specific transition — offering to sweep a franchise's
   * seasons when it *becomes* completed, say — without this hook knowing
   * anything about franchises. Not called on removal.
   */
  onApplied?: (applied: {
    status: AnimeStatus;
    previousStatus: AnimeStatus | null;
  }) => void;
  enabled: boolean;
}

export const useListStatusEntry = <TEntry extends ListStatusEntryLike>({
  queryKey,
  getEntry,
  addEntry,
  updateEntry,
  removeEntry,
  invalidateKeys,
  onApplied,
  enabled,
}: UseListStatusEntryParams<TEntry>) => {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: entry,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: getEntry,
    enabled,
  });

  const invalidate = () => {
    invalidateKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });

    setShowStatusPicker(false);
  };

  /** Reports what was applied, and what it replaced, once the write lands. */
  const applied = (status: AnimeStatus, previousStatus: AnimeStatus | null) => {
    invalidate();
    onApplied?.({ status, previousStatus });
  };

  const addMutation = useMutation({
    mutationFn: (status: AnimeStatus) => addEntry(status),
    onSuccess: (_data, status) => applied(status, null),
  });

  const updateMutation = useMutation({
    mutationFn: (status: AnimeStatus) => updateEntry(entry!, status),
    // `entry` is the pre-update row: the mutation invalidates rather than
    // writing through the cache, so it hasn't been replaced yet.
    onSuccess: (_data, status) => applied(status, entry?.status ?? null),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeEntry(entry!),
    onSuccess: invalidate,
  });

  const handleStatusSelect = (status: AnimeStatus) => {
    if (!entry) {
      addMutation.mutate(status);
    } else if (entry.status === status) {
      removeMutation.mutate();
    } else {
      updateMutation.mutate(status);
    }
  };

  return {
    entry,
    isLoading,
    error,
    showStatusPicker,
    setShowStatusPicker,
    handleStatusSelect,
    isMutating:
      addMutation.isPending ||
      updateMutation.isPending ||
      removeMutation.isPending,
  };
};
