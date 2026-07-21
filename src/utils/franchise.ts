/**
 * src/utils/franchise.ts
 *
 * Client-side grouping of anime rows by franchise_key for the display layer.
 */
import type { Anime, UserAnimeEntry } from "../types/database.types";

// #region Types
export interface FranchiseGroup {
  /** Stable grouping key: franchise_key, else anilist_id, else the row uuid */
  groupKey: string;
  /** The shared franchise_key when the group is a real franchise */
  franchiseKey: number | null;
  title: string;
  members: Anime[];
}

export interface UserFranchiseGroup {
  groupKey: string;
  franchiseKey: number | null;
  title: string;
  entries: UserAnimeEntry[];
}
// #endregion Types

/**
 * Generate a stable grouping key for an anime row. Franchise groups are keyed
 * by franchise_key, else by anilist_id, else by the row uuid. This ensures
 * that legacy or manually-added anime without a franchise_key stay as
 * singleton groups, while all members of a franchise share the same group key.
 *
 * @param anime - The anime row to generate a group key for.
 * @returns A stable grouping key for the anime row.
 */
const animeGroupKey = (anime: Anime): string =>
  anime.franchise_key != null
    ? `f:${anime.franchise_key}`
    : anime.anilist_id != null
      ? `a:${anime.anilist_id}`
      : anime.id;

/**
 * Compares two anime entries by their release year and name.
 *
 * @param a - The first anime entry to compare.
 * @param b - The second anime entry to compare.
 * @returns The comparison result.
 */
const byYear = (a: Anime, b: Anime): number =>
  (a.year ?? 9999) - (b.year ?? 9999) ||
  a.name.length - b.name.length ||
  a.name.localeCompare(b.name);

/**
 * Preferred display title for a franchise: the earliest TV member's name.
 * The stored franchise_title is the chain root's title, which can be an OVA
 * or special ("Attack on Titan: No Regrets") — a stable key, but a poor
 * headline. Display-only; never persisted. Expects members already sorted
 * by release order (callers group-sort with `byYear` beforehand).
 */
export const franchiseDisplayTitle = (
  members: (Anime | undefined)[]
): string | null => {
  const present = members.filter((anime): anime is Anime => anime != null);
  if (present.length === 0) return null;
  const tv = present.find((anime) => anime.format === "TV");
  return (tv ?? present[0]).name;
};

/**
 * Human-readable release year span for a franchise, e.g. "2013" or
 * "2013–2023". Returns null when no member has a known year.
 */
export const yearRangeLabel = (years: number[]): string | null => {
  if (years.length === 0) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min}–${max}`;
};

/**
 * Shared grouping engine behind `groupAnimeByFranchise` and
 * `groupUserEntriesByFranchise`: buckets items by franchise group key,
 * preserving first-appearance order, then sorts each bucket by release year
 * and derives its display title.
 */
const groupByFranchise = <T, G extends { title: string }>(
  items: T[],
  getAnime: (item: T) => Anime | undefined,
  fallbackKey: (item: T) => string,
  createGroup: (key: string, anime: Anime | undefined, item: T) => G,
  pushItem: (group: G, item: T) => void,
  sortGroup: (group: G) => void,
  titleOf: (group: G) => string | null
): G[] => {
  const groups = new Map<string, G>();

  for (const item of items) {
    const anime = getAnime(item);
    const key = anime ? animeGroupKey(anime) : fallbackKey(item);
    const existing = groups.get(key);
    if (existing) {
      pushItem(existing, item);
    } else {
      groups.set(key, createGroup(key, anime, item));
    }
  }

  for (const group of groups.values()) {
    sortGroup(group);
    group.title = titleOf(group) ?? group.title;
  }

  return [...groups.values()];
};

/**
 * Group anime rows by franchise. Rows without a franchise_key (legacy or
 * manual entries) stay as singleton groups.
 *
 * @param animeList anime rows in display order
 * @returns groups in order of each group's first appearance
 */
export const groupAnimeByFranchise = (animeList: Anime[]): FranchiseGroup[] =>
  groupByFranchise(
    animeList,
    (anime) => anime,
    (anime) => anime.id,
    (key, _anime, anime) => ({
      groupKey: key,
      franchiseKey: anime.franchise_key,
      title: anime.franchise_title ?? anime.name,
      members: [anime],
    }),
    (group, anime) => group.members.push(anime),
    (group) => group.members.sort(byYear),
    (group) => franchiseDisplayTitle(group.members)
  );

/**
 * Group a user's list entries by their anime's franchise, preserving the
 * incoming order of first appearance.
 *
 * @param entries user_anime_entries rows with anime joined
 * @returns groups in order of each group's first appearance
 */
export const groupUserEntriesByFranchise = (
  entries: UserAnimeEntry[]
): UserFranchiseGroup[] =>
  groupByFranchise(
    entries,
    (entry) => entry.anime,
    (entry) => entry.anime_id,
    (key, anime, entry) => ({
      groupKey: key,
      franchiseKey: anime?.franchise_key ?? null,
      title: anime?.franchise_title ?? anime?.name ?? "Unknown Anime",
      entries: [entry],
    }),
    (group, entry) => group.entries.push(entry),
    (group) =>
      group.entries.sort((a, b) =>
        a.anime && b.anime ? byYear(a.anime, b.anime) : 0
      ),
    (group) => franchiseDisplayTitle(group.entries.map((entry) => entry.anime))
  );
