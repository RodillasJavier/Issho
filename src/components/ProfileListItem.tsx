/**
 * src/components/ProfileListItem.tsx
 *
 * One card in a profile's list, for either level. Which level a card is was
 * already decided by buildProfileListCards, so this only has to render it and
 * open the right edit modal.
 *
 * A series the user tracks season-by-season has no series row yet; editing
 * one creates it first, seeded with the status the card was already showing,
 * so the modal never opens onto something that doesn't exist.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { ProfileListCard } from "./ProfileListCard";
import { EditListEntryModal } from "./EditListEntryModal";
import {
  addListEntry,
  listInvalidationKeys,
} from "../services/supabase/userLists";
import { LIST_ENTRY_COPY } from "../constants/listEntry";
import { yearRangeLabel } from "../utils/franchise";
import { splitGenres } from "../utils/anime";
import { toAnimeListEntry } from "../types/listEntry";
import type { FranchiseListEntry } from "../types/listEntry";
import type { ProfileListCardModel } from "../utils/listEntries";

// #region Types
interface ProfileListItemProps {
  card: ProfileListCardModel;
  isOwnProfile: boolean;
}
// #endregion Types

// #region Component Logic
export const ProfileListItem = ({
  card,
  isOwnProfile,
}: ProfileListItemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FranchiseListEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const copy = LIST_ENTRY_COPY[card.isFranchise ? "franchise" : "anime"];
  const yearRange = yearRangeLabel(card.years);

  // Editing a derived-status series has to materialize the row first.
  const createSeriesEntry = useMutation({
    mutationFn: () =>
      addListEntry(
        { kind: "franchise", franchise_key: card.franchiseKey! },
        user!.id,
        card.status
      ),
    onSuccess: (entry) => {
      listInvalidationKeys(user?.id).forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      if (entry.kind === "franchise") {
        setEditing(entry);
        setShowEditModal(true);
      }
    },
  });

  const handleEdit = () => {
    if (card.isFranchise && !card.franchiseEntry) {
      createSeriesEntry.mutate();
      return;
    }
    setEditing(null);
    setShowEditModal(true);
  };

  // What the modal edits: the series row (existing or just created), else the
  // card's single season.
  const entryToEdit =
    editing ??
    card.franchiseEntry ??
    (card.seasons.length > 0 ? toAnimeListEntry(card.seasons[0]) : null);

  const completedSeasons = card.seasons.filter(
    (season) => season.status === "completed"
  ).length;
  // #endregion Component Logic

  // #region Render
  return (
    <>
      <ProfileListCard
        href={
          card.isFranchise
            ? `/series/${card.franchiseKey}`
            : `/anime/${card.animeId}`
        }
        coverUrl={card.coverUrl}
        title={card.title}
        badge={
          card.isFranchise && card.seasons.length > 0 ? (
            <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-zinc-300 uppercase backdrop-blur">
              {card.seasons.length} in list
            </span>
          ) : undefined
        }
        metaLine={
          <p className="mt-1 text-[11px] text-zinc-500">
            {[
              yearRange,
              card.isFranchise ? "Series" : null,
              card.episodeCount ? `${card.episodeCount} eps` : null,
              splitGenres(card.genres).slice(0, 2).join(", ") || null,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        }
        status={card.status}
        rating={card.rating}
        hintLine={
          card.isFranchise && card.seasons.length > 0 ? (
            <p className="mt-2 text-[11px] text-zinc-500">
              {completedSeasons} / {card.seasons.length} in list completed
            </p>
          ) : undefined
        }
        reviewText={card.review}
        noReviewText={copy.noReviewText}
        updatedAt={card.updatedAt || null}
        onEdit={isOwnProfile ? handleEdit : undefined}
      />

      {showEditModal && entryToEdit && (
        <EditListEntryModal
          entry={entryToEdit}
          title={card.title}
          onClose={() => {
            setShowEditModal(false);
            setEditing(null);
          }}
        />
      )}
    </>
  );
  // #endregion Render
};
