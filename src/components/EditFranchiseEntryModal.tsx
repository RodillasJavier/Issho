/**
 * src/components/EditFranchiseEntryModal.tsx
 *
 * Modal for editing a user's series-level (franchise) entry. After the user
 * marks a series completed, offers an optional, dismissible prompt to mark
 * the individual seasons completed too — never applied automatically.
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  updateUserFranchiseEntry,
  removeUserFranchiseEntry,
} from "../services/supabase/userFranchiseList";
import { EntryEditModal } from "./EntryEditModal";
import { SeasonsCompletedPrompt } from "./SeasonsCompletedPrompt";

// #region Types
import type { UserFranchiseEntry } from "../types/database.types";

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
  const queryClient = useQueryClient();

  return (
    <EntryEditModal
      title="Edit Series Entry"
      subtitle={franchiseTitle}
      initialStatus={entry.status}
      initialRating={entry.rating}
      initialReview={entry.review}
      statusLabel="Series Status"
      ratingLabel="Series Rating (1-10)"
      notesLabel="Series Notes"
      notesPlaceholder="Your thoughts on the series as a whole..."
      removeConfirmText="Remove this series from your list?"
      onUpdate={(updates) => updateUserFranchiseEntry(entry.id, updates)}
      onRemove={() => removeUserFranchiseEntry(entry.id)}
      onInvalidate={() => {
        queryClient.invalidateQueries({ queryKey: ["userFranchiseList"] });
      }}
      onClose={onClose}
      PostSaveStep={SeasonsCompletedPrompt}
      postSaveStepProps={{
        franchiseKey: entry.franchise_key,
        franchiseTitle,
      }}
    />
  );
};
// #endregion Component Logic
