/**
 * src/components/FeaturedEntry.tsx
 *
 * Oversized hero card for the most recent activity-feed entry, shown
 * alongside FollowingPanel at the top of EntryList. Unlike the grid cards in
 * EntryItem, this is a one-off signature element — it doesn't need to match
 * a fixed size against anything else on the page.
 */
import { Link } from "react-router";
import { ArrowRight, Star } from "lucide-react";
import { getEntryVerbPhrase } from "../constants/entryTypes";
import { formatRelativeTime } from "../utils/formatRelativeTime";

// #region Types
import type { Entry } from "../types/database.types";

interface FeaturedEntryProps {
  entry: Entry;
  anonymized?: boolean;
}
// #endregion

// #region Component Logic
export const FeaturedEntry = ({
  entry,
  anonymized = false,
}: FeaturedEntryProps) => {
  const authorLabel = anonymized
    ? "Someone"
    : (entry.profile?.username ?? "Unknown");
  // #endregion

  // #region Render
  return (
    <Link
      to={`/entry/${entry.id}`}
      aria-label={`Read ${authorLabel}'s entry for ${entry.anime?.name ?? "Unknown Anime"}`}
      className="group relative block min-h-68 overflow-hidden rounded-md border border-rose-400/25 bg-neutral-900 transition-colors hover:border-rose-300/60"
    >
      {entry.anime?.cover_image_url && (
        <img
          src={entry.anime.cover_image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}
      <div className="absolute inset-0 bg-black/60" />

      <article className="relative flex h-full min-h-68 flex-col justify-end p-6">
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
          {entry.anime?.name ?? "Unknown Anime"}
        </h2>

        {entry.content && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-200">
            {entry.content}
          </p>
        )}

        <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white underline decoration-rose-400 decoration-2 underline-offset-4">
          Read entry{" "}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </article>
    </Link>
  );
  // #endregion Render
};
// #endregion
