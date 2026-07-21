/**
 * src/components/ProfileListCard.tsx
 *
 * Shared presentational shell behind MyAnimeListItem/MyFranchiseListItem:
 * cover image, title, status/rating row, review preview, action row, and an
 * "Updated {date}" footer. Franchise-only bits (member-count badge, seasons
 * hint) are opt-in via props rather than baked into this shell.
 */
import { Link } from "react-router";
import { Star } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

// #region Types
export interface ProfileListCardProps {
  href: string;
  coverUrl?: string | null;
  coverAlt: string;
  title: string;
  /** Franchise-only: "{N} in list" badge overlaid on the cover */
  badge?: React.ReactNode;
  /** Year/episode/genre info (anime) or "{yearRange} • Series" (franchise) */
  metaLine?: React.ReactNode;
  status: AnimeStatus | null;
  /** Shown in place of a status badge when `status` is null (franchise-only). */
  noStatusLabel?: string;
  rating: number | null;
  reviewText: string | null;
  noReviewText: string;
  /** Franchise-only: "{watched}/{total} in list completed" hint */
  hintLine?: React.ReactNode;
  updatedAt?: string | null;
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  } | null;
}
// #endregion Types

// #region Render
export const ProfileListCard = ({
  href,
  coverUrl,
  coverAlt,
  title,
  badge,
  metaLine,
  status,
  noStatusLabel = "No status",
  rating,
  reviewText,
  noReviewText,
  hintLine,
  updatedAt,
  primaryAction,
}: ProfileListCardProps) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-950 to-rose-400 blur-sm opacity-0 group-hover:opacity-25 transition duration-250" />

      <div className="relative h-full z-10 bg-neutral-950 border border-neutral-800 rounded-md overflow-hidden transition-colors duration-250 group-hover:border-rose-400/50">
        {/* Image Container */}
        <Link to={href} className="block relative">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={coverAlt}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-neutral-800 flex items-center justify-center text-neutral-600">
              No Image
            </div>
          )}
          {badge}
        </Link>

        {/* Content */}
        <div className="px-4 py-3 space-y-3">
          {/* Title */}
          <Link
            to={href}
            className="block group-hover:text-rose-400 transition-colors"
          >
            <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
          </Link>

          {/* Metadata Row */}
          {metaLine}

          {/* Status Badge */}
          <div className="flex items-center gap-2 justify-between">
            {status ? (
              <span
                className={`px-3 py-1 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
            ) : (
              <span className="px-3 py-1 rounded text-xs border border-neutral-700 text-neutral-400">
                {noStatusLabel}
              </span>
            )}

            {rating && (
              <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                <Star className="size-4 fill-current" />
                {rating}/10
              </span>
            )}
          </div>

          {/* Franchise-only completed-seasons hint */}
          {hintLine}

          {/* Review/Notes Preview */}
          {reviewText ? (
            <p className="text-sm text-neutral-400 line-clamp-2">
              {reviewText}
            </p>
          ) : (
            <p className="text-sm italic text-neutral-400 line-clamp-2">
              {noReviewText}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {primaryAction.label}
              </button>
            )}

            <Link
              to={href}
              className="flex-1 px-3 py-2 bg-rose-500 hover:bg-rose-900 border border-rose-500 rounded text-sm text-center hover:text-rose-100 transition-colors"
            >
              Community
            </Link>
          </div>

          {/* Last Updated */}
          {updatedAt && (
            <p className="text-xs text-neutral-500">
              Updated {new Date(updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
// #endregion Render
