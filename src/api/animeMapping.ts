/**
 * src/api/animeMapping.ts
 *
 * Maps AniList Media objects to `anime` table rows. Kept free of the Supabase
 * client so the backfill script can reuse it outside the Vite runtime.
 */
import type { AniListMedia } from "../services/anilistApi";
import type { AnimeInsert } from "../types/database.types";
import type { FranchiseInfo } from "../services/anilistFranchise";

// AniList MediaStatus → the display strings the app already stores/renders
const STATUS_MAP: Record<string, string> = {
  FINISHED: "Finished Airing",
  RELEASING: "Currently Airing",
  NOT_YET_RELEASED: "Not Yet Aired",
  CANCELLED: "Cancelled",
  HIATUS: "On Hiatus",
};

// AniList descriptions embed HTML (<br>, <i>, entities) even with
// asHtml: false — the UI renders plain text, so strip it on the way in
const stripHtml = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Convert AniList media to our database format. Prefers English titles when
 * available; stores the native (Japanese) title alongside.
 *
 * @param media AniListMedia object from the AniList API
 * @param franchise Resolved franchise key/title for the entry
 * @returns AnimeInsert object for database upsert
 */
export const mapAniListToAnime = (
  media: AniListMedia,
  franchise?: FranchiseInfo
): AnimeInsert => {
  return {
    name: media.title.english ?? media.title.romaji ?? String(media.id),
    name_japanese: media.title.native,
    anilist_id: media.id,
    mal_id: media.idMal,
    cover_image_url: media.coverImage.extraLarge ?? media.coverImage.large,
    banner_image_url: media.bannerImage,
    // Column is NOT NULL but AniList descriptions can be null
    description: media.description ? stripHtml(media.description) : "",
    episode_count: media.episodes,
    year: media.seasonYear ?? media.startDate.year,
    genres: media.genres.length > 0 ? media.genres.join(", ") : null,
    status: media.status ? (STATUS_MAP[media.status] ?? media.status) : null,
    format: media.format,
    anilist_url: media.siteUrl,
    mal_url: media.idMal
      ? `https://myanimelist.net/anime/${media.idMal}`
      : null,
    franchise_key: franchise?.key ?? null,
    franchise_title: franchise?.title ?? null,
  };
};
