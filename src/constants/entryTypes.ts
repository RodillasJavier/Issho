/**
 * src/utils/entryTypes.ts
 *
 * Utility functions and constants for entry types.
 */
import { formatRelativeTime } from "../utils/formatRelativeTime";
import type { EntryType } from "../types/database.types";

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  review: "Review",
  rating: "Rating (1-10)",
  status_update: "Status Update",
};

export const ENTRY_TYPE_PLACEHOLDERS: Record<EntryType, string> = {
  review: "Write your review here...",
  rating: "Enter a rating from 1 to 10",
  status_update: "Share your thoughts on this anime...",
};

/**
 * Get a user-friendly label for an entry type.
 * @param type The entry type.
 * @returns A string to be used as a label for the entry type.
 */
export const getEntryTypeLabel = (type: string): string => {
  switch (type) {
    case "review":
      return "Review";
    case "rating":
      return "Rating";
    case "status_update":
      return "Status Update";
    default:
      return type;
  }
};

/**
 * Get a verb phrase describing what a user did when posting an entry, for
 * use in a sentence like "{username} {phrase}".
 * @param type The entry type.
 * @returns A verb phrase, e.g. "shared a review".
 */
export const getEntryVerbPhrase = (type: string): string => {
  switch (type) {
    case "review":
      return "shared a review";
    case "rating":
      return "rated it";
    case "status_update":
      return "posted a status update";
    default:
      return "posted an update";
  }
};

/**
 * Format an entry as a short activity blurb, e.g. "shared a review · 42m ago".
 * @param entry The entry's type and timestamp.
 * @returns The formatted blurb.
 */
export const getEntryActivityLabel = (entry: {
  entry_type: string;
  created_at: string;
}): string =>
  `${getEntryVerbPhrase(entry.entry_type)} · ${formatRelativeTime(entry.created_at)}`;
