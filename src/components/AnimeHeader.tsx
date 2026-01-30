/**
 * src/components/AnimeHeader.tsx
 *
 * Enhanced header for anime pages showing metadata from Jikan. Displayed in
 * the page for a specific anime.
 */

import { useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import type { Anime } from "../types/database.types";

interface AnimeHeaderProps {
  animeId: string;
}

// #region Component Logic

/**
 * Fetch anime details by ID.
 *
 * @param animeId uuid of the anime to fetch
 * @returns Anime details
 */
const fetchAnime = async (animeId: string): Promise<Anime> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .eq("id", animeId)
    .single();

  if (error) throw new Error(error.message);
  return data as Anime;
};

export function AnimeHeader({ animeId }: AnimeHeaderProps) {
  const {
    data: anime,
    isLoading,
    error,
  } = useQuery<Anime, Error>({
    queryKey: ["anime", animeId],
    queryFn: () => fetchAnime(animeId),
  });

  // #endregion Component Logic

  // #region Render

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-white/5 backdrop-blur-sm rounded-lg animate-pulse" />
    );
  }

  if (error || !anime) {
    return (
      <div className="text-center text-red-400">
        Error loading anime details
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-white/5 to-transparent rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Cover Image */}
          {anime.cover_image_url && (
            <div className="flex-shrink-0">
              <img
                src={anime.cover_image_url}
                alt={anime.name}
                className="w-full md:w-48 h-auto object-cover rounded-lg shadow-xl"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 space-y-4">
            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
                {anime.name}
              </h1>
              {anime.name_japanese && (
                <p className="text-lg text-gray-400 mt-1">
                  {anime.name_japanese}
                </p>
              )}
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              {anime.year && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                  {anime.year}
                </span>
              )}
              {anime.status && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                  {anime.status}
                </span>
              )}
              {anime.episode_count && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                  {anime.episode_count} Episodes
                </span>
              )}
              {anime.mal_url && (
                <a
                  href={anime.mal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm rounded-full text-blue-300 hover:text-blue-200 transition-colors"
                >
                  MyAnimeList ↗
                </a>
              )}
            </div>

            {/* Genres */}
            {anime.genres && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.split(", ").map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded text-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {anime.description && (
              <p className="text-gray-300 leading-relaxed line-clamp-4">
                {anime.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// #endregion Render
