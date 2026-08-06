/**
 * src/constants/listEntry.ts
 *
 * Copy that differs between the two list levels. The components themselves
 * are shared; only the words change, so they live here rather than in a
 * second copy of each component.
 */
import type { ListEntryKind } from "../types/listEntry";

/** Shared by the Create composer and the list edit modal's review textareas. */
export const REVIEW_MAX = 2000;

export const LIST_ENTRY_COPY: Record<
  ListEntryKind,
  {
    modalEyebrow: string;
    modalSubtitle: string;
    statusHeading: string;
    ratingHint: string;
    notesHeading: string;
    notesPlaceholder: string;
    removeLabel: string;
    removeConfirmText: string;
    addButtonLabel: string;
    noReviewText: string;
    /** Prefix on the detail-page status button, e.g. "Series: Watching". */
    statusPrefix: string;
    /** Detail-page "add" button fill — filled for anime, outlined for a
     * series. Layered onto ListStatusButton's shared buttonBase, which owns
     * shape/sizing (both this and STATUS_COLORS only ever set color). */
    addButtonClassName: string;
  }
> = {
  anime: {
    modalEyebrow: "Edit entry",
    modalSubtitle: "Update where you are, your score, and your thoughts.",
    statusHeading: "Where are you?",
    ratingHint: "Tap a score. You can still save without one.",
    notesHeading: "Your thoughts",
    notesPlaceholder:
      "A first impression, a final verdict, or just a moment you loved...",
    removeLabel: "Remove from list",
    removeConfirmText: "Remove this anime from your list?",
    addButtonLabel: "Add to list",
    noReviewText: "No review added.",
    statusPrefix: "",
    addButtonClassName: "bg-rose-500 text-white hover:bg-rose-600",
  },
  franchise: {
    modalEyebrow: "Edit series",
    modalSubtitle:
      "This covers the series as a whole — seasons keep their own status.",
    statusHeading: "Where are you in the series?",
    ratingHint: "Tap a score for the series. You can still save without one.",
    notesHeading: "Your thoughts on the series",
    notesPlaceholder: "Your thoughts on the series as a whole...",
    removeLabel: "Remove series",
    removeConfirmText: "Remove this series from your list?",
    addButtonLabel: "Track whole series",
    noReviewText: "No series review added.",
    statusPrefix: "Series: ",
    addButtonClassName:
      "border border-rose-500/50 bg-neutral-800 text-white hover:bg-neutral-700",
  },
};
