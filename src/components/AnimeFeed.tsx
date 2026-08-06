/**
 * src/components/AnimeFeed.tsx
 *
 * Season detail view (route /anime/:id): a full-bleed hero for the season,
 * a sticky sidebar with per-season watchlist tracking and a link up to its
 * series with the sibling "Seasons & films" list (current season
 * highlighted), and the season's own community entries.
 */
import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, Plus } from "lucide-react";
import type { Anime } from "../types/database.types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { ListStatusButton } from "./ListStatusButton";
import { DetailHero } from "./DetailHero";
import { DetailPageSkeleton } from "./DetailPageSkeleton";
import { DetailSidebar } from "./DetailSidebar";
import { SeasonsList } from "./SeasonsList";
import { ShareButton } from "./ShareButton";
import { WatchStatusBadge } from "./WatchStatusBadge";
import { CommunityEntriesSection } from "./CommunityEntriesSection";
import { fetchAnime } from "../services/supabase/anime";
import {
  entriesQueryKey,
  fetchEntriesWithCounts,
} from "../services/supabase/entries";
import {
  getUserAnimeEntry,
  fetchUserAnimeStatuses,
} from "../services/supabase/userAnimeList";
import {
  ANIME_METADATA_STALE_TIME,
  useFranchiseMembers,
} from "../hooks/useFranchiseMembers";
import { franchiseDisplayTitle } from "../utils/franchise";
import { splitGenres } from "../utils/anime";

// #region Types
interface AnimeFeedProps {
  animeId: string;
}
// #endregion

// #region Component Logic
export const AnimeFeed = ({ animeId }: AnimeFeedProps) => {
  const { user } = useAuth();

  // Shares the feed cache with the homepage feed/Friends page/Series page
  // (per CLAUDE.md), so this never triggers its own fetch once that's warm,
  // and gets the same accurate like/dislike/comment counts they do. Being
  // the same RLS-scoped fetch, the community posts below are the viewer's
  // friends' posts, not everyone's.
  const { data: allEntries } = useQuery({
    queryKey: entriesQueryKey(user?.id),
    queryFn: fetchEntriesWithCounts,
    enabled: !!user,
  });
  const entries = useMemo(
    () =>
      (allEntries ?? []).filter(
        (entry) => entry.anime_id === animeId && entry.franchise_key == null
      ),
    [allEntries, animeId]
  );

  const { data: listEntry } = useQuery({
    queryKey: ["userAnimeList", animeId, user?.id],
    queryFn: () => getUserAnimeEntry(animeId, user!.id),
    enabled: !!user,
  });

  const {
    data: anime,
    isLoading,
    error,
  } = useQuery<Anime, Error>({
    queryKey: ["anime", animeId],
    queryFn: () => fetchAnime(animeId),
    // Lets a sibling season's cache seeding (useFranchiseMembers) actually
    // skip the redundant fetch on click-through, not just hide it visually —
    // staleTime is observer-level, so it has to be set here too.
    staleTime: ANIME_METADATA_STALE_TIME,
  });

  const franchiseKey = anime?.franchise_key ?? null;
  const { franchiseMembers, isMultiEntryFranchise } =
    useFranchiseMembers(franchiseKey);
  const franchiseTitle =
    franchiseDisplayTitle(franchiseMembers ?? []) ??
    anime?.franchise_title ??
    "this series";

  const memberIds = useMemo(
    () => (franchiseMembers ?? []).map((member) => member.id),
    [franchiseMembers]
  );
  const { data: statusByAnimeId, error: statusError } = useQuery({
    // memberIds is included so a franchise gaining/losing members mid-session
    // (e.g. a new season gets imported while this page is open) invalidates
    // the cached result instead of silently serving stale statuses under an
    // unchanged key.
    queryKey: ["userAnimeStatuses", franchiseKey, user?.id, memberIds],
    queryFn: () => fetchUserAnimeStatuses(user!.id, memberIds),
    enabled: !!user && isMultiEntryFranchise && memberIds.length > 0,
  });
  // fetchUserAnimeStatuses throws on failure per this codebase's service
  // convention; without this, a failed fetch would leave statusByAnimeId
  // undefined forever with zero indication anything went wrong (the seasons
  // list's badges/progress bar would just silently never appear).
  useEffect(() => {
    if (statusError) console.error(statusError);
  }, [statusError]);
  // #endregion

  // #region Render
  if (error) {
    console.error(error);
    return <div>Error loading anime: {error.message}</div>;
  }

  if (isLoading || !anime) {
    return <DetailPageSkeleton />;
  }

  const bannerUrl = anime.banner_image_url ?? anime.cover_image_url ?? null;
  const subtitle = [anime.name_japanese, anime.year?.toString()]
    .filter(Boolean)
    .join(" · ");
  const genres = splitGenres(anime.genres);

  return (
    <div className="flex flex-col gap-10">
      <DetailHero
        bannerUrl={bannerUrl}
        eyebrow="Season"
        title={anime.name}
        subtitle={subtitle || undefined}
        aboveActions={
          isMultiEntryFranchise && franchiseKey != null ? (
            <Link
              to={`/series/${franchiseKey}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-300 transition-colors hover:text-rose-200"
            >
              Part of {franchiseTitle}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : undefined
        }
        statusBadge={
          listEntry ? <WatchStatusBadge status={listEntry.status} /> : undefined
        }
        genres={genres}
        description={anime.description}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
        <DetailSidebar
          rating={listEntry?.rating ?? null}
          secondaryStat={{
            label: "Episodes",
            value: anime.episode_count ?? "—",
          }}
          actions={
            <>
              <Link
                to={`/entry/create?animeId=${animeId}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/45 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                <Plus aria-hidden className="size-4 text-rose-300" />
                Create an entry
              </Link>
              {user && (
                <ListStatusButton
                  target={{ kind: "anime", anime_id: animeId }}
                />
              )}
              <ShareButton />
            </>
          }
          seasonsSection={
            isMultiEntryFranchise && franchiseMembers ? (
              <SeasonsList
                members={franchiseMembers}
                currentId={animeId}
                statusByAnimeId={statusByAnimeId}
                currentSeasonHref={
                  franchiseKey != null ? `/series/${franchiseKey}` : undefined
                }
              />
            ) : undefined
          }
        />

        <section className="min-w-0 flex-1">
          <CommunityEntriesSection
            entries={entries}
            resetKey={animeId}
            emptyMessage={
              user
                ? "No activity for this season from you or your friends yet. Be the first to post!"
                : "Sign in to see activity for this season from your friends."
            }
          />
        </section>
      </div>
    </div>
  );
  // #endregion Render
};
