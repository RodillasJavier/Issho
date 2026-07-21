/**
 * src/components/FriendDirectoryCard.tsx
 *
 * Compact row for the Friends page "directory" (list) view: avatar, name,
 * latest-activity blurb, and — on your own friends page — a remove button.
 */
import { Link } from "react-router";
import { UserMinus } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

// #region Types
import type { Profile } from "../types/database.types";

interface FriendDirectoryCardProps {
  friend: Profile;
  activityLabel: string;
  onRemove?: () => void;
  isRemoving?: boolean;
}
// #endregion Types

// #region Component Logic
export const FriendDirectoryCard = ({
  friend,
  activityLabel,
  onRemove,
  isRemoving = false,
}: FriendDirectoryCardProps) => {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <UserAvatar
        username={friend.username}
        avatarUrl={friend.avatar_url}
        size="md"
        linkToProfile={false}
      />
      <Link
        to={`/profile/${friend.username}`}
        className="min-w-0 flex-1 hover:opacity-80 transition"
      >
        <p className="truncate text-sm font-semibold text-white">
          {friend.username}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {activityLabel}
        </p>
      </Link>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${friend.username} from friends`}
          onClick={onRemove}
          disabled={isRemoving}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-neutral-800 text-neutral-500 transition-colors hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <UserMinus className="size-4" />
        </button>
      )}
    </article>
  );
  // #endregion Component Logic
};
// #endregion
