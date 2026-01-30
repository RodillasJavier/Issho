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
import { UserAvatar } from "../components/UserAvatar";
import { MyAnimeListItem } from "../components/MyAnimeListItem";
import { AnimeListStats } from "../components/AnimeListStats";
import type { AnimeStatus } from "../types/database.types";

type FilterTab = "all" | AnimeStatus;

// #region Component Logic

export const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

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

  const { data: animeList, isLoading: listLoading } = useQuery({
    queryKey: ["userAnimeList", profile?.id, activeFilter],
    queryFn: () =>
      fetchUserAnimeList(
        profile!.id,
        activeFilter === "all" ? undefined : activeFilter
      ),
    enabled: !!profile?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["userListStats", profile?.id],
    queryFn: () => getUserListStats(profile!.id),
    enabled: !!profile?.id,
  });

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
      <div className="flex items-center gap-4 p-6 bg-neutral-950 border border-neutral-800 rounded-lg relative">
        <UserAvatar
          username={profile.username}
          avatarUrl={profile.avatar_url}
          size="lg"
          linkToProfile={false}
        />

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
            {profile.username}'s List
          </h1>
          {profile.bio && <p className="text-gray-300">{profile.bio}</p>}
        </div>

        {isOwnProfile && (
          <Link
            to="/profile/edit"
            className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-rose-400 transition-colors"
            aria-label="Edit profile"
          >
            <svg
              className="w-5 h-5"
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
          onFilterChange={setActiveFilter}
        />
      )}

      {/* Anime List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-rose-400">Anime List</h2>

        {listLoading ? (
          <div>Loading anime list...</div>
        ) : animeList && animeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {animeList.map((entry) => (
              <MyAnimeListItem key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="text-gray-400">No anime in list yet</div>
        )}
      </div>
    </div>
  );
};

// #endregion Render
