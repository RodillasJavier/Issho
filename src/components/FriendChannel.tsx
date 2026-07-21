/**
 * src/components/FriendChannel.tsx
 *
 * One friend's section in the Friends page "channels" view: header (avatar,
 * name, latest-activity blurb, link to their profile) plus a row of their
 * most recent entries. Entries are passed in already filtered/sliced by the
 * caller — this component only renders.
 */
import { Link } from "react-router";
import { Check, Play, Star } from "lucide-react";
import { STATUS_LABELS } from "../constants/animeStatus";
import {
  getEntryActivityLabel,
  getEntryTypeLabel,
} from "../constants/entryTypes";
import { UserAvatar } from "./UserAvatar";

// #region Types
import type { AnimeStatus } from "../types/database.types";
import type { Entry, Profile } from "../types/database.types";

interface FriendChannelProps {
  friend: Profile;
  entries: Entry[];
  entriesLoading: boolean;
}
// #endregion Types

const STATUS_TEXT_COLORS: Record<AnimeStatus, string> = {
  completed: "text-emerald-300",
  watching: "text-sky-300",
  not_started: "text-neutral-400",
  dropped: "text-red-400",
};

// #region Component Logic
export const FriendChannel = ({
  friend,
  entries,
  entriesLoading,
}: FriendChannelProps) => {
  const latestEntry = entries[0];
  const activityLabel = latestEntry
    ? getEntryActivityLabel(latestEntry)
    : "No activity yet";

  return (
    <section aria-labelledby={`${friend.id}-channel`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            username={friend.username}
            avatarUrl={friend.avatar_url}
            size="md"
            linkToProfile={false}
          />
          <div className="min-w-0">
            <h2
              id={`${friend.id}-channel`}
              className="text-base font-semibold text-white"
            >
              {friend.username}
            </h2>
            <p className="truncate text-xs text-neutral-500">{activityLabel}</p>
          </div>
        </div>
        <Link
          to={`/profile/${friend.username}`}
          className="hidden shrink-0 rounded-md px-2 py-1 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200 sm:inline-flex"
        >
          View profile
        </Link>
      </div>

      {entriesLoading ? (
        <p className="text-xs text-neutral-600">Loading activity...</p>
      ) : entries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {entries.map((entry) => (
            <FriendChannelCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-600">No activity yet.</p>
      )}
    </section>
  );
};

const FriendChannelCard = ({ entry }: { entry: Entry }) => {
  const statusColor = entry.status_value
    ? STATUS_TEXT_COLORS[entry.status_value]
    : "text-neutral-400";

  return (
    <Link
      to={`/entry/${entry.id}`}
      className="group flex min-w-0 gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 transition-colors hover:border-neutral-700"
    >
      <div className="size-[88px] shrink-0 overflow-hidden rounded-lg bg-neutral-900">
        {entry.anime?.cover_image_url ? (
          <img
            src={entry.anime.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
          {getEntryTypeLabel(entry.entry_type)}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white transition-colors group-hover:text-rose-300">
          {entry.anime?.name ?? "Unknown Anime"}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {entry.status_value && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusColor}`}
            >
              {entry.status_value === "completed" ? (
                <Check className="size-3" />
              ) : entry.status_value === "watching" ? (
                <Play className="size-3" />
              ) : null}
              {STATUS_LABELS[entry.status_value]}
            </span>
          )}
          {entry.rating_value && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-500">
              <Star className="size-3 fill-current" />
              {entry.rating_value}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
  // #endregion Component Logic
};
// #endregion
