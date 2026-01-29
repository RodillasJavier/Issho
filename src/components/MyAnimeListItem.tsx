/**
 * src/components/MyAnimeListItem.tsx
 *
 * Component that displays a single anime in the user's personal list.
 */
import { useState } from "react";
import { Link } from "react-router";
import { EditListEntryModal } from "./EditListEntryModal";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";

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
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-950 to-rose-400 blur-sm opacity-0 group-hover:opacity-25 transition duration-250" />

        <div className="relative z-10 bg-neutral-950 border border-neutral-800 rounded-md overflow-hidden transition-colors duration-250 group-hover:border-rose-400/50">
          {/* Image Container */}
          <Link to={`/anime/${entry.anime_id}`} className="block">
            {entry.anime?.cover_image_url ? (
              <img
                src={entry.anime.cover_image_url}
                alt={entry.anime.name}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-neutral-800 flex items-center justify-center text-neutral-600">
                No Image
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <Link
              to={`/anime/${entry.anime_id}`}
              className="block group-hover:text-rose-400 transition-colors"
            >
              <h3 className="text-lg font-semibold line-clamp-2">
                {entry.anime?.name || "Unknown Anime"}
              </h3>
            </Link>

            {/* Status Badge */}
            <div className="flex items-center gap-2 justify-between">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold ${STATUS_COLORS[entry.status]}`}
              >
                {STATUS_LABELS[entry.status]}
              </span>

              {entry.rating && (
                <span className="text-yellow-500 font-semibold">
                  ⭐ {entry.rating}/10
                </span>
              )}
            </div>

            {/* Personal Notes Preview */}
            {entry.review ? (
              <p className="text-sm text-neutral-400 line-clamp-2">
                {entry.review}
              </p>
            ) : (
              <p className="text-sm italic text-neutral-400 line-clamp-2">
                No review added.
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors cursor-pointer"
              >
                Edit
              </button>

              <Link
                to={`/anime/${entry.anime_id}`}
                className="flex-1 px-3 py-2 bg-rose-500 hover:bg-rose-900 border border-rose-500 rounded text-sm text-center hover:text-rose-100 transition-colors"
              >
                Community
              </Link>
            </div>

            {/* Last Updated */}
            <p className="text-xs text-neutral-500">
              Updated {new Date(entry.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

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
