/**
 * src/components/AddToListButton.tsx
 *
 * Component for adding anime to user's personal list or showing current status.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  getUserAnimeEntry,
  addUserAnimeEntry,
  updateUserAnimeEntry,
} from "../services/supabase/userAnimeList";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

// #region Types
interface AddToListButtonProps {
  animeId: string;
  onEditClick?: () => void;
}
// #endregion Types

// #region Component Logic
export const AddToListButton = ({
  animeId,
  onEditClick,
}: AddToListButtonProps) => {
  const { user } = useAuth();
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: listEntry,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userAnimeList", animeId, user?.id],
    queryFn: () => getUserAnimeEntry(animeId, user!.id),
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: (status: AnimeStatus) =>
      addUserAnimeEntry(animeId, user!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userAnimeList", animeId, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["userAnimeList", user?.id] });
      setShowStatusPicker(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (status: AnimeStatus) =>
      updateUserAnimeEntry(listEntry!.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userAnimeList", animeId, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["userAnimeList", user?.id] });
      setShowStatusPicker(false);
    },
  });

  const handleStatusSelect = (status: AnimeStatus) => {
    if (listEntry) {
      updateMutation.mutate(status);
    } else {
      addMutation.mutate(status);
    }
  };
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowStatusPicker(!showStatusPicker)}
            className={`px-4 py-2 rounded text-white text-sm font-semibold transition-colors ${STATUS_COLORS[listEntry.status]}`}
          >
            {STATUS_LABELS[listEntry.status]} ▼
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
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded text-white text-sm font-semibold transition-colors"
        >
          + Add to your List
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
                disabled={addMutation.isPending || updateMutation.isPending}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 transition-colors ${
                  listEntry?.status === status ? "bg-neutral-800" : ""
                }`}
              >
                {STATUS_LABELS[status]}
                {listEntry?.status === status && " ✓"}
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
