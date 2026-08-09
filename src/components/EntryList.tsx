/**
 * src/components/EntryList.tsx
 *
 * Component that fetches and displays a list of recent entries with their
 * associated anime data: a featured entry + following panel + create-entry
 * CTA on the first page, a grid of activity cards, and pagination. The
 * All/Friends/You filter is owned by Home (rendered in the page
 * header) and passed in as a prop. Every entry is fetched once and
 * filter/pagination are applied client-side, so switching tabs or pages
 * never re-hits the network.
 *
 * Signed-in only. What the fetch returns is already limited by RLS to the
 * viewer's own entries plus their friends'; the client-side filtering below
 * splits that set into tabs and is not itself the privacy boundary. Logged-out
 * visitors get PublicFeed instead.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EntryItem } from "./EntryItem";
import { FeaturedEntry } from "./FeaturedEntry";
import { FollowingPanel } from "./FollowingPanel";
import { CreateEntryCta } from "./CreateEntryCta";
import { FeedSkeleton } from "./FeedSkeleton";
import { Pagination } from "./ui/Pagination";
import {
  ACTIVITY_FILTERS,
  type ActivityFilter,
} from "../constants/activityFilters";
import { useAuth } from "../hooks/useAuth";
import { getFriendIds } from "../services/supabase/friendships";
import { getProfileById, profileQueryKey } from "../services/supabase/profiles";
import {
  entriesQueryKey,
  fetchEntriesWithCounts,
} from "../services/supabase/entries";

const ENTRIES_PER_PAGE = 30;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const getWeekAgoTimestamp = (): number => Date.now() - WEEK_MS;

// #region Types
interface EntryListProps {
  filter: ActivityFilter;
}
// #endregion Types

export const EmptyFeedState = ({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  ctaHref?: string;
  ctaLabel: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-6">
    <div>
      <div className="text-gray-400 text-lg mb-4">{title}</div>
      <div className="text-gray-500 text-sm max-w-md">{subtitle}</div>
    </div>

    {ctaHref && (
      <Link
        to={ctaHref}
        className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-semibold flex items-center gap-2"
      >
        {ctaLabel}
      </Link>
    )}
  </div>
);

// #region Component Logic
export const EntryList = ({ filter }: EntryListProps) => {
  const [pageNumber, setPageNumber] = useState(0);
  const { user } = useAuth();

  // Reset to page 1 whenever the filter (owned by Home) changes. Adjusting
  // state during render (rather than in an effect) avoids an extra
  // cascading render on every filter switch.
  const [prevFilter, setPrevFilter] = useState(filter);
  if (filter !== prevFilter) {
    setPrevFilter(filter);
    setPageNumber(0);
  }

  const { data: profile } = useQuery({
    queryKey: profileQueryKey(user?.id),
    queryFn: () => getProfileById(user!.id),
    enabled: !!user,
  });

  const {
    data: allEntries,
    error,
    isLoading,
  } = useQuery({
    queryKey: entriesQueryKey(user?.id),
    queryFn: fetchEntriesWithCounts,
    enabled: !!user,
  });

  const { data: friendIds, isLoading: isFriendIdsLoading } = useQuery({
    queryKey: ["friendIds", user?.id],
    queryFn: getFriendIds,
    enabled: !!user,
  });

  const filteredEntries = useMemo(() => {
    if (!allEntries || !user) return [];
    if (filter === "mine") {
      return allEntries.filter((entry) => entry.user_id === user.id);
    }
    if (filter === "friends") {
      return friendIds
        ? allEntries.filter((entry) => friendIds.includes(entry.user_id))
        : [];
    }
    // allEntries is already RLS-scoped to the viewer + their friends, so
    // "all" needs no further client-side filtering.
    return allEntries;
  }, [allEntries, filter, user, friendIds]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE)
  );

  // filteredEntries can shrink independent of the filter changing — a
  // background refetch of the shared feed query (window refocus, a friend's
  // visibility changing) can legitimately return fewer rows. Without this, a
  // viewer sitting on a later page would see an empty page with "Next"
  // disabled and no way out except "Prev". Same pattern as
  // CommunityEntriesSection's resetKey clamp.
  if (pageNumber > pageCount - 1) {
    setPageNumber(pageCount - 1);
  }

  const entries = filteredEntries.slice(
    pageNumber * ENTRIES_PER_PAGE,
    (pageNumber + 1) * ENTRIES_PER_PAGE
  );
  const hasMore = (pageNumber + 1) * ENTRIES_PER_PAGE < filteredEntries.length;

  // Friends' entries from the last 7 days, for FollowingPanel's headline stat
  const recentActivityCount = useMemo(() => {
    if (!allEntries || !friendIds) return 0;
    const since = getWeekAgoTimestamp();
    return allEntries.filter(
      (entry) =>
        friendIds.includes(entry.user_id) &&
        new Date(entry.created_at).getTime() >= since
    ).length;
  }, [allEntries, friendIds]);

  const handlePrevPage = () => {
    if (pageNumber > 0) {
      setPageNumber(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPageNumber(pageNumber + 1);
    }
  };
  // #endregion Component Logic

  // #region Render
  const renderEmptyState = () => {
    if (filter === "friends" && isFriendIdsLoading) {
      return <div>Loading entries...</div>;
    }

    if (filter === "friends" && pageNumber === 0) {
      return (
        <EmptyFeedState
          title="No activity yet from your friends"
          subtitle="Add friends to see their activity here!"
          ctaHref={profile ? `/profile/${profile.username}/friends` : undefined}
          ctaLabel="Find Friends"
        />
      );
    }

    if (filter === "mine" && pageNumber === 0) {
      return (
        <EmptyFeedState
          title="You haven't posted anything yet"
          subtitle="Reviews, ratings, and status updates you post will show up here."
          ctaHref="/entry/create"
          ctaLabel="Create your first entry"
        />
      );
    }

    if (filter === "all" && pageNumber === 0) {
      return (
        <EmptyFeedState
          title="Nothing here yet"
          subtitle="Your feed is made up of your own entries and your friends'. Add a few friends or post something to get it started."
          ctaHref={profile ? `/profile/${profile.username}/friends` : undefined}
          ctaLabel="Find Friends"
        />
      );
    }

    return (
      <div className="text-gray-400 text-center py-8">No entries found</div>
    );
  };

  if (isLoading) {
    return <FeedSkeleton withSidebar />;
  }

  if (error) {
    return <div>Error loading entries: {error.message}</div>;
  }

  const featuredEntries = entries.slice(0, 5);
  // Keying on the actual entry ids (rather than relying on array identity,
  // which changes on every render via .slice()) lets the carousel remount
  // and reset its rotation only when the underlying entries truly change.
  const featuredKey = featuredEntries.map((e) => e.id).join(",");

  return (
    <div className="flex flex-col gap-6">
      {!entries || entries.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {pageNumber === 0 &&
            (user && profile ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.85fr)]">
                <FeaturedEntry key={featuredKey} entries={featuredEntries} />

                <div className="grid gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
                  <FollowingPanel
                    userId={user.id}
                    username={profile.username}
                    recentActivityCount={recentActivityCount}
                  />

                  <CreateEntryCta />
                </div>
              </div>
            ) : (
              <FeaturedEntry key={featuredKey} entries={featuredEntries} />
            ))}

          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              {ACTIVITY_FILTERS.find((f) => f.value === filter)?.label ??
                "Activity"}
            </h3>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs text-neutral-600">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
              <Pagination
                pageNumber={pageNumber}
                pageCount={pageCount}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <EntryItem entry={entry} key={entry.id} />
            ))}
          </div>

          <Pagination
            pageNumber={pageNumber}
            pageCount={pageCount}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        </>
      )}
    </div>
  );
  // #endregion Render
};
// #endregion
