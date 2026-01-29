/**
 * src/components/EditListEntryModal.tsx
 *
 * Modal component for editing a user's anime list entry.
 */
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateUserAnimeEntry,
  removeUserAnimeEntry,
} from "../api/userAnimeList";

// #region Types
import type { UserAnimeEntry, AnimeStatus } from "../types/database.types";

interface EditListEntryModalProps {
  entry: UserAnimeEntry;
  onClose: () => void;
}
// #endregion Types

// #region Component Logic
export const EditListEntryModal = ({
  entry,
  onClose,
}: EditListEntryModalProps) => {
  const [status, setStatus] = useState<AnimeStatus>(entry.status);
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [review, setReview] = useState<string>(entry.review || "");
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      // Allow body scroll when modal is closed
      document.body.style.overflow = "unset";
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUserAnimeEntry(entry.id, {
        status,
        rating: rating || null,
        review: review || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userAnimeList", entry.anime_id],
      });
      queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeUserAnimeEntry(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userAnimeList", entry.anime_id],
      });
      queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm("Remove this anime from your list?")) {
      deleteMutation.mutate();
    }
  };
  // #endregion Component Logic

  // #region Render
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-800">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-3xl font-bold text-white">Edit List Entry</h2>

            {entry.anime && (
              <p className="text-lg text-neutral-400">{entry.anime.name}</p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AnimeStatus)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:outline-none focus:border-rose-500"
            >
              <option value="not_started">Plan to Watch</option>
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label htmlFor="rating" className="block text-sm font-medium">
              Rating (1-10)
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
              Personal Notes
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Your personal thoughts and notes (private)..."
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
