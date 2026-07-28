/**
 * src/components/ProfileListCard.tsx
 *
 * Shared presentational shell behind the profile's list cards: cover, title,
 * status/rating row, review preview, and an owner-only Edit action.
 *
 * The cover and the title already link to the community page for this show,
 * so the card carries no separate button for it.
 */
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ImageIcon, Pencil, Star } from "lucide-react";
import { WatchStatusBadge } from "./WatchStatusBadge";
import type { AnimeStatus } from "../types/database.types";

// #region Types
export interface ProfileListCardProps {
  href: string;
  coverUrl?: string | null;
  title: string;
  /** Franchise-only: "{N} in list" badge overlaid on the cover */
  badge?: React.ReactNode;
  /** Year/episode/genre info (anime) or "{yearRange} • Series" (franchise) */
  metaLine?: React.ReactNode;
  status: AnimeStatus;
  rating: number | null;
  /** Franchise-only: "{watched} / {total} in list completed" hint */
  hintLine?: React.ReactNode;
  reviewText: string | null;
  noReviewText: string;
  updatedAt?: string | null;
  onEdit?: () => void;
}
// #endregion Types

// #region Render
export const ProfileListCard = ({
  href,
  coverUrl,
  title,
  badge,
  metaLine,
  status,
  rating,
  hintLine,
  reviewText,
  noReviewText,
  updatedAt,
  onEdit,
}: ProfileListCardProps) => (
  <motion.article
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#0c0c0f] transition-colors hover:border-zinc-700"
  >
    {/* Cover — the whole card links to the community page */}
    <Link
      to={href}
      aria-label={`Open ${title}`}
      className="relative block aspect-[3/4] shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-inset"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-neutral-900">
          <ImageIcon aria-hidden className="size-8 text-zinc-700" />
        </div>
      )}
      {badge}
    </Link>

    {/* Body */}
    <div className="flex flex-1 flex-col p-3">
      <h3>
        <Link
          to={href}
          className="line-clamp-2 text-sm leading-snug font-semibold text-white transition-colors hover:text-rose-400 focus:outline-none focus-visible:text-rose-400"
        >
          {title}
        </Link>
      </h3>

      {metaLine}

      {/* Fixed height so cards with and without a rating still line up */}
      <div className="mt-2.5 flex min-h-[22px] items-center justify-between gap-2">
        <WatchStatusBadge status={status} />
        {rating != null && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-yellow-400">
            <Star aria-hidden className="size-3.5 fill-current" />
            {rating}/10
            <span className="sr-only">rating</span>
          </span>
        )}
      </div>

      {hintLine}

      <p
        className={`mt-2 line-clamp-3 text-xs leading-relaxed ${
          reviewText ? "text-zinc-400" : "text-zinc-600 italic"
        }`}
      >
        {reviewText ?? noReviewText}
      </p>

      {/* Pinned to the bottom so every card's footer aligns */}
      <div className="mt-auto pt-3">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit your entry for ${title}`}
            className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-neutral-950/60 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <Pencil aria-hidden className="size-3.5" />
            Edit
          </button>
        )}

        {updatedAt && (
          <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-zinc-600 uppercase">
            Updated {new Date(updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  </motion.article>
);
// #endregion Render
