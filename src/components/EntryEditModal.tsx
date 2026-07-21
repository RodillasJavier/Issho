/**
 * src/components/EntryEditModal.tsx
 *
 * Shared shell behind EditListEntryModal/EditFranchiseEntryModal: a status
 * select, rating input, notes textarea, and delete/cancel/save actions.
 * Copy, service calls, and cache invalidation are supplied by the caller;
 * this component owns no franchise/anime-specific knowledge.
 */
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { STATUS_LABELS } from "../constants/animeStatus";
import { ModalShell } from "./ModalShell";
import type { AnimeStatus } from "../types/database.types";

// #region Types
export interface EntryEditModalProps<TPostSaveProps extends object = object> {
  title: string;
  subtitle?: string;
  initialStatus: AnimeStatus;
  initialRating: number | null;
  initialReview: string | null;
  statusLabel: string;
  ratingLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  removeConfirmText: string;
  onUpdate: (updates: {
    status: AnimeStatus;
    rating: number | null;
    review: string | null;
  }) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onInvalidate: () => void;
  onClose: () => void;
  /**
   * Rendered instead of auto-closing when the update just transitioned
   * status to "completed". A real component (not a plain callback) so it
   * can safely use hooks of its own. Extra props it needs beyond `onClose`
   * are threaded through `postSaveStepProps` rather than baked into this
   * shell's own prop contract.
   */
  PostSaveStep?: React.ComponentType<{ onClose: () => void } & TPostSaveProps>;
  postSaveStepProps?: TPostSaveProps;
}
// #endregion Types

// #region Component Logic
export const EntryEditModal = <TPostSaveProps extends object = object>({
  title,
  subtitle,
  initialStatus,
  initialRating,
  initialReview,
  statusLabel,
  ratingLabel,
  notesLabel,
  notesPlaceholder,
  removeConfirmText,
  onUpdate,
  onRemove,
  onInvalidate,
  onClose,
  PostSaveStep,
  postSaveStepProps,
}: EntryEditModalProps<TPostSaveProps>) => {
  const [status, setStatus] = useState<AnimeStatus>(initialStatus);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [review, setReview] = useState<string>(initialReview || "");
  const [showPostSave, setShowPostSave] = useState(false);

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
      onUpdate({ status, rating: rating || null, review: review || null }),
    onSuccess: () => {
      onInvalidate();
      const justCompleted =
        initialStatus !== "completed" && status === "completed";
      if (PostSaveStep && justCompleted) {
        setShowPostSave(true);
      } else {
        onClose();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: onRemove,
    onSuccess: () => {
      onInvalidate();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm(removeConfirmText)) {
      deleteMutation.mutate();
    }
  };
  // #endregion Component Logic

  // #region Render
  if (showPostSave && PostSaveStep) {
    return (
      <PostSaveStep
        onClose={onClose}
        {...(postSaveStepProps as TPostSaveProps)}
      />
    );
  }

  return (
    <ModalShell panelClassName="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start p-6 border-b border-neutral-800">
        <div>
          <h2 className="text-3xl font-bold text-white">{title}</h2>

          {subtitle && <p className="text-lg text-neutral-400">{subtitle}</p>}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Status */}
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium">
            {statusLabel}
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
            {ratingLabel}
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
            {notesLabel}
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={notesPlaceholder}
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
    </ModalShell>
  );
  // #endregion Render
};
