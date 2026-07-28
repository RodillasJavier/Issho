/**
 * src/utils/listEntries.ts
 *
 * Turns a user's flat list entries into the series-level cards the profile
 * page renders — one card per franchise (or per standalone show), never one
 * per season.
 *
 * The card set is the union of both list levels. Grouping the per-season
 * entries alone would drop any series tracked at the series level only, which
 * is exactly what happens after "+ Track Whole Series".
 */
import { groupUserEntriesByFranchise, franchiseRootMember } from "./franchise";
import type { UserFranchiseGroup } from "./franchise";
import type {
  ListEntry,
  AnimeListEntry,
  FranchiseListEntry,
} from "../types/listEntry";
import type {
  Anime,
  AnimeStatus,
  Franchise,
  UserAnimeEntry,
} from "../types/database.types";

// #region Types
export interface ProfileListCardModel {
  /** Stable React key and identity for the card */
  groupKey: string;
  /** Set when the card represents a franchise rather than a standalone show */
  franchiseKey: number | null;
  title: string;
  /** The user's per-season entries within this group (may be empty) */
  seasons: UserAnimeEntry[];
  /** The user's series-level entry, when they have one */
  franchiseEntry: FranchiseListEntry | null;
  /**
   * True when the card is series-level: it has a franchise key and either a
   * series row or more than one season in the list.
   */
  isFranchise: boolean;
  /** Cover art, from the series row's members or the lead season */
  coverUrl: string | null;
  /** Release years across the group's known members */
  years: number[];
  /** Episode count, for standalone shows only */
  episodeCount: number | null;
  /** Comma-separated genres, for standalone shows only */
  genres: string | null;
  /** Effective status: the series row's, else derived from the seasons */
  status: AnimeStatus;
  /** Effective rating — never derived, so it is null without a series row */
  rating: number | null;
  review: string | null;
  updatedAt: string;
  /** Anime id to link to, for standalone shows */
  animeId: string | null;
}
// #endregion Types

/**
 * A series-level status inferred from the user's per-season statuses, for
 * franchises they track season-by-season without ever setting a series
 * status. Display only — never written back, so the two levels stay
 * independent.
 */
const deriveSeriesStatus = (statuses: AnimeStatus[]): AnimeStatus => {
  if (statuses.length === 0) return "not_started";
  if (statuses.some((status) => status === "watching")) return "watching";
  if (statuses.every((status) => status === "completed")) return "completed";
  // Some finished, some not: they're partway through the series.
  if (statuses.some((status) => status === "completed")) return "watching";
  if (statuses.every((status) => status === "dropped")) return "dropped";
  return "not_started";
};

/** Most recent of a set of timestamps, for a card built from several rows. */
const latestTimestamp = (timestamps: (string | null | undefined)[]): string => {
  const present = timestamps.filter((value): value is string => value != null);
  return present.length > 0 ? present.sort().at(-1)! : "";
};

/** Build a card from a group of the user's per-season entries. */
const cardFromSeasonGroup = (
  group: UserFranchiseGroup,
  franchiseEntry: FranchiseListEntry | null
): ProfileListCardModel => {
  const lead = group.entries[0];
  const members = group.entries
    .map((entry) => entry.anime)
    .filter((anime): anime is Anime => anime != null);

  // A group is series-level once the user tracks it as a series, or once it
  // holds more than one season. A lone season with no series row is still
  // presented as the show itself.
  const isFranchise =
    group.franchiseKey != null &&
    (franchiseEntry != null || group.entries.length > 1);

  const seasonStatuses = group.entries.map((entry) => entry.status);

  return {
    groupKey: group.groupKey,
    franchiseKey: group.franchiseKey,
    title: isFranchise ? group.title : (lead.anime?.name ?? group.title),
    seasons: group.entries,
    franchiseEntry,
    isFranchise,
    coverUrl:
      (isFranchise
        ? franchiseRootMember(members, group.franchiseKey)?.cover_image_url
        : lead.anime?.cover_image_url) ?? null,
    years: members
      .map((anime) => anime.year)
      .filter((year): year is number => year != null),
    episodeCount: isFranchise ? null : (lead.anime?.episode_count ?? null),
    genres: isFranchise ? null : (lead.anime?.genres ?? null),
    status: isFranchise
      ? (franchiseEntry?.status ?? deriveSeriesStatus(seasonStatuses))
      : lead.status,
    rating: isFranchise ? (franchiseEntry?.rating ?? null) : lead.rating,
    review: isFranchise ? (franchiseEntry?.review ?? null) : lead.review,
    updatedAt: isFranchise
      ? (franchiseEntry?.updated_at ??
        latestTimestamp(group.entries.map((entry) => entry.updated_at)))
      : lead.updated_at,
    animeId: isFranchise ? null : lead.anime_id,
  };
};

/**
 * Build a card for a series the user tracks at the series level only, with no
 * seasons of it in their list. user_franchise_entries carries no metadata, so
 * the title, art and year span come from the `franchises` view — which
 * computes them in SQL rather than making the client fetch every member row.
 */
const cardFromFranchiseEntry = (
  entry: FranchiseListEntry,
  franchise: Franchise | undefined
): ProfileListCardModel => ({
  groupKey: `f:${entry.franchise_key}`,
  franchiseKey: entry.franchise_key,
  title: franchise?.display_title ?? franchise?.title ?? "Unknown Series",
  seasons: [],
  franchiseEntry: entry,
  isFranchise: true,
  coverUrl: franchise?.cover_image_url ?? null,
  years: [franchise?.first_year, franchise?.last_year].filter(
    (year): year is number => year != null
  ),
  episodeCount: null,
  genres: null,
  status: entry.status,
  rating: entry.rating,
  review: entry.review,
  updatedAt: entry.updated_at,
  animeId: null,
});

/**
 * Build the profile's series-level cards from a user's list.
 *
 * @param entries the user's entries at both levels
 * @param franchises metadata for franchises the user tracks at the series
 *   level only, from the `franchises` view (see `fetchFranchises`)
 * @returns one card per franchise or standalone show
 */
export const buildProfileListCards = (
  entries: ListEntry[],
  franchises: Franchise[] = []
): ProfileListCardModel[] => {
  const seasonEntries = entries.filter(
    (entry): entry is AnimeListEntry => entry.kind === "anime"
  );
  const franchiseEntries = entries.filter(
    (entry): entry is FranchiseListEntry => entry.kind === "franchise"
  );

  const franchiseEntryByKey = new Map(
    franchiseEntries.map((entry) => [entry.franchise_key, entry])
  );

  const groups = groupUserEntriesByFranchise(seasonEntries);
  const cards = groups.map((group) =>
    cardFromSeasonGroup(
      group,
      group.franchiseKey != null
        ? (franchiseEntryByKey.get(group.franchiseKey) ?? null)
        : null
    )
  );

  // Series the user tracks with none of its seasons in their list. Without
  // this the row exists but nothing ever renders it.
  const coveredKeys = new Set(
    groups
      .map((group) => group.franchiseKey)
      .filter((key): key is number => key != null)
  );
  const franchiseByKey = new Map(
    franchises.map((franchise) => [franchise.anilist_root_id, franchise])
  );

  for (const entry of franchiseEntries) {
    if (coveredKeys.has(entry.franchise_key)) continue;
    cards.push(
      cardFromFranchiseEntry(entry, franchiseByKey.get(entry.franchise_key))
    );
  }

  return cards;
};

/**
 * Franchise keys whose member anime the profile has to fetch separately:
 * those the user tracks at the series level with no seasons in their list.
 *
 * @param entries the user's entries at both levels
 * @returns franchise keys needing a metadata fetch
 */
export const franchiseKeysNeedingMembers = (entries: ListEntry[]): number[] => {
  const covered = new Set<number>();
  const tracked = new Set<number>();

  for (const entry of entries) {
    if (entry.kind === "anime") {
      const key = entry.anime?.franchise_key;
      if (key != null) covered.add(key);
    } else {
      tracked.add(entry.franchise_key);
    }
  }

  return [...tracked].filter((key) => !covered.has(key));
};
