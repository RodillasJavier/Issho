/**
 * src/pages/UserProfilePage.tsx
 *
 * Page to view a user's profile, anime list, and stats.
 *
 * Lists are friends-only: RLS on user_anime_entries/user_franchise_entries
 * returns nothing for a stranger's profile, so the friendship check here is
 * purely so the page can say "private" rather than misreport an empty list
 * as "no anime in list yet".
 */
import { useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getProfileByUsername } from "../services/supabase/profiles";
import { fetchAllUserAnimeEntries } from "../services/supabase/userAnimeList";
import { fetchUserFranchiseList } from "../services/supabase/userFranchiseList";
import {
  getFriends,
  getFriendshipStatus,
} from "../services/supabase/friendships";
import { UserAvatar } from "../components/UserAvatar";
import { MyAnimeListItem } from "../components/MyAnimeListItem";
import { MyFranchiseListItem } from "../components/MyFranchiseListItem";
import { AnimeListStats } from "../components/AnimeListStats";
import { FriendButton } from "../components/FriendButton";
import { groupUserEntriesByFranchise } from "../utils/franchise";
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

  const { data: friendshipStatus } = useQuery({
    queryKey: ["friendshipStatus", user?.id, profile?.id],
    queryFn: () => getFriendshipStatus(profile!.id),
    enabled: !!user && !!profile?.id && !isOwnProfile,
  });

  // Whether this list is ours to see at all. Mirrors the RLS predicate on
  // user_anime_entries; the server is what actually enforces it — this only
  // decides which message to show, so it doesn't gate the queries below
  // (that would serialize them behind friendshipStatus for no real benefit).
  const canViewList = isOwnProfile || !!friendshipStatus?.isFriend;

  const { data: allEntries, isLoading: listLoading } = useQuery({
    queryKey: ["userAnimeList", profile?.id, "all"],
    queryFn: () => fetchAllUserAnimeEntries(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: userFranchiseEntries } = useQuery({
    queryKey: ["userFranchiseList", profile?.id],
    queryFn: () => fetchUserFranchiseList(profile!.id),
    enabled: !!profile?.id,
  });
  // The profile list is series-level: one card per franchise. A card's
  // effective status/rating is the user-set series value for multi-entry
  // franchises, or the entry's own for standalone shows (where entry = series).
  const seriesCards = useMemo(() => {
    const franchiseEntryByKey = new Map(
      (userFranchiseEntries ?? []).map((entry) => [entry.franchise_key, entry])
    );
    return groupUserEntriesByFranchise(allEntries ?? []).map((group) => {
      const isFranchise =
        group.entries.length > 1 && group.franchiseKey != null;
      const franchiseEntry = isFranchise
        ? (franchiseEntryByKey.get(group.franchiseKey!) ?? null)
        : null;
      return {
        group,
        isFranchise,
        franchiseEntry,
        status: isFranchise
          ? (franchiseEntry?.status ?? "not_started")
          : group.entries[0].status,
        rating: isFranchise
          ? (franchiseEntry?.rating ?? null)
          : group.entries[0].rating,
      };
    });
  }, [allEntries, userFranchiseEntries]);

  // Stats count series, matching what the list displays
  const stats = useMemo(() => {
    const ratings = seriesCards
      .map((card) => card.rating)
      .filter((rating): rating is number => rating != null);
    return {
      total: seriesCards.length,
      watching: seriesCards.filter((c) => c.status === "watching").length,
      completed: seriesCards.filter((c) => c.status === "completed").length,
      dropped: seriesCards.filter((c) => c.status === "dropped").length,
      notStarted: seriesCards.filter((c) => c.status === "not_started").length,
      avgRating:
        ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : "N/A",
    };
  }, [seriesCards]);

  const filteredCards =
    activeFilter === "all"
      ? seriesCards
      : seriesCards.filter((card) => card.status === activeFilter);
  const startIndex = pageNumber * ITEMS_PER_PAGE;
  const paginatedCards = filteredCards.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
  const hasMore = startIndex + ITEMS_PER_PAGE < filteredCards.length;

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
      <div className="flex flex-col p-4 md:p-6 bg-neutral-950 border border-neutral-800 rounded-lg relative">
        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <UserAvatar
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size="profile"
            linkToProfile={false}
          />

          <div className="flex flex-col gap-2 text-center sm:text-left w-full">
            <div className="flex flex-row justify-between gap-2">
              <div className="flex flex-col text-left">
                <h1 className="text-2xl md:text-4xl font-semibold text-rose-400">
                  {profile.username}'s List
                </h1>

                {profile.bio && (
                  <p className="text-sm md:text-base text-gray-300">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Edit Profile Button (when viewing own profile) */}
              {isOwnProfile && (
                <Link
                  to="/profile/edit"
                  className="p-2 text-neutral-400 hover:text-rose-400 transition-colors self-center sm:self-auto"
                  aria-label="Edit profile"
                >
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8"
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

            {/* Friends and Friend Action Buttons */}
            <div className="flex flex-row flex-wrap items-center gap-2 justify-center sm:justify-start">
              {/* Friends Link Button */}
              <Link
                to={`/profile/${profile.username}/friends`}
                className="px-3 py-2 bg-rose-500 hover:bg-rose-950 border border-rose-500 text-white hover:text-rose-100 text-sm rounded transition flex items-center gap-2"
              >
                {isOwnProfile ? "Manage Friends" : "View Friends"} (
                {friends ? friends.length : 0})
              </Link>

              {/* Friend Button (when viewing another user) */}
              {!isOwnProfile && user && (
                <FriendButton targetUserId={profile.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards (series-level) */}
      {canViewList && allEntries && (
        <AnimeListStats
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Anime List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-rose-400">Anime List</h2>

        {!canViewList ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-12 text-center">
            <p className="text-lg text-gray-400">This list is private</p>
            <p className="max-w-md text-sm text-gray-500">
              {user
                ? `Add ${profile.username} as a friend to see what they're watching.`
                : `Sign in and add ${profile.username} as a friend to see what they're watching.`}
            </p>
          </div>
        ) : listLoading ? (
          <div>Loading anime list...</div>
        ) : paginatedCards.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedCards.map((card) =>
                card.isFranchise ? (
                  <MyFranchiseListItem
                    key={card.group.groupKey}
                    franchiseKey={card.group.franchiseKey!}
                    title={card.group.title}
                    entries={card.group.entries}
                    franchiseEntry={card.franchiseEntry}
                    isOwnProfile={isOwnProfile}
                  />
                ) : (
                  <MyAnimeListItem
                    key={card.group.groupKey}
                    entry={card.group.entries[0]}
                  />
                )
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 py-4">
              <button
                onClick={handlePrevPage}
                disabled={pageNumber === 0}
                className="flex items-center gap-1 cursor-pointer px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="size-4" />
                Prev
              </button>

              <span className="text-gray-400">Page {pageNumber + 1}</span>

              <button
                onClick={handleNextPage}
                disabled={!hasMore}
                className="flex items-center gap-1 cursor-pointer px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="size-4" />
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
