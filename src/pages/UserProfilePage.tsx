/**
 * src/pages/UserProfilePage.tsx
 *
 * Page to view a user's profile, anime list, and stats.
 */
import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { getProfileByUsername } from "../services/supabase/profiles";
import {
  fetchUserAnimeList,
  getUserListStats,
} from "../services/supabase/userAnimeList";
import { getFriends } from "../services/supabase/friendships";
import { UserAvatar } from "../components/UserAvatar";
import { MyAnimeListItem } from "../components/MyAnimeListItem";
import { AnimeListStats } from "../components/AnimeListStats";
import { FriendButton } from "../components/FriendButton";
import type { AnimeStatus } from "../types/database.types";

type FilterTab = "all" | AnimeStatus;

const ITEMS_PER_PAGE = 20;

// #region Component Logic

export const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [pageNumber, setPageNumber] = useState(0);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfileByUsername(username!),
    enabled: !!username,
  });
  const isOwnProfile = user?.id === profile?.id;

  const { data: animeListData, isLoading: listLoading } = useQuery({
    queryKey: ["userAnimeList", profile?.id, activeFilter, pageNumber],
    queryFn: () =>
      fetchUserAnimeList(
        profile!.id,
        activeFilter === "all" ? undefined : activeFilter,
        pageNumber,
        ITEMS_PER_PAGE
      ),
    enabled: !!profile?.id,
  });

  const animeList = animeListData?.entries || [];
  const hasMore = animeListData?.hasMore || false;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["userListStats", profile?.id],
    queryFn: () => getUserListStats(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: friends } = useQuery({
    queryKey: ["friends", profile?.id],
    queryFn: () => getFriends(profile!.id),
    enabled: !!profile?.id,
  });

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
    setPageNumber(0); // Reset to first page when filter changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevPage = () => {
    if (pageNumber > 0) {
      setPageNumber(pageNumber - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPageNumber(pageNumber + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // #endregion Component Logic

  // #region Render

  if (profileLoading) {
    return <div>Loading profile...</div>;
  }

  if (profileError || !profile) {
    return <div>User not found</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between gap-4 p-6 bg-neutral-950 border border-neutral-800 rounded-lg relative">
        <div className="flex flex-row items-center gap-4">
        <UserAvatar
          username={profile.username}
          avatarUrl={profile.avatar_url}
          size="lg"
          linkToProfile={false}
        />

        <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold text-rose-400">
            {profile.username}'s List
          </h1>

          {profile.bio && <p className="text-gray-300">{profile.bio}</p>}

            {/* Friends Button */}
            <Link
              to={`/profile/${profile.username}/friends`}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-950 border border-rose-500 text-white hover:text-rose-100 text-sm rounded transition w-fit flex items-center gap-2"
            >
              {isOwnProfile ? "Manage Friends" : "View Friends"} (
              {friends ? friends.length : 0})
            </Link>
          </div>
        </div>

        {/* Friend Button (when viewing another user) */}
        {!isOwnProfile && user && (
          <div className="absolute top-6 right-6">
            <FriendButton targetUserId={profile.id} />
          </div>
        )}

        {/* Edit Profile Button (when viewing own profile) */}
        {isOwnProfile && (
          <Link
            to="/profile/edit"
            className="p-2 text-neutral-400 hover:text-rose-400 transition-colors"
            aria-label="Edit profile"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <AnimeListStats
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Anime List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-rose-400">Anime List</h2>

        {listLoading ? (
          <div>Loading anime list...</div>
        ) : animeList && animeList.length > 0 ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {animeList.map((entry) => (
              <MyAnimeListItem key={entry.id} entry={entry} />
            ))}
          </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 py-4">
              <button
                onClick={handlePrevPage}
                disabled={pageNumber === 0}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>

              <span className="text-gray-400">Page {pageNumber + 1}</span>

              <button
                onClick={handleNextPage}
                disabled={!hasMore}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-400">No anime in list yet</div>
        )}
      </div>
    </div>
  );
};

// #endregion Render
