/**
 * src/pages/MyListPage.tsx
 *
 * Page displaying the user's personal anime list.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { fetchUserAnimeList, getUserListStats } from "../services/supabase/userAnimeList";
import { MyAnimeListItem } from "../components/MyAnimeListItem";
import type { AnimeStatus } from "../types/database.types";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";

// #region Types
type FilterTab = "all" | AnimeStatus;
// #endregion Types

// #region Component Logic
export const MyListPage = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const {
    data: animeList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userAnimeList", user?.id, activeFilter],
    queryFn: () =>
      fetchUserAnimeList(
        user!.id,
        activeFilter === "all" ? undefined : activeFilter
      ),
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["userAnimeListStats", user?.id],
    queryFn: () => getUserListStats(user!.id),
    enabled: !!user,
  });
  // #endregion Component Logic

  // #region Render
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-semibold mb-4">
          Sign in to view your list
        </h2>
        <p className="text-neutral-400">
          Create an account to start tracking your anime.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-5xl font-semibold bg-gradient-to-r from-rose-300 to-rose-900 bg-clip-text text-transparent">
        My List
      </h1>

      {/* Main Content with Stats Sidebar */}
      <div className="flex gap-4">
        {/* Left: Filters + Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded text-sm font-semibold transition-colors whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-rose-500 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              All ({stats?.total || 0})
            </button>

            <button
              onClick={() => setActiveFilter("watching")}
              className={`px-4 py-2 rounded text-sm font-semibold transition-colors whitespace-nowrap ${
                activeFilter === "watching"
                  ? STATUS_COLORS["watching"]
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {STATUS_LABELS["watching"]} ({stats?.watching || 0})
            </button>

            <button
              onClick={() => setActiveFilter("completed")}
              className={`px-4 py-2 rounded text-sm font-semibold transition-colors whitespace-nowrap ${
                activeFilter === "completed"
                  ? STATUS_COLORS["completed"]
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {STATUS_LABELS["completed"]} ({stats?.completed || 0})
            </button>

            <button
              onClick={() => setActiveFilter("not_started")}
              className={`px-4 py-2 rounded text-sm font-semibold transition-colors whitespace-nowrap ${
                activeFilter === "not_started"
                  ? STATUS_COLORS["not_started"]
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {STATUS_LABELS["not_started"]} ({stats?.notStarted || 0})
            </button>

            <button
              onClick={() => setActiveFilter("dropped")}
              className={`px-4 py-2 rounded text-sm font-semibold transition-colors whitespace-nowrap ${
                activeFilter === "dropped"
                  ? STATUS_COLORS["dropped"]
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {STATUS_LABELS["dropped"]} ({stats?.dropped || 0})
            </button>
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="text-center py-20 text-neutral-400">
              Loading your list...
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              Error loading list: {error.message}
            </div>
          ) : !animeList || animeList.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-neutral-400 mb-4">
                {activeFilter === "all"
                  ? "Your list is empty"
                  : `No anime in "${activeFilter.replace("_", " ")}" status`}
              </p>

              <p className="text-neutral-500">
                Add anime to your list to start tracking!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {animeList.map((entry) => (
                <MyAnimeListItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Stats Sidebar */}
        {stats && (
          <div className="hidden lg:block sticky">
            <div className="flex flex-col gap-2 text-center items-center">
              {/* Avg Rating - Prominent */}
              <div className="flex flex-col items-center border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm rounded-lg p-4 gap-2 hover:border-neutral-700 hover:shadow-lg transition-all">
                <span className="text-5xl font-bold bg-gradient-to-r from-rose-400 to-rose-600 bg-clip-text text-transparent">
                  {stats.avgRating}
                </span>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">
                  Avg Rating
                </span>
              </div>

              {/* Total */}
              <div className="w-full flex flex-col items-center border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm rounded-lg py-2 gap-1 hover:border-neutral-700 hover:shadow-lg transition-all">
                <span className="text-3xl font-bold">{stats.total}</span>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">
                  Total
                </span>
              </div>

              {/* Watching */}
              <div className="w-full flex flex-col items-center border border-blue-600/30 bg-blue-500/10 backdrop-blur-sm rounded-lg py-2 gap-1 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                <span className="text-3xl font-bold text-blue-400">
                  {stats.watching}
                </span>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">
                  {STATUS_LABELS["watching"]}
                </span>
              </div>

              {/* Completed */}
              <div className="w-full flex flex-col items-center border border-green-600/30 bg-green-500/10 backdrop-blur-sm rounded-lg py-2 gap-1 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all">
                <span className="text-3xl font-bold text-green-400">
                  {stats.completed}
                </span>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">
                  {STATUS_LABELS["completed"]}
                </span>
              </div>

              {/* Plan to Watch */}
              <div className="w-full flex flex-col items-center border border-neutral-700 bg-neutral-800/50 backdrop-blur-sm rounded-lg py-2 gap-1 hover:border-neutral-600 hover:shadow-lg transition-all">
                <span className="text-3xl font-bold text-neutral-300">
                  {stats.notStarted}
                </span>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">
                  {STATUS_LABELS["not_started"]}
                </span>
              </div>

              {/* Dropped */}
              <div className="w-full flex flex-col items-center border border-red-600/30 bg-red-500/10 backdrop-blur-sm rounded-lg py-2 gap-1 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all">
                <span className="text-3xl font-bold text-red-400">
                  {stats.dropped}
                </span>
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">
                  {STATUS_LABELS["dropped"]}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  // #endregion Render
};
