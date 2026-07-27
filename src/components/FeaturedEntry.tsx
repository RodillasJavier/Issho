/**
 * src/components/FeaturedEntry.tsx
 *
 * Oversized hero carousel for the most recent activity-feed entries, shown
 * alongside FollowingPanel at the top of EntryList. Unlike the grid cards in
 * EntryItem, this is a one-off signature element — it doesn't need to match
 * a fixed size against anything else on the page. Auto-rotates through the
 * given entries (most recent first), pausing on hover; dots allow jumping
 * directly to a slide.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { getEntryVerbPhrase } from "../constants/entryTypes";
import { formatRelativeTime } from "../utils/formatRelativeTime";

// #region Types
import {
  hasAuthor,
  type Entry,
  type PublicEntry,
} from "../types/database.types";

interface FeaturedEntryProps {
  entries: (Entry | PublicEntry)[];
}
// #endregion

const ROTATE_INTERVAL_MS = 6000;

// #region Component Logic
export const FeaturedEntry = ({ entries }: FeaturedEntryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || entries.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % entries.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPaused, entries.length]);

  const entry = entries[activeIndex];
  if (!entry) return null;

  const authorLabel = hasAuthor(entry)
    ? (entry.profile?.username ?? "Unknown")
    : "Someone";

  // Arrow/dot clicks sit inside the card-wide link; stop them from also
  // triggering navigation to the entry.
  const goToPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((i) => (i - 1 + entries.length) % entries.length);
  };
  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((i) => (i + 1) % entries.length);
  };
  // #endregion

  // #region Render
  return (
    <Link
      to={`/entry/${entry.id}`}
      aria-label={`Read ${authorLabel}'s entry for ${entry.anime?.name ?? "Unknown Anime"}`}
      className="group relative block min-h-68 overflow-hidden rounded-md border border-rose-400/25 bg-neutral-900 transition-colors hover:border-rose-300/60"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {entries.map((slide, index) => (
        <img
          key={slide.id}
          src={slide.anime?.cover_image_url ?? undefined}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            index === activeIndex ? "opacity-60" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-black/60" />

      {entries.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous entry"
            className="absolute left-3 top-1/2 z-10 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition hover:scale-105 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next entry"
            className="absolute right-3 top-1/2 z-10 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition hover:scale-105 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-95"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      <article
        key={entry.id}
        className="relative flex h-full min-h-68 flex-col justify-end p-6"
      >
        <div className="mb-auto flex items-center justify-between gap-4 text-sm text-neutral-300">
          <span>
            {authorLabel} {getEntryVerbPhrase(entry.entry_type)}
          </span>
          <span className="shrink-0">
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>

        {entry.rating_value && (
          <div className="mt-8 flex items-center gap-2 text-sm font-medium text-yellow-400">
            <Star className="size-4 fill-current" />
            {entry.rating_value}/10
          </div>
        )}

        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {(entry.franchise_key
            ? (entry.anime?.franchise_title ?? entry.anime?.name)
            : entry.anime?.name) ?? "Unknown Anime"}
        </h2>

        {entry.content && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-200">
            {entry.content}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 text-sm text-white underline decoration-2 decoration-transparent underline-offset-4 transition-colors group-hover:font-semibold group-hover:decoration-rose-400">
            Read entry{" "}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>

          {entries.length > 1 && (
            <div className="flex items-center gap-1.5">
              {entries.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIndex(index);
                  }}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === activeIndex}
                  className="relative h-1.5 w-6 cursor-pointer overflow-hidden rounded-full bg-white/25 transition-transform hover:scale-y-150 hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  {index === activeIndex && (
                    <span
                      className="animate-featured-progress absolute inset-0 rounded-full bg-rose-400"
                      style={{
                        animationDuration: `${ROTATE_INTERVAL_MS}ms`,
                        animationPlayState: isPaused ? "paused" : "running",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
  // #endregion Render
};
// #endregion
