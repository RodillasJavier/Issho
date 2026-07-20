/**
 * src/components/AnimeList.tsx
 *
 * Component to display a list of animes, grouped by franchise.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { FranchiseCard } from "./FranchiseCard";
import { groupAnimeByFranchise } from "../utils/franchise";

// #region Types
import type { Anime } from "../types/database.types";

const ITEMS_PER_PAGE = 20;

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

export const AnimeList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(0);

  const { data, isLoading, error } = useQuery<Anime[], Error>({
    queryKey: ["anime"],
    queryFn: fetchAllAnime,
  });

  // Filter anime based on search query, then group by franchise
  const franchiseGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filteredAnime = data?.filter(
      (anime) =>
        anime.name.toLowerCase().includes(query) ||
        anime.name_japanese?.toLowerCase().includes(query) ||
        anime.description?.toLowerCase().includes(query) ||
        anime.genres?.toLowerCase().includes(query)
    );
    return groupAnimeByFranchise(filteredAnime ?? []);
  }, [data, searchQuery]);

  // Paginate groups
  const totalFiltered = franchiseGroups.length;
  const startIndex = pageNumber * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedGroups = franchiseGroups.slice(startIndex, endIndex);
  const hasMore = endIndex < totalFiltered;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPageNumber(0); // Reset to first page when search changes
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

  // #endregion Render
  if (isLoading) {
    return <div>Loading anime...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading anime: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search anime by title, description, or genre..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-3 pl-12 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
        />

        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"
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

        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-neutral-400">
          Found {totalFiltered} anime
        </div>
      )}

      {/* Results */}
      {paginatedGroups && paginatedGroups.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {paginatedGroups.map((group) => (
              <FranchiseCard key={group.groupKey} group={group} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalFiltered > ITEMS_PER_PAGE && (
            <div className="flex justify-center items-center gap-4 py-4">
              <button
                onClick={handlePrevPage}
                disabled={pageNumber === 0}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>

              <span className="text-gray-400">
                Page {pageNumber + 1} of{" "}
                {Math.ceil(totalFiltered / ITEMS_PER_PAGE)}
              </span>

              <button
                onClick={handleNextPage}
                disabled={!hasMore}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-400 py-8">No anime found</div>
      )}

      <h2 className="text-center text-xl pt-10 text-neutral-400">
        Can't find what you're looking for? Try searching for it and adding it
        to the database!
      </h2>
    </div>
  );
};
// #endregion Render
