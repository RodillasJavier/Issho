/**
 * src/components/EditListEntryModal.tsx
 *
 * Modal component for editing a user's anime list entry.
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  updateUserAnimeEntry,
  removeUserAnimeEntry,
} from "../services/supabase/userAnimeList";
import { EntryEditModal } from "./EntryEditModal";

// #region Types
import type { UserAnimeEntry } from "../types/database.types";

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
  const queryClient = useQueryClient();

  return (
    <EntryEditModal
      title="Edit List Entry"
      subtitle={entry.anime?.name}
      initialStatus={entry.status}
      initialRating={entry.rating}
      initialReview={entry.review}
      statusLabel="Status"
      ratingLabel="Rating (1-10)"
      notesLabel="Personal Notes"
      notesPlaceholder="Your personal thoughts and notes (private)..."
      removeConfirmText="Remove this anime from your list?"
      onUpdate={(updates) => updateUserAnimeEntry(entry.id, updates)}
      onRemove={() => removeUserAnimeEntry(entry.id)}
      onInvalidate={(statusChanged) => {
        queryClient.invalidateQueries({
          queryKey: ["userAnimeList", entry.anime_id],
        });
        queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
        // A rating/notes-only save never touches the entries table — only
        // invalidate the shared feed cache when it actually could have.
        if (statusChanged) {
          queryClient.invalidateQueries({ queryKey: ["entries"] });
        }
      }}
      onClose={onClose}
    />
  );
};
// #endregion Component Logic
