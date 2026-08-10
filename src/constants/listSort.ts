/**
 * src/constants/listSort.ts
 *
 * Sort orders offered for a profile's list, and the comparator behind them.
 */
import type { ProfileListCardModel } from "../utils/listEntries";
import { isOneOf } from "../utils/enumGuard";

export type SortKey =
  | "recent"
  | "oldest"
  | "rating_hi"
  | "rating_lo"
  | "title_az"
  | "title_za";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recently updated" },
  { key: "oldest", label: "Oldest updated" },
  { key: "rating_hi", label: "Rating: high to low" },
  { key: "rating_lo", label: "Rating: low to high" },
  { key: "title_az", label: "Title: A to Z" },
  { key: "title_za", label: "Title: Z to A" },
];

export const DEFAULT_SORT_KEY: SortKey = "recent";

export const isSortKey = isOneOf<SortKey>(
  SORT_OPTIONS.map((option) => option.key)
);

// Unrated cards sink to the bottom in both directions — "worst first" should
// mean the worst thing you rated, not everything you haven't rated yet.
const ratingDesc = (card: ProfileListCardModel) => card.rating ?? -1;
const ratingAsc = (card: ProfileListCardModel) =>
  card.rating ?? Number.POSITIVE_INFINITY;

/**
 * Sort profile cards. Returns a new array; the input is left alone.
 *
 * @param cards the cards to sort
 * @param key the selected sort order
 * @returns a sorted copy
 */
export const sortProfileCards = (
  cards: ProfileListCardModel[],
  key: SortKey
): ProfileListCardModel[] => {
  const sorted = [...cards];

  switch (key) {
    case "recent":
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "oldest":
      return sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    case "rating_hi":
      return sorted.sort((a, b) => ratingDesc(b) - ratingDesc(a));
    case "rating_lo":
      return sorted.sort((a, b) => ratingAsc(a) - ratingAsc(b));
    case "title_az":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title_za":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
};
