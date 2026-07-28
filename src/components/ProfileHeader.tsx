/**
 * src/components/ProfileHeader.tsx
 *
 * Identity panel at the top of a profile: avatar, username, bio, friend
 * count, and the owner-only link to edit the profile.
 */
import { Link } from "react-router";
import { Pencil, Users } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { FriendButton } from "./FriendButton";
import type { Profile } from "../types/database.types";

// #region Types
interface ProfileHeaderProps {
  profile: Profile;
  friendCount: number;
  isOwnProfile: boolean;
  /** Whether a signed-in viewer is present, for the friend action. */
  canAddFriend: boolean;
}
// #endregion Types

// #region Render
export const ProfileHeader = ({
  profile,
  friendCount,
  isOwnProfile,
  canAddFriend,
}: ProfileHeaderProps) => (
  <header className="rounded-xl border border-zinc-800 bg-[#0c0c0f] p-5 sm:p-6">
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <UserAvatar
        username={profile.username}
        avatarUrl={profile.avatar_url}
        size="profile"
        linkToProfile={false}
      />

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
              Profile
            </p>
            <h1 className="mt-1 text-2xl leading-tight font-bold text-rose-400 sm:text-3xl">
              {profile.username}'s List
            </h1>
            {profile.bio && (
              <p className="mt-1.5 text-sm text-zinc-500">{profile.bio}</p>
            )}
          </div>

          {isOwnProfile && (
            <Link
              to="/profile/edit"
              aria-label="Edit profile"
              className="shrink-0 rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Pencil aria-hidden className="size-4" />
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Link
            to={`/profile/${profile.username}/friends`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-neutral-950/60 px-3 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <Users aria-hidden className="size-3.5" />
            {isOwnProfile ? "Manage friends" : "View friends"} ({friendCount})
          </Link>

          {!isOwnProfile && canAddFriend && (
            <FriendButton targetUserId={profile.id} />
          )}
        </div>
      </div>
    </div>
  </header>
);
// #endregion Render
