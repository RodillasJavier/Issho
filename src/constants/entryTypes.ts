/**
 * src/utils/entryTypes.ts
 *
 * Utility functions and constants for entry types.
 */
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
      return "📝 Review";
    case "rating":
      return "⭐ Rating";
    case "status_update":
      return "📺 Status Update";
    default:
      return type;
  }
};
