/**
 * src/utils/anime.ts
 *
 * Small display-shaping helpers for anime rows, shared across the anime
 * browse/search/detail cards.
 */

/** Anime.genres is a comma-separated string; split it into a trimmed, non-empty list. */
export const splitGenres = (genres: string | null | undefined): string[] =>
  genres
    ?.split(",")
    .map((genre) => genre.trim())
    .filter(Boolean) ?? [];
