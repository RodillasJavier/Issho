/**
 * src/components/FollowingPanel.tsx
 *
 * Sidebar panel showing the signed-in user's friends, alongside
 * FeaturedEntry at the top of the activity feed. The whole card is a link
 * to the friends workspace.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { getFriends, getOtherProfile } from "../services/supabase/friendships";
import { UserAvatar } from "./UserAvatar";

// #region Types
import type { Profile } from "../types/database.types";

interface FollowingPanelProps {
  userId: string;
  username: string;
  /** Friends' entries created in the last 7 days, for the headline stat. */
  recentActivityCount: number;
}
// #endregion

// #region Component Logic
export const FollowingPanel = ({
  userId,
  username,
  recentActivityCount,
}: FollowingPanelProps) => {
  const { data: friendships } = useQuery({
    queryKey: ["friends", userId],
    queryFn: () => getFriends(userId),
    staleTime: 60_000,
  });

  const friends: Profile[] =
    friendships
      ?.map((f) => getOtherProfile(f, userId))
      .filter((profile): profile is Profile => !!profile) ?? [];
  // #endregion

  // #region Render
  return (
    <Link
      to={`/profile/${username}/friends`}
      aria-label="Open friends workspace"
      className="group flex flex-col rounded-md border border-neutral-800 bg-neutral-950 p-6 transition-colors hover:border-rose-400/50 hover:bg-neutral-900"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Following
        </p>

        <span className="rounded-full border border-neutral-700 bg-black px-2.5 py-1 font-mono text-xs text-neutral-400">
          {friends.length}
        </span>
      </div>

      {friends.length > 0 ? (
        <>
          <div className="mt-6 flex -space-x-3">
            {friends.slice(0, 6).map((friend) => (
              <div
                key={friend.id}
                className="rounded-full ring-[3px] ring-neutral-950"
              >
                <UserAvatar
                  username={friend.username}
                  avatarUrl={friend.avatar_url}
                  size="md"
                  linkToProfile={false}
                />
              </div>
            ))}
          </div>
          <p className="mt-6 text-base leading-6 font-medium text-neutral-200">
            {recentActivityCount > 0 ? (
              <>
                Your circle is up to{" "}
                <span className="text-rose-300">
                  {recentActivityCount} new{" "}
                  {recentActivityCount === 1 ? "entry" : "entries"}
                </span>{" "}
                this week.
              </>
            ) : (
              "No new entries from your circle this week yet."
            )}
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm leading-6 text-neutral-400">
          You haven&apos;t added any friends yet. Find people to see their
          activity here.
        </p>
      )}

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-300">
        Open friends workspace
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
  // #endregion Render
};
// #endregion
