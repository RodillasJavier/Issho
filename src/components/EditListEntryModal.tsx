/**
 * src/components/EditListEntryModal.tsx
 *
 * Edits one of the user's list entries, at either level. The two levels
 * differ only in copy and in whether the "mark all seasons completed?" prompt
 * applies, both of which come off the entry's kind — so this is one component
 * rather than a per-level pair.
 *
 * Saving updates list state only: no feed post is created, and existing posts
 * are left alone. /entry/:id renders the author's live status and rating, so
 * older posts reflect the edit without being rewritten.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  updateListEntry,
  removeListEntry,
  listInvalidationKeys,
} from "../services/supabase/userLists";
import { LIST_ENTRY_COPY } from "../constants/listEntry";
import { EntryEditModal } from "./EntryEditModal";
import { SeasonsCompletedPrompt } from "./SeasonsCompletedPrompt";
import type { ListEntry } from "../types/listEntry";

// #region Types
interface EditListEntryModalProps {
  entry: ListEntry;
  /** Display title — the anime's name, or the franchise's display title. */
  title: string;
  onClose: () => void;
}
// #endregion Types

// #region Component Logic
export const EditListEntryModal = ({
  entry,
  title,
  onClose,
}: EditListEntryModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const copy = LIST_ENTRY_COPY[entry.kind];

  return (
    <EntryEditModal
      eyebrow={copy.modalEyebrow}
      title={title}
      subtitle={copy.modalSubtitle}
      statusHeading={copy.statusHeading}
      ratingHint={copy.ratingHint}
      notesHeading={copy.notesHeading}
      notesPlaceholder={copy.notesPlaceholder}
      removeLabel={copy.removeLabel}
      removeConfirmText={copy.removeConfirmText}
      initialStatus={entry.status}
      initialRating={entry.rating}
      initialReview={entry.review}
      onUpdate={(updates) => updateListEntry(entry, updates)}
      onRemove={() => removeListEntry(entry)}
      onInvalidate={() => {
        listInvalidationKeys(user?.id).forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        );
      }}
      onClose={onClose}
      // Only a series can offer to sweep its seasons.
      PostSaveStep={
        entry.kind === "franchise" ? SeasonsCompletedPrompt : undefined
      }
      postSaveStepProps={
        entry.kind === "franchise"
          ? { franchiseKey: entry.franchise_key, franchiseTitle: title }
          : undefined
      }
    />
  );
};
// #endregion Component Logic
