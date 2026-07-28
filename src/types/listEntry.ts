/**
 * src/types/listEntry.ts
 *
 * One normalized shape over the two physically-separate user list tables
 * (user_anime_entries, user_franchise_entries). The tables stay separate and
 * unchanged; this is the type the profile page, the list cards, the list
 * buttons and the edit modal all speak, so none of them has to know which
 * table a row came from.
 *
 * Field names are snake_case to match the row types this wraps, so a row
 * spreads straight into its ListEntry without renaming.
 */
import type {
  Anime,
  AnimeStatus,
  UserAnimeEntry,
  UserFranchiseEntry,
} from "./database.types";

// #region Types
export type ListEntryKind = "anime" | "franchise";

/** Exactly the columns the two tables have in common. */
interface ListEntryCommon {
  id: string;
  user_id: string;
  status: AnimeStatus;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimeListEntry extends ListEntryCommon {
  kind: "anime";
  anime_id: string;
  anime?: Anime; // When joined
}

export interface FranchiseListEntry extends ListEntryCommon {
  kind: "franchise";
  franchise_key: number;
}

export type ListEntry = AnimeListEntry | FranchiseListEntry;

/** What a list edit can change — identical for both kinds, which is the point. */
export type ListEntryUpdate = Partial<
  Pick<ListEntryCommon, "status" | "rating" | "review">
>;

/** Addresses a list slot that may not have a row yet (the list buttons). */
export type ListTarget =
  | { kind: "anime"; anime_id: string }
  | { kind: "franchise"; franchise_key: number };
// #endregion Types

export const toAnimeListEntry = (row: UserAnimeEntry): AnimeListEntry => ({
  ...row,
  kind: "anime",
});

export const toFranchiseListEntry = (
  row: UserFranchiseEntry
): FranchiseListEntry => ({
  ...row,
  kind: "franchise",
});
