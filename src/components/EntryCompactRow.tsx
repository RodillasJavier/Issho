/**
 * src/components/EntryCompactRow.tsx
 *
 * Slim single-line entry row for the season/series detail pages' "Recent
 * entries" list — the compact counterpart to FeaturedEntry's spotlight
 * treatment there, built from the same author/vote/type pieces EntryItem
 * uses for the homepage grid.
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
import {
  hasAuthor,
  type Entry,
  type PublicEntry,
} from "../types/database.types";

interface EntryCompactRowProps {
  entry: Entry | PublicEntry;
}

export const EntryCompactRow = ({ entry }: EntryCompactRowProps) => {
  const { user } = useAuth();
  const isAnonymous = !hasAuthor(entry);
  const isCurrentUser = !isAnonymous && entry.user_id === user?.id;
  const authorLabel = isAnonymous
    ? "Anonymous"
    : isCurrentUser
      ? "You"
      : (entry.profile?.username ?? "Unknown");

  return (
    <div className="group flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 transition-colors hover:border-rose-400/40">
      <Link
        to={`/entry/${entry.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {isAnonymous ? (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[10px] text-neutral-300">
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

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-semibold text-neutral-200">
              {authorLabel}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-rose-400">
              <EntryTypeIcon type={entry.entry_type} className="size-2.5" />
              {getEntryTypeLabel(entry.entry_type)}
            </span>
            {entry.status_value && (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[entry.status_value]}`}
              >
                {STATUS_LABELS[entry.status_value]}
              </span>
            )}
            {entry.rating_value && (
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-yellow-500">
                <Star className="size-3 fill-current" />
                {entry.rating_value}/10
              </span>
            )}
            <time className="ml-auto shrink-0 text-[11px] text-neutral-500">
              {formatRelativeTime(entry.created_at)}
            </time>
          </div>

          {entry.content && (
            <p className="mt-0.5 truncate text-xs text-neutral-400">
              {entry.content}
            </p>
          )}
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-3 text-xs text-neutral-500">
        <EntryVoteButtons entry={entry} />
        <span className="flex items-center gap-1">
          <MessageCircle className="size-3.5" />
          {entry.comment_count ?? 0}
        </span>
      </div>
    </div>
  );
};
