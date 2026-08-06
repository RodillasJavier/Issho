/**
 * src/components/AnimeList.tsx
 *
 * The unified /anime catalog. With an empty query it browses local franchises
 * (grouped, paginated, genre-filtered). Typing switches to a flat results
 * grid that merges instant in-memory matches with debounced AniList results —
 * adding any of them to your list imports it behind the scenes, so there's no
 * separate "add to database" step.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import supabase from "../supabase-client";
import { FranchiseCard } from "./FranchiseCard";
import { SearchResultCard } from "./SearchResultCard";
import { Skeleton } from "./ui/Skeleton";
import { groupAnimeByFranchise } from "../utils/franchise";
import { splitGenres } from "../utils/anime";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { searchAnimeFromAniList } from "../api/animeSearch";

// #region Types
import type { Anime } from "../types/database.types";
import type { AniListMedia } from "../services/anilistApi";
import type { FranchiseGroup } from "../utils/franchise";

const ITEMS_PER_PAGE = 20;
const ALL_GENRES = "All";
const MIN_REMOTE_QUERY_LENGTH = 2;
const REMOTE_DEBOUNCE_MS = 400;

// A search result is either a series-level card, a local season card, or an
// AniList-only (not-yet-imported) card.
type SearchItem =
  | { kind: "series"; key: string; group: FranchiseGroup }
  | { kind: "season"; key: string; localAnime: Anime }
  | { kind: "remote"; key: string; media: AniListMedia };
// #endregion Types

// #region Component Logic
const fetchAllAnime = async (): Promise<Anime[]> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as Anime[];
};

const matchesText = (anime: Anime, query: string): boolean =>
  anime.name.toLowerCase().includes(query) ||
  (anime.name_japanese?.toLowerCase().includes(query) ?? false) ||
  (anime.description?.toLowerCase().includes(query) ?? false) ||
  (anime.genres?.toLowerCase().includes(query) ?? false);

export const AnimeList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState(ALL_GENRES);
  const [pageNumber, setPageNumber] = useState(0);

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const debouncedQuery = useDebouncedValue(trimmedQuery, REMOTE_DEBOUNCE_MS);
  const shouldSearchRemote = debouncedQuery.length >= MIN_REMOTE_QUERY_LENGTH;

  const { data, isLoading, error } = useQuery<Anime[], Error>({
    queryKey: ["anime"],
    queryFn: fetchAllAnime,
  });

  // AniList is only hit on the settled, debounced query (min-length gated,
  // cached per term) so keystrokes don't fan out into API calls.
  const { data: anilistResults, isFetching: isSearchingAniList } = useQuery({
    queryKey: ["anilistSearch", debouncedQuery],
    queryFn: () => searchAnimeFromAniList(debouncedQuery),
    enabled: shouldSearchRemote,
    staleTime: 5 * 60 * 1000,
  });

  // Every genre present in the database, alphabetized, used as filter pills.
  const genreFilters = useMemo(() => {
    const genres = new Set<string>();
    for (const anime of data ?? []) {
      for (const genre of splitGenres(anime.genres)) {
        genres.add(genre);
      }
    }
    return [ALL_GENRES, ...[...genres].sort((a, b) => a.localeCompare(b))];
  }, [data]);

  // Every local anime grouped into franchises, independent of the current
  // search/genre filters — reused as a lookup by both browse pagination and
  // the search-result grouping below, instead of regrouping on every match.
  const allGroups = useMemo(() => groupAnimeByFranchise(data ?? []), [data]);

  // Local anime already loaded here, keyed by anilist_id — lets
  // SearchResultCard skip its own per-card lookup for AniList results that
  // are already imported but weren't a text match on their local row.
  const localByAnilistId = useMemo(() => {
    const map = new Map<number, Anime>();
    for (const anime of data ?? []) {
      if (anime.anilist_id != null) map.set(anime.anilist_id, anime);
    }
    return map;
  }, [data]);

  // Browse state (empty query): local anime grouped into franchises.
  const franchiseGroups = useMemo(() => {
    if (isSearching) return [];
    const filtered = (data ?? []).filter(
      (anime) =>
        activeGenre === ALL_GENRES ||
        splitGenres(anime.genres).includes(activeGenre)
    );
    return groupAnimeByFranchise(filtered);
  }, [data, activeGenre, isSearching]);

  // Search state: instant local matches (grouped series-first) + deduped
  // AniList additions.
  const searchResults = useMemo<SearchItem[]>(() => {
    if (!isSearching) return [];
    const query = trimmedQuery.toLowerCase();
    const localMatches = (data ?? []).filter(
      (anime) =>
        matchesText(anime, query) &&
        (activeGenre === ALL_GENRES ||
          splitGenres(anime.genres).includes(activeGenre))
    );

    // Map every local anime to its franchise group so a match knows whether it
    // belongs to a multi-member series (and can borrow the full group card).
    const groupByAnimeId = new Map<string, FranchiseGroup>();
    for (const group of allGroups) {
      for (const member of group.members) {
        groupByAnimeId.set(member.id, group);
      }
    }
    const matchedIds = new Set(localMatches.map((anime) => anime.id));

    const items: SearchItem[] = [];
    const emittedGroups = new Set<string>();
    for (const anime of localMatches) {
      const group = groupByAnimeId.get(anime.id);
      if (group && group.members.length > 1) {
        if (emittedGroups.has(group.groupKey)) continue;
        emittedGroups.add(group.groupKey);
        items.push({ kind: "series", key: `s-${group.groupKey}`, group });
        // Matched members in the group's own (year-sorted) order.
        for (const member of group.members) {
          if (matchedIds.has(member.id)) {
            items.push({
              kind: "season",
              key: `l-${member.id}`,
              localAnime: member,
            });
          }
        }
      } else {
        items.push({ kind: "season", key: `l-${anime.id}`, localAnime: anime });
      }
    }

    const localAnilistIds = new Set(
      localMatches
        .map((anime) => anime.anilist_id)
        .filter((id): id is number => id != null)
    );
    for (const media of anilistResults ?? []) {
      if (
        !localAnilistIds.has(media.id) &&
        (activeGenre === ALL_GENRES || media.genres.includes(activeGenre))
      ) {
        items.push({ kind: "remote", key: `a-${media.id}`, media });
      }
    }

    return items;
  }, [data, allGroups, anilistResults, isSearching, trimmedQuery, activeGenre]);

  // Are we still waiting on (or fetching) AniList for the current input?
  const remoteInFlight =
    isSearching &&
    trimmedQuery.length >= MIN_REMOTE_QUERY_LENGTH &&
    (debouncedQuery !== trimmedQuery || isSearchingAniList);

  // Browse pagination
  const totalFranchises = franchiseGroups.length;
  const startIndex = pageNumber * ITEMS_PER_PAGE;
  const paginatedGroups = franchiseGroups.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
  const hasMore = startIndex + ITEMS_PER_PAGE < totalFranchises;
  const totalPages = Math.ceil(totalFranchises / ITEMS_PER_PAGE);

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre);
    setPageNumber(0);
  };

  const handlePrevPage = () => {
    if (pageNumber > 0) setPageNumber(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (hasMore) setPageNumber(pageNumber + 1);
  };
  // #endregion Component Logic

  // #region Render
  if (isLoading) {
    return <AnimeListSkeleton />;
  }

  if (error) {
    console.error(error);
    return (
      <div className="mt-8 text-zinc-400">
        Error loading anime: {error.message}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filters */}
      <section
        aria-label="Browse filters"
        className="mt-6 border-t border-zinc-800 py-4"
      >
        <label className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-[#101014] px-3 py-2.5 focus-within:border-rose-400/60">
          <Search aria-hidden className="size-4 shrink-0 text-zinc-500" />
          <span className="sr-only">Search anime</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any anime by title, description, or genre"
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        </label>

        {genreFilters.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Filter aria-hidden className="size-4 shrink-0 text-zinc-600" />
            {genreFilters.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreChange(genre)}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer ${
                  activeGenre === genre
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      <section aria-labelledby="library-heading" className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="library-heading"
            className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300"
          >
            {isSearching ? "Results" : "Explore titles"}
          </h2>
          <p className="font-mono text-xs text-zinc-600">
            {isSearching
              ? `${searchResults.length} ${searchResults.length === 1 ? "result" : "results"}`
              : `${totalFranchises} ${totalFranchises === 1 ? "franchise" : "franchises"}`}
          </p>
        </div>

        {isSearching ? (
          <SearchResultsGrid
            results={searchResults}
            loading={remoteInFlight}
            localByAnilistId={localByAnilistId}
          />
        ) : paginatedGroups.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedGroups.map((group) => (
                <FranchiseCard key={group.groupKey} group={group} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={handlePrevPage}
                  disabled={pageNumber === 0}
                  aria-label="Previous page"
                  className="flex items-center justify-center size-9 rounded-md border border-zinc-800 bg-[#101014] text-zinc-100 transition-colors hover:border-rose-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <span className="font-mono text-xs text-zinc-500">
                  Page {pageNumber + 1} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  aria-label="Next page"
                  className="flex items-center justify-center size-9 rounded-md border border-zinc-800 bg-[#101014] text-zinc-100 transition-colors hover:border-rose-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-[#101014] px-5 py-16 text-center">
            <p className="text-sm font-semibold text-zinc-200">
              No anime in the database yet
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Search for a title above to add the first one.
            </p>
          </div>
        )}
      </section>
    </div>
  );
  // #endregion Render
};

// #region Subcomponents
const SearchResultsGrid = ({
  results,
  loading,
  localByAnilistId,
}: {
  results: SearchItem[];
  loading: boolean;
  localByAnilistId: Map<number, Anime>;
}) => {
  if (results.length === 0) {
    if (loading) {
      return (
        <p className="py-16 text-center text-sm text-zinc-500">
          Searching AniList…
        </p>
      );
    }
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-[#101014] px-5 py-16 text-center">
        <p className="text-sm font-semibold text-zinc-200">No titles found</p>
        <p className="mt-2 text-sm text-zinc-500">
          Try a different title, character, or alternate spelling.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((item) =>
          item.kind === "series" ? (
            <FranchiseCard key={item.key} group={item.group} />
          ) : item.kind === "season" ? (
            <SearchResultCard
              key={item.key}
              localAnime={item.localAnime}
              anilistMedia={null}
            />
          ) : (
            <SearchResultCard
              key={item.key}
              localAnime={localByAnilistId.get(item.media.id) ?? null}
              anilistMedia={item.media}
            />
          )
        )}
      </div>

      {loading && (
        <p className="mt-6 text-center text-sm text-zinc-500">
          Searching AniList…
        </p>
      )}
    </>
  );
};

// Matches the filter bar + card grid below it, so there's no dramatic
// collapse-then-expand once the real catalog loads.
const AnimeListSkeleton = () => (
  <div className="w-full">
    <div className="mt-6 border-t border-zinc-800 py-4">
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-16 rounded-md" />
        ))}
      </div>
    </div>

    <div className="mt-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[2/3] w-full" />
        ))}
      </div>
    </div>
  </div>
);
// #endregion Subcomponents
