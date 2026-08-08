/**
 * src/pages/FranchisePage.tsx
 *
 * Series landing page (route /series/:franchiseKey): a full-bleed hero built
 * from the franchise's root member, a sticky sidebar with series-level
 * tracking and a "Seasons & films" list linking to each season, and the
 * series-level community feed.
 */
import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useFranchiseMembers } from "../hooks/useFranchiseMembers";
import {
  franchiseDisplayTitle,
  franchiseRootMember,
  yearRangeLabel,
} from "../utils/franchise";
import { splitGenres } from "../utils/anime";
import { DetailHero } from "../components/DetailHero";
import { DetailPageSkeleton } from "../components/DetailPageSkeleton";
import { DetailSidebar } from "../components/DetailSidebar";
import { SeasonsList } from "../components/SeasonsList";
import { ShareButton } from "../components/ShareButton";
import { WatchStatusBadge } from "../components/WatchStatusBadge";
import { CommunityEntriesSection } from "../components/CommunityEntriesSection";
import { ListStatusButton } from "../components/ListStatusButton";
import {
  entriesQueryKey,
  fetchEntriesWithCounts,
} from "../services/supabase/entries";
import { getUserFranchiseEntry } from "../services/supabase/userFranchiseList";
import { fetchUserAnimeStatuses } from "../services/supabase/userAnimeList";

export const FranchisePage = () => {
  const { franchiseKey: franchiseKeyParam } = useParams<{
    franchiseKey: string;
  }>();
  const franchiseKey = Number(franchiseKeyParam);
  const validKey = !Number.isNaN(franchiseKey);
  const { user } = useAuth();

  const { franchiseMembers } = useFranchiseMembers(
    validKey ? franchiseKey : null
  );

  const { data: franchiseEntry } = useQuery({
    queryKey: ["userFranchiseList", franchiseKey, user?.id],
    queryFn: () => getUserFranchiseEntry(franchiseKey, user!.id),
    enabled: !!user && validKey,
  });

  const memberIds = useMemo(
    () => (franchiseMembers ?? []).map((member) => member.id),
    [franchiseMembers]
  );
  const { data: statusByAnimeId, error: statusError } = useQuery({
    // memberIds is included so a franchise gaining/losing members mid-session
    // invalidates the cached result instead of silently serving stale
    // statuses under an unchanged key. `> 1` (not `> 0`) matches AnimeFeed's
    // isMultiEntryFranchise gate — a singleton "franchise" has no per-season
    // progress worth showing.
    queryKey: ["userAnimeStatuses", franchiseKey, user?.id, memberIds],
    queryFn: () => fetchUserAnimeStatuses(user!.id, memberIds),
    enabled: !!user && memberIds.length > 1,
  });
  // fetchUserAnimeStatuses throws on failure per this codebase's service
  // convention; without this, a failed fetch would leave statusByAnimeId
  // undefined forever with zero indication anything went wrong.
  useEffect(() => {
    if (statusError) console.error(statusError);
  }, [statusError]);

  // Shares the feed cache with the homepage feed/Friends page (per
  // CLAUDE.md), so this never triggers its own fetch once that's warm, and
  // gets the same accurate like/dislike/comment counts they do. Being the
  // same RLS-scoped fetch, the community posts below are the viewer's
  // friends' posts, not everyone's.
  const { data: allEntries } = useQuery({
    queryKey: entriesQueryKey(user?.id),
    queryFn: fetchEntriesWithCounts,
    enabled: !!user,
  });
  const seriesEntries = useMemo(
    () =>
      (allEntries ?? []).filter(
        (entry) => entry.franchise_key === franchiseKey
      ),
    [allEntries, franchiseKey]
  );

  // #region Render
  if (!validKey) {
    return <div className="text-gray-400">Series not found.</div>;
  }

  if (!franchiseMembers) {
    return <DetailPageSkeleton />;
  }

  if (franchiseMembers.length === 0) {
    return <div className="text-gray-400">This series has no seasons yet.</div>;
  }

  const title = franchiseDisplayTitle(franchiseMembers) ?? "Series";
  const root = franchiseRootMember(franchiseMembers, franchiseKey)!;
  const bannerUrl = root.banner_image_url ?? root.cover_image_url ?? null;
  const yearRange = yearRangeLabel(
    franchiseMembers
      .map((member) => member.year)
      .filter((year): year is number => year != null)
  );
  const subtitle = [root.name_japanese, yearRange].filter(Boolean).join(" · ");
  const genres = splitGenres(root.genres);

  return (
    <div className="flex flex-col gap-10">
      <DetailHero
        bannerUrl={bannerUrl}
        eyebrow="Series"
        title={title}
        subtitle={subtitle || undefined}
        statusBadge={
          franchiseEntry ? (
            <WatchStatusBadge status={franchiseEntry.status} />
          ) : undefined
        }
        genres={genres}
        description={root.description}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <DetailSidebar
          rating={franchiseEntry?.rating ?? null}
          secondaryStat={{ label: "Releases", value: franchiseMembers.length }}
          actions={
            <>
              <Link
                to={`/entry/create?franchiseKey=${franchiseKey}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/45 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                <Plus aria-hidden className="size-4 text-rose-300" />
                Create an entry
              </Link>
              {user && (
                <ListStatusButton
                  target={{ kind: "franchise", franchise_key: franchiseKey }}
                  franchiseTitle={title}
                />
              )}
              <ShareButton />
            </>
          }
          seasonsSection={
            <SeasonsList
              members={franchiseMembers}
              statusByAnimeId={statusByAnimeId}
            />
          }
        />

        <section className="min-w-0 flex-1">
          <CommunityEntriesSection
            entries={seriesEntries}
            resetKey={franchiseKey}
            emptyMessage={
              user
                ? "No series-level posts from you or your friends yet. Share your thoughts on the whole series!"
                : "Sign in to see series posts from your friends."
            }
          />
        </section>
      </div>
    </div>
  );
  // #endregion Render
};
