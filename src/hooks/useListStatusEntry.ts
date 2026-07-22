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
  queryKey: unknown[];
  getEntry: () => Promise<TEntry | null>;
  addEntry: (status: AnimeStatus) => Promise<unknown>;
  updateEntry: (entryId: string, status: AnimeStatus) => Promise<unknown>;
  /** Called when the user picks the already-active status, to remove it. */
  removeEntry: (entryId: string) => Promise<unknown>;
  /** Caller-owned query keys to invalidate after a successful add/update/remove. */
  invalidateKeys: unknown[][];
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
    mutationFn: (status: AnimeStatus) => updateEntry(entry!.id, status),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: () => removeEntry(entry!.id),
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
