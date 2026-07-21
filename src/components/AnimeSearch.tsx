/**
 * src/components/AnimeSearch.tsx
 *
 * Search component for finding anime from AniList API and local database
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router";
import { searchAnimeCombined } from "../api/animeSearch";
import { importAnimeFromAniList } from "../api/animeImport";
import type { CombinedSearchResults } from "../api/animeSearch";

// #region Component Logic
export function AnimeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CombinedSearchResults | null>(null);

  const searchMutation = useMutation({
    mutationFn: searchAnimeCombined,
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const importMutation = useMutation({
    mutationFn: (anilistId: number) => importAnimeFromAniList(anilistId),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      searchMutation.mutate(query.trim());
    }
  };

  const handleImport = async (anilistId: number) => {
    await importMutation.mutateAsync(anilistId);

    if (query.trim()) {
      searchMutation.mutate(query.trim());
    }
  };
  // #endregion Component Logic

  // #region Render
  return (
    <div className="space-y-6 w-full">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anime from AniList..."
          className="w-full px-4 py-3 pl-12 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
        />

        {/* Search Icon */}
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

        <button
          type="submit"
          disabled={searchMutation.isPending || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {searchMutation.isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error State */}
      {searchMutation.isError && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100">
          Error searching anime. Please try again.
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-8">
          {/* Local Results */}
          {results.localResults.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                In Your Database ({results.localResults.length})
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.localResults.map((anime) => (
                  <Link
                    key={anime.id}
                    to={`/anime/${anime.id}`}
                    className="group block"
                  >
                    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                      <img
                        src={anime.cover_image_url || "/placeholder.png"}
                        alt={anime.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full aspect-[2/3] object-cover"
                      />

                      <div className="p-3">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {anime.name}
                        </h3>

                        {anime.year && (
                          <p className="text-sm text-gray-400 mt-1">
                            {anime.year}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AniList Results */}
          {results.anilistResults && results.anilistResults.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                From AniList ({results.anilistResults.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.anilistResults.map((anime) => {
                  const isInDb = results.localResults.some(
                    (local) => local.anilist_id === anime.id
                  );
                  const title = anime.title.english ?? anime.title.romaji ?? "";

                  return (
                    <div
                      key={anime.id}
                      className="bg-white/5 rounded-lg overflow-hidden border border-white/10"
                    >
                      <img
                        src={anime.coverImage.large ?? undefined}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        className="w-full aspect-[2/3] object-cover"
                      />

                      <div className="p-3">
                        <div className="mb-2">
                          <h3 className="font-semibold line-clamp-2">
                            {title}
                          </h3>

                          {anime.title.english &&
                            anime.title.romaji &&
                            anime.title.romaji !== anime.title.english && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                {anime.title.romaji}
                              </p>
                            )}
                        </div>

                        {(anime.seasonYear ?? anime.startDate.year) && (
                          <p className="text-sm text-gray-400 mt-1">
                            {anime.seasonYear ?? anime.startDate.year}
                          </p>
                        )}

                        {anime.genres.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {anime.genres.join(", ")}
                          </p>
                        )}

                        <button
                          onClick={() => handleImport(anime.id)}
                          disabled={isInDb || importMutation.isPending}
                          className="mt-2 w-full px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isInDb
                            ? "Already Added"
                            : importMutation.isPending
                              ? "Adding..."
                              : "Add to Database"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.localResults.length === 0 &&
            results.anilistResults.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No anime found for "{query}"
              </div>
            )}
        </div>
      )}
    </div>
  );
}
// #endregion Render
