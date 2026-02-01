/**
 * src/components/EntryList.tsx
 *
 * Component that fetches and displays a list of recent entries with their
 * associated anime data.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import supabase from "../supabase-client";
import { EntryItem } from "./EntryItem";
import type { Entry } from "../types/database.types";
import { useAuth } from "../hooks/useAuth";
import { getFriendIds } from "../services/supabase/friendships";
import { getProfileById } from "../services/supabase/profiles";

const ENTRIES_PER_PAGE = 30;

// #region Types
interface EntryWithCounts {
  id: string;
  anime_id: string;
  user_id: string;
  entry_type: string;
  content: string;
  created_at: string;
  vote_count: number;
  comment_count: number;
  rating_value: number | null;
  status_value: string | null;
}

interface AnimeData {
  id: string;
  name: string;
  cover_image_url: string | null;
}

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface EntryListProps {
  friendsOnly?: boolean;
  anonymized?: boolean;
}
// #endregion Types

// #region Component Logic
const fetchEntries = async (
  friendsOnly: boolean,
  page: number,
  limit: number
): Promise<{ entries: Entry[]; hasMore: boolean }> => {
  let allowedUserIds: string[] | null = null;

  // If friends-only mode, get friend IDs + current user ID
  if (friendsOnly) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { entries: [], hasMore: false };
    }

    const friendIds = await getFriendIds();
    allowedUserIds = [...friendIds, user.id];

    // If no friends and only self, return empty if no entries from self yet
    if (allowedUserIds.length === 1) {
      // Will only show current user's entries
      allowedUserIds = [user.id];
    }
  }

  // Use RPC function to get entries with vote counts & comment counts
  const { data: entriesWithCounts, error } = await supabase.rpc(
    "get_entries_with_counts"
  );
  if (error) throw new Error(error.message);

  if (!entriesWithCounts || entriesWithCounts.length === 0) {
    return { entries: [], hasMore: false };
  }

  // Filter by allowed user IDs if in friends-only mode
  let filteredEntries = entriesWithCounts as EntryWithCounts[];
  if (allowedUserIds !== null) {
    filteredEntries = filteredEntries.filter((entry) =>
      allowedUserIds.includes(entry.user_id)
    );
  }

  if (filteredEntries.length === 0) {
    return { entries: [], hasMore: false };
  }

  // Apply pagination
  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
  const hasMore = endIndex < filteredEntries.length;

  // Fetch anime and profile data separately and join in memory
  const entryAnimeIds = paginatedEntries.map((entry) => entry.anime_id);
  const userIds = [...new Set(paginatedEntries.map((entry) => entry.user_id))];

  const { data: animeData } = await supabase
    .from("anime")
    .select("id, name, cover_image_url")
    .in("id", entryAnimeIds);

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  // Map anime and profile data to entries
  const entriesWithData = paginatedEntries.map((entry) => ({
    ...entry,
    anime: animeData?.find((a: AnimeData) => a.id === entry.anime_id),
    profile: profileData?.find((p: ProfileData) => p.id === entry.user_id),
  }));

  return { entries: entriesWithData as Entry[], hasMore };
};

export const EntryList = ({
  friendsOnly = false,
  anonymized = false,
}: EntryListProps) => {
  const [pageNumber, setPageNumber] = useState(0);
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: !!user?.id,
  });

  const { data, error, isLoading } = useQuery({
    queryKey: ["entries", friendsOnly ? "friends" : "all", pageNumber],
    queryFn: () => fetchEntries(friendsOnly, pageNumber, ENTRIES_PER_PAGE),
  });

  const entries = data?.entries || [];
  const hasMore = data?.hasMore || false;

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
  if (isLoading) {
    return <div>Loading entries...</div>;
  }

  if (error) {
    return <div>Error loading entries: {error.message}</div>;
  }

  if (!entries || entries.length === 0) {
    if (friendsOnly && pageNumber === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-6">
          <div>
            <div className="text-gray-400 text-lg mb-4">
              No activity yet from you or your friends
            </div>

            <div className="text-gray-500 text-sm max-w-md">
              Add friends to see their activity here! This is where you'll see
              your own posts and your friends' posts.
            </div>
          </div>

          {profile && (
            <Link
              to={`/profile/${profile.username}/friends`}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-semibold flex items-center gap-2"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Find Friends
            </Link>
          )}
        </div>
      );
    }
    return (
      <div className="text-gray-400 text-center py-8">No entries found</div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row flex-wrap gap-6 justify-center">
        {entries.map((entry) => (
          <EntryItem entry={entry} key={entry.id} anonymized={anonymized} />
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
    </div>
  );
  // #endregion Render
};
