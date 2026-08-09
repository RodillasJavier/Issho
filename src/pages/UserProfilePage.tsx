/**
 * src/pages/UserProfilePage.tsx
 *
 * Page to view a user's profile, anime list, and stats.
 *
 * The list is series-level: one card per franchise, or per standalone show.
 * It is fetched once and then searched, sorted, filtered and paginated in
 * memory, so none of those interactions costs a request.
 *
 * Lists are friends-only: RLS on user_anime_entries/user_franchise_entries
 * returns nothing for a stranger's profile, so the friendship check here is
 * purely so the page can say "private" rather than misreport an empty list
 * as "no anime in list yet".
 */
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getProfileByUsername } from "../services/supabase/profiles";
import {
  fetchUserListEntries,
  userListQueryKey,
} from "../services/supabase/userLists";
import { fetchFranchises } from "../services/supabase/franchises";
import {
  getFriends,
  getFriendshipStatus,
} from "../services/supabase/friendships";
import { ProfileHeader } from "../components/ProfileHeader";
import { AnimeListStats } from "../components/AnimeListStats";
import { ListToolbar } from "../components/ListToolbar";
import { ProfileListItem } from "../components/ProfileListItem";
import { Skeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import {
  buildProfileListCards,
  franchiseKeysNeedingMembers,
} from "../utils/listEntries";
import { DEFAULT_SORT_KEY, sortProfileCards } from "../constants/listSort";
import type { SortKey } from "../constants/listSort";
import type { AnimeStatus } from "../types/database.types";

type FilterTab = "all" | AnimeStatus;

const ITEMS_PER_PAGE = 12;

// #region Component Logic

export const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT_KEY);
  const [pageNumber, setPageNumber] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 200);

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

  const { data: listEntries, isLoading: listLoading } = useQuery({
    queryKey: userListQueryKey(profile?.id),
    queryFn: () => fetchUserListEntries(profile!.id),
    enabled: !!profile?.id,
  });

  // Series tracked with none of their seasons in the list carry no metadata of
  // their own. The franchises view derives title/art/year span in SQL, so this
  // is one small row per series rather than every member anime.
  const orphanFranchiseKeys = useMemo(
    () => franchiseKeysNeedingMembers(listEntries ?? []),
    [listEntries]
  );

  const { data: orphanFranchises } = useQuery({
    queryKey: ["franchises", orphanFranchiseKeys],
    queryFn: () => fetchFranchises(orphanFranchiseKeys),
    enabled: orphanFranchiseKeys.length > 0,
  });

  const seriesCards = useMemo(
    () => buildProfileListCards(listEntries ?? [], orphanFranchises ?? []),
    [listEntries, orphanFranchises]
  );

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

  // Filter, then search, then sort — all in memory over the single fetch.
  const visibleCards = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();
    const matched = seriesCards.filter((card) => {
      if (activeFilter !== "all" && card.status !== activeFilter) return false;
      if (!search) return true;
      return (
        card.title.toLowerCase().includes(search) ||
        card.seasons.some(
          (season) =>
            season.anime?.name.toLowerCase().includes(search) ||
            season.anime?.name_japanese?.toLowerCase().includes(search)
        )
      );
    });
    return sortProfileCards(matched, sortKey);
  }, [seriesCards, activeFilter, debouncedQuery, sortKey]);

  const pageCount = Math.max(
    1,
    Math.ceil(visibleCards.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(pageNumber, pageCount - 1);
  const paginatedCards = visibleCards.slice(
    safePage * ITEMS_PER_PAGE,
    (safePage + 1) * ITEMS_PER_PAGE
  );

  const { data: friends } = useQuery({
    queryKey: ["friends", profile?.id],
    queryFn: () => getFriends(profile!.id),
    enabled: !!profile?.id,
  });

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
    setPageNumber(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPageNumber(0);
  };

  const handleSortChange = (key: SortKey) => {
    setSortKey(key);
    setPageNumber(0);
  };

  const handlePrevPage = () => {
    if (safePage > 0) {
      setPageNumber(safePage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (safePage < pageCount - 1) {
      setPageNumber(safePage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // #endregion Component Logic

  // #region Render

  if (profileLoading) {
    return <ProfilePageSkeleton />;
  }

  if (profileError || !profile) {
    return <div className="text-zinc-400">User not found</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader
        profile={profile}
        friendCount={friends?.length ?? 0}
        isOwnProfile={isOwnProfile}
        canAddFriend={!!user}
      />

      {/* Stats Cards (series-level) */}
      {canViewList && listEntries && (
        <AnimeListStats
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Anime List */}
      <section className="flex flex-col gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
            Watchlist
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-rose-400">
            Anime List
          </h2>
        </div>

        {!canViewList ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-[#0c0c0f] px-4 py-12 text-center">
            <p className="text-lg text-zinc-400">This list is private</p>
            <p className="max-w-md text-sm text-zinc-500">
              {user
                ? `Add ${profile.username} as a friend to see what they're watching.`
                : `Sign in and add ${profile.username} as a friend to see what they're watching.`}
            </p>
          </div>
        ) : listLoading ? (
          <ListGridSkeleton />
        ) : seriesCards.length === 0 ? (
          <div className="text-zinc-400">No anime in list yet</div>
        ) : (
          <>
            <ListToolbar
              query={query}
              onQueryChange={handleQueryChange}
              sortKey={sortKey}
              onSortChange={handleSortChange}
              resultCount={visibleCards.length}
              totalCount={seriesCards.length}
              pageNumber={safePage}
              pageCount={pageCount}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />

            {paginatedCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
                <SearchX aria-hidden className="size-7 text-zinc-700" />
                <p className="mt-4 text-sm font-medium text-zinc-300">
                  {query
                    ? `No series match "${query}"`
                    : "Nothing in this filter yet"}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {query
                    ? "Try a different title, or clear your search to see the whole list."
                    : "Pick another status above to see the rest of the list."}
                </p>
                {query && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange("")}
                    className="mt-4 inline-flex h-8 cursor-pointer items-center rounded-md border border-zinc-800 bg-neutral-950/60 px-3 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              // No AnimatePresence/layout here. `mode="popLayout"` gives
              // exiting cards `position: absolute`, and since this grid is not
              // a positioned ancestor they resolved against the page and flew
              // over the header — with no `exit` variant to fade them, they
              // just sat there. Filtering and paging drop a dozen cards at
              // once, so that happened a dozen times over.
              //
              // Cards are keyed by groupKey, so a re-sort *moves* the nodes
              // that stay on the page rather than remounting them: they don't
              // re-fade, only cards genuinely entering the page do.
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {paginatedCards.map((card) => (
                  <ProfileListItem
                    key={card.groupKey}
                    card={card}
                    isOwnProfile={isOwnProfile}
                  />
                ))}
              </div>
            )}

            <Pagination
              pageNumber={safePage}
              pageCount={pageCount}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              className="pt-2"
            />
          </>
        )}
      </section>
    </div>
  );
};

// #endregion Render

// Just the toolbar+grid portion, shaped to match ListToolbar + the card grid
// below it — used once listEntries starts loading (profile/header/stats
// have already rendered by then).
function ListGridSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/4] w-full" />
        ))}
      </div>
    </div>
  );
}

// Full-page shape (header + stats + toolbar + grid), for the initial
// profile fetch — matches ProfileHeader/AnimeListStats' real proportions so
// there's no dramatic collapse-then-expand once the real profile loads.
function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-28 w-full rounded-xl sm:h-32" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[70px] w-full rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <ListGridSkeleton />
      </div>
    </div>
  );
}
