/**
 * src/components/MyAnimeListItem.tsx
 *
 * Component that displays a single anime in the user's personal list on the
 * profile page.
 */
import { useState } from "react";
import { EditListEntryModal } from "./EditListEntryModal";
import { ProfileListCard } from "./ProfileListCard";

// #region Types
import type { UserAnimeEntry } from "../types/database.types";

interface MyAnimeListItemProps {
  entry: UserAnimeEntry;
}
// #endregion Types

// #region Component Logic

export const MyAnimeListItem = ({ entry }: MyAnimeListItemProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  // #endregion Component Logic

  // #region Render
  return (
    <>
      <ProfileListCard
        href={`/anime/${entry.anime_id}`}
        coverUrl={entry.anime?.cover_image_url}
        coverAlt={entry.anime?.name ?? "Unknown Anime"}
        title={entry.anime?.name || "Unknown Anime"}
        metaLine={
          <>
            {(entry.anime?.year || entry.anime?.episode_count) && (
              <div className="flex gap-1 text-xs text-gray-400">
                {entry.anime?.year && <span>{entry.anime.year}</span>}
                {entry.anime?.episode_count && (
                  <span>• {entry.anime.episode_count} eps</span>
                )}
              </div>
            )}

            {entry.anime?.genres && (
              <div className="flex flex-wrap gap-1">
                {entry.anime.genres
                  .split(", ")
                  .slice(0, 2)
                  .map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-xs"
                    >
                      {genre}
                    </span>
                  ))}
              </div>
            )}
          </>
        }
        status={entry.status}
        rating={entry.rating}
        reviewText={entry.review}
        noReviewText="No review added."
        updatedAt={entry.updated_at}
        primaryAction={{
          label: "Edit",
          onClick: () => setShowEditModal(true),
        }}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <EditListEntryModal
          entry={entry}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
  // #endregion Render
};
