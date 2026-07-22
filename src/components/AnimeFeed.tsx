/**
 * src/components/AnimeFeed.tsx
 *
 * Season detail view (route /anime/:id): a full-bleed hero for the season,
 * per-season watchlist tracking, a link up to its series with the sibling
 * "Seasons & films" grid (current season highlighted), and the season's own
 * community entries.
 */
import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, Plus } from "lucide-react";
import type { Anime } from "../types/database.types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { AddToListButton } from "./AddToListButton";
import { DetailHero } from "./DetailHero";
import { SeasonsGrid } from "./SeasonsGrid";
import { WatchStatusBadge } from "./WatchStatusBadge";
import { CommunityEntriesSection } from "./CommunityEntriesSection";
import { fetchAnime } from "../services/supabase/anime";
import { fetchEntriesWithCounts } from "../services/supabase/entries";
import { getUserAnimeEntry } from "../services/supabase/userAnimeList";
import { useFranchiseMembers } from "../hooks/useFranchiseMembers";
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

  // Shares the ["entries"] cache with the homepage feed/Friends page/Series
  // page (per CLAUDE.md), so this never triggers its own fetch once that's
  // warm, and gets the same accurate like/dislike/comment counts they do.
  const { data: allEntries } = useQuery({
    queryKey: ["entries"],
    queryFn: fetchEntriesWithCounts,
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
  });

  const franchiseKey = anime?.franchise_key ?? null;
  const { franchiseMembers, isMultiEntryFranchise } =
    useFranchiseMembers(franchiseKey);
  const franchiseTitle =
    franchiseDisplayTitle(franchiseMembers ?? []) ??
    anime?.franchise_title ??
    "this series";
  // #endregion

  // #region Render
  if (isLoading || !anime) {
    return <div className="h-64 w-full animate-pulse rounded-xl bg-white/5" />;
  }

  if (error) {
    console.error(error);
    return <div>Error loading anime: {error.message}</div>;
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
        actions={
          <>
            <Link
              to={`/entry/create?animeId=${animeId}`}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/45 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            >
              <Plus aria-hidden className="size-4 text-rose-300" />
              Create an entry
            </Link>
            {user && <AddToListButton animeId={animeId} />}
          </>
        }
      />

      {isMultiEntryFranchise && franchiseMembers && (
        <SeasonsGrid members={franchiseMembers} currentId={animeId} />
      )}

      <CommunityEntriesSection
        entries={entries}
        emptyMessage="No activity for this season yet. Be the first to post!"
      />
    </div>
  );
  // #endregion Render
};
