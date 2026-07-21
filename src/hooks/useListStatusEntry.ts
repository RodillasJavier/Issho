/**
 * src/hooks/useListStatusEntry.ts
 *
 * Shared state machine behind AddToListButton/FranchiseListButton: fetch the
 * current entry, toggle a status-picker dropdown, and branch add-vs-update
 * on whether an entry already exists.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AnimeStatus } from "../types/database.types";

interface ListStatusEntryLike {
  id: string;
}

export interface UseListStatusEntryParams<TEntry extends ListStatusEntryLike> {
  queryKey: unknown[];
  getEntry: () => Promise<TEntry | null>;
  addEntry: (status: AnimeStatus) => Promise<unknown>;
  updateEntry: (entryId: string, status: AnimeStatus) => Promise<unknown>;
  /** Caller-owned query keys to invalidate after a successful add/update. */
  invalidateKeys: unknown[][];
  enabled: boolean;
}

export const useListStatusEntry = <TEntry extends ListStatusEntryLike>({
  queryKey,
  getEntry,
  addEntry,
  updateEntry,
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

  const handleStatusSelect = (status: AnimeStatus) => {
    if (entry) {
      updateMutation.mutate(status);
    } else {
      addMutation.mutate(status);
    }
  };

  return {
    entry,
    isLoading,
    error,
    showStatusPicker,
    setShowStatusPicker,
    handleStatusSelect,
    isMutating: addMutation.isPending || updateMutation.isPending,
  };
};
