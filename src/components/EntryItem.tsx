/**
 * src/components/EntryItem.tsx
 *
 * A single activity-feed card: cover image, author + timestamp, title,
 * status/rating, review preview, and vote/comment counts. Every optional
 * slot (badges row, text preview) reserves its own height whether or not it
 * has content, so every card in the grid renders at the same size.
 */
import { Link } from "react-router";
import { MessageCircle, Star } from "lucide-react";
import { getEntryTypeLabel } from "../constants/entryTypes";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { useAuth } from "../hooks/useAuth";
import { UserAvatar } from "./UserAvatar";
import { EntryTypeIcon } from "./EntryTypeIcon";
import { EntryVoteButtons } from "./EntryVoteButtons";

// #region Types
import type { Entry } from "../types/database.types";

interface EntryItemProps {
  entry: Entry;
  anonymized?: boolean;
}
// #endregion

// #region Component Logic
export const EntryItem = ({ entry, anonymized = false }: EntryItemProps) => {
  const { user } = useAuth();
  const isCurrentUser = !anonymized && entry.user_id === user?.id;
  const authorLabel = anonymized
    ? "Anonymous"
    : isCurrentUser
      ? "You"
      : (entry.profile?.username ?? "Unknown");
  // #endregion

  // #region Render
  return (
    <div className="group relative h-full">
      <div className="absolute -inset-1 rounded-md bg-gradient-to-r from-rose-950 to-rose-400 opacity-0 blur-sm transition duration-250 group-hover:opacity-25" />

      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-md border border-neutral-800 bg-neutral-950 transition-colors duration-250 group-hover:border-rose-400/50">
        <Link to={`/entry/${entry.id}`} className="flex flex-1 flex-col">
          {/* Cover image — fixed aspect ratio so every card starts from the same height */}
          <div className="aspect-video w-full shrink-0 overflow-hidden bg-neutral-900">
            {entry.anime?.cover_image_url ? (
              <img
                src={entry.anime.cover_image_url}
                alt={entry.anime.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-600">
                No Image
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-4">
            {/* Author row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {anonymized ? (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[10px] text-neutral-300">
                    ?
                  </div>
                ) : (
                  <UserAvatar
                    username={entry.profile?.username ?? "?"}
                    avatarUrl={entry.profile?.avatar_url ?? null}
                    size="sm"
                    linkToProfile={false}
                  />
                )}
                <span className="truncate text-xs font-semibold text-neutral-300">
                  {authorLabel}
                </span>
              </div>
              <time className="shrink-0 text-xs text-neutral-500">
                {formatRelativeTime(entry.created_at)}
              </time>
            </div>

            {/* Entry type */}
            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-rose-400">
              <EntryTypeIcon type={entry.entry_type} className="size-3" />
              {getEntryTypeLabel(entry.entry_type)}
            </div>

            {/* Title */}
            <div className="mt-1 line-clamp-1 text-base font-semibold text-white transition-colors group-hover:text-rose-300">
              {entry.anime?.name ?? "Unknown Anime"}
            </div>

            {/* Status + rating — reserved height, present or not */}
            <div className="mt-2 flex min-h-[26px] flex-wrap items-center gap-2">
              {entry.status_value && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_COLORS[entry.status_value]}`}
                >
                  {STATUS_LABELS[entry.status_value]}
                </span>
              )}

              {entry.rating_value && (
                <span className="flex items-center gap-1 text-xs font-semibold text-yellow-500">
                  <Star className="size-3 fill-current" />
                  {entry.rating_value}/10
                </span>
              )}
            </div>

            {/* Review/content preview — reserved height, present or not */}
            <div className="mt-2 min-h-10">
              {entry.content && (
                <p className="line-clamp-2 text-sm leading-5 text-neutral-400">
                  {entry.content}
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Footer — outside the Link so the vote buttons aren't nested
            inside an anchor (invalid HTML and messy click handling) */}
        <div className="flex items-center gap-4 border-t border-neutral-800 px-4 py-3 text-xs text-neutral-500">
          <EntryVoteButtons entry={entry} />
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {entry.comment_count ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
  // #endregion Render
};
// #endregion
