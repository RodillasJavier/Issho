/**
 * src/components/EditFranchiseEntryModal.tsx
 *
 * Modal for editing a user's series-level (franchise) entry. After the user
 * marks a series completed, offers an optional, dismissible prompt to mark
 * the individual seasons completed too — never applied automatically.
 */
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  updateUserFranchiseEntry,
  removeUserFranchiseEntry,
  markFranchiseSeasonsCompleted,
} from "../services/supabase/userFranchiseList";
import { STATUS_LABELS } from "../constants/animeStatus";

// #region Types
import type { UserFranchiseEntry, AnimeStatus } from "../types/database.types";

interface EditFranchiseEntryModalProps {
  entry: UserFranchiseEntry;
  franchiseTitle: string;
  onClose: () => void;
}
// #endregion Types

// #region Component Logic
export const EditFranchiseEntryModal = ({
  entry,
  franchiseTitle,
  onClose,
}: EditFranchiseEntryModalProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AnimeStatus>(entry.status);
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [review, setReview] = useState<string>(entry.review || "");
  const [showSeasonsPrompt, setShowSeasonsPrompt] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["userFranchiseList"] });
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUserFranchiseEntry(entry.id, {
        status,
        rating: rating || null,
        review: review || null,
      }),
    onSuccess: () => {
      invalidate();
      // Offer (don't apply) the season sync only when newly marked completed
      if (status === "completed" && entry.status !== "completed") {
        setShowSeasonsPrompt(true);
      } else {
        onClose();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeUserFranchiseEntry(entry.id),
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const markSeasonsMutation = useMutation({
    mutationFn: () =>
      markFranchiseSeasonsCompleted(entry.franchise_key, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
      queryClient.invalidateQueries({ queryKey: ["userListStats"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm("Remove this series from your list?")) {
      deleteMutation.mutate();
    }
  };
  // #endregion Component Logic

  // #region Render
  if (showSeasonsPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-800 p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Series completed 🎉</h2>
          <p className="text-neutral-300">
            Mark all seasons of{" "}
            <span className="text-rose-300">{franchiseTitle}</span> in your list
            as completed too?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-white text-sm transition-colors cursor-pointer"
            >
              No, leave them
            </button>
            <button
              onClick={() => markSeasonsMutation.mutate()}
              disabled={markSeasonsMutation.isPending}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {markSeasonsMutation.isPending
                ? "Marking..."
                : "Yes, mark seasons"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-800">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-3xl font-bold text-white">Edit Series Entry</h2>
            <p className="text-lg text-neutral-400">{franchiseTitle}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium">
              Series Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AnimeStatus)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:outline-none focus:border-rose-500"
            >
              {(Object.keys(STATUS_LABELS) as AnimeStatus[]).map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label htmlFor="rating" className="block text-sm font-medium">
              Series Rating (1-10)
            </label>
            <input
              id="rating"
              type="number"
              min="1"
              max="10"
              value={rating || ""}
              onChange={(e) =>
                setRating(e.target.value ? Number(e.target.value) : null)
              }
              placeholder="No rating"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Personal Review/Notes */}
          <div className="space-y-2">
            <label htmlFor="review" className="block text-sm font-medium">
              Series Notes
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Your thoughts on the series as a whole..."
              rows={5}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-700 hover:bg-red-950 border border-red-700 rounded text-white hover:text-red-200 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove from List"}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-white text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-950 border border-rose-500 rounded text-white hover:text-rose-200 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Error Messages */}
          {updateMutation.isError && (
            <p className="text-red-400 text-sm">
              Error updating entry. Please try again.
            </p>
          )}

          {deleteMutation.isError && (
            <p className="text-red-400 text-sm">
              Error removing from list. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
  // #endregion Render
};
