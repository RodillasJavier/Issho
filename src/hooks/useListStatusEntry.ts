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
  enabled: boolean;
}

export const useListStatusEntry = <TEntry extends ListStatusEntryLike>({
  queryKey,
  getEntry,
  addEntry,
  updateEntry,
  removeEntry,
  invalidateKeys,
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

  const addMutation = useMutation({
    mutationFn: (status: AnimeStatus) => addEntry(status),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (status: AnimeStatus) => updateEntry(entry!, status),
    onSuccess: invalidate,
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
