/**
 * src/components/EntryEditModal.tsx
 *
 * Shared shell behind the list edit modal: a numbered three-step form
 * (status, rating, thoughts) mirroring the Create composer, plus
 * remove/cancel/save actions. Copy, service calls, and cache invalidation are
 * supplied by the caller; this component owns no franchise/anime-specific
 * knowledge.
 *
 * Saving here never posts to the feed — that's the composer's job — so the
 * form says so rather than leaving the user guessing.
 */
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Trash2, X } from "lucide-react";
import { ModalShell } from "./ModalShell";
import { StatusOptionList } from "./StatusOptionList";
import { RatingPicker } from "./RatingPicker";
import { REVIEW_MAX } from "../constants/listEntry";
import type { AnimeStatus } from "../types/database.types";

// #region Types
export interface EntryEditModalProps<TPostSaveProps extends object = object> {
  eyebrow: string;
  title: string;
  subtitle: string;
  statusHeading: string;
  ratingHint: string;
  notesHeading: string;
  notesPlaceholder: string;
  removeLabel: string;
  removeConfirmText: string;
  initialStatus: AnimeStatus;
  initialRating: number | null;
  initialReview: string | null;
  onUpdate: (updates: {
    status: AnimeStatus;
    rating: number | null;
    review: string | null;
  }) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  /** Called after a successful save or remove. */
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
  eyebrow,
  title,
  subtitle,
  statusHeading,
  ratingHint,
  notesHeading,
  notesPlaceholder,
  removeLabel,
  removeConfirmText,
  initialStatus,
  initialRating,
  initialReview,
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
    // Prevent body scroll, and let Escape dismiss the modal.
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

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

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

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
    <ModalShell panelClassName="w-full max-w-xl max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-400">
              {eyebrow}
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold leading-tight text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <hr className="mt-6 border-zinc-800" />

        {/* 01 Status */}
        <section className="mt-6">
          <p className="font-mono text-xs font-semibold text-rose-400">01</p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {statusHeading}
          </h3>
          <div className="mt-3">
            <StatusOptionList
              value={status}
              onChange={(next) => next && setStatus(next)}
              disabled={isBusy}
            />
          </div>
        </section>

        {/* 02 Rating */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-semibold text-rose-400">
                02{" "}
                <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Optional
                </span>
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Your rating
              </h3>
            </div>
            {rating != null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="cursor-pointer text-sm text-zinc-500 transition-colors hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-4">
            <RatingPicker
              value={rating}
              onChange={setRating}
              hint={ratingHint}
              dialBackgroundClass="bg-neutral-900"
              disabled={isBusy}
            />
          </div>
        </section>

        {/* 03 Thoughts */}
        <section className="mt-8">
          <p className="font-mono text-xs font-semibold text-rose-400">
            03{" "}
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Optional
            </span>
          </p>
          <label
            htmlFor="review"
            className="mt-1 block text-lg font-semibold text-white"
          >
            {notesHeading}
          </label>
          <textarea
            id="review"
            value={review}
            maxLength={REVIEW_MAX}
            onChange={(e) => setReview(e.target.value)}
            placeholder={notesPlaceholder}
            rows={5}
            className="mt-3 w-full resize-y rounded-xl border border-zinc-800 bg-[#101014] px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-rose-400/60"
          />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            {review.length}/{REVIEW_MAX}
          </p>
        </section>

        <hr className="mt-8 border-zinc-800" />

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:flex-1"
          >
            <Send aria-hidden className="size-4" />
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-zinc-800 px-4 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40 sm:mr-auto sm:w-auto"
          >
            <Trash2 aria-hidden className="size-4" />
            {deleteMutation.isPending ? "Removing..." : removeLabel}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-zinc-600 sm:text-right">
          Won't be shared to the feed.
        </p>

        {/* Error Messages */}
        {updateMutation.isError && (
          <p className="mt-3 text-sm text-red-400">
            Error updating entry. Please try again.
          </p>
        )}

        {deleteMutation.isError && (
          <p className="mt-3 text-sm text-red-400">
            Error removing from list. Please try again.
          </p>
        )}
      </form>
    </ModalShell>
  );
  // #endregion Render
};
