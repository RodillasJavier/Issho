/**
 * src/services/supabase/userLists.ts
 *
 * Unified facade over the two physically-separate list tables
 * (user_anime_entries, user_franchise_entries). Reads both and returns one
 * normalized ListEntry shape; routes writes back to whichever table the entry
 * came from. The profile page, the list cards, the list buttons and the edit
 * modal go through here rather than branching on anime-vs-franchise
 * themselves.
 *
 * Writes default to LIST STATE ONLY — editing your list is a correction to
 * your own records, not a statement worth broadcasting, and /entry/:id
 * renders the author's live status and rating anyway. Callers where the act
 * itself *is* the statement (the detail-page list button) opt in with
 * `{ announce: true }`; nothing else in the app writes to `entries` except
 * the Create composer.
 *
 * This is a pure facade: it imports the two per-table services and they never
 * import it.
 */
import supabase from "../../supabase-client";
import {
  fetchAllUserAnimeEntries,
  getUserAnimeEntry,
  addUserAnimeEntry,
  addUserAnimeEntryListOnly,
  updateUserAnimeEntry,
  updateUserAnimeEntryFields,
  removeUserAnimeEntry,
} from "./userAnimeList";
import {
  fetchUserFranchiseList,
  getUserFranchiseEntry,
  addUserFranchiseEntry,
  updateUserFranchiseEntry,
  removeUserFranchiseEntry,
} from "./userFranchiseList";
import { toAnimeListEntry, toFranchiseListEntry } from "../../types/listEntry";
import type {
  ListEntry,
  ListEntryUpdate,
  ListTarget,
} from "../../types/listEntry";
import type { AnimeStatus } from "../../types/database.types";

/**
 * Query key for a user's whole list. Keyed on the list's owner (not the
 * viewer) because the rows belong to them; RLS still decides whether the
 * viewer gets any back.
 */
export const userListQueryKey = (userId: string | undefined) =>
  ["userList", userId] as const;

/**
 * Query keys that change whenever a list entry is added, updated, or
 * removed. Shared by every write surface (the detail-page list button,
 * search results, the profile edit modal) so cache invalidation can't drift
 * out of sync between them — seeding a series row on a season add can change
 * the other level too, so both table-level keys are always included.
 */
export const listInvalidationKeys = (
  userId: string | undefined
): (readonly unknown[])[] => [
  userListQueryKey(userId),
  ["userAnimeList"],
  ["userFranchiseList"],
];

/**
 * Fetch every list entry a user has, at both levels, in one normalized shape.
 *
 * @param userId uuid of the list's owner
 * @returns the user's per-season and series-level entries
 */
export const fetchUserListEntries = async (
  userId: string
): Promise<ListEntry[]> => {
  const [animeRows, franchiseRows] = await Promise.all([
    fetchAllUserAnimeEntries(userId),
    fetchUserFranchiseList(userId),
  ]);

  return [
    ...animeRows.map(toAnimeListEntry),
    ...franchiseRows.map(toFranchiseListEntry),
  ];
};

/**
 * Get the user's entry for a list slot, if they have one.
 *
 * @param target the season or series being addressed
 * @param userId uuid of the user
 * @returns the ListEntry if found, or null otherwise
 */
export const getListEntry = async (
  target: ListTarget,
  userId: string
): Promise<ListEntry | null> => {
  if (target.kind === "franchise") {
    const row = await getUserFranchiseEntry(target.franchise_key, userId);
    return row ? toFranchiseListEntry(row) : null;
  }

  const row = await getUserAnimeEntry(target.anime_id, userId);
  return row ? toAnimeListEntry(row) : null;
};

/**
 * Seed a series-level row for the franchise a freshly-added season belongs
 * to, so the franchise lands on the user's profile rather than a lone season.
 *
 * Fires at most once per franchise per user: if a series row already exists
 * it is left completely alone, and nothing here ever runs again for later
 * season changes. That keeps the two levels independent — the user owns their
 * series status once it exists — while still making "add a season" mean "I'm
 * watching this show", which is what people expect.
 *
 * Skipped for single-member franchises, where the season *is* the series and
 * a second row would be a duplicate carrying nothing extra.
 *
 * @param franchiseKey the season's franchise key, from the row the caller
 *   just inserted (already joined against `anime`, so this never re-queries
 *   it)
 * @param userId uuid of the user
 * @param status status to seed the series row with
 */
const seedFranchiseEntry = async (
  franchiseKey: number | null | undefined,
  userId: string,
  status: AnimeStatus
): Promise<void> => {
  if (franchiseKey == null) return;

  // A single-member franchise is just the show itself. These two checks are
  // independent of each other, so run them together.
  const [{ count, error: countError }, existing] = await Promise.all([
    supabase
      .from("anime")
      .select("id", { count: "exact", head: true })
      .eq("franchise_key", franchiseKey),
    getUserFranchiseEntry(franchiseKey, userId),
  ]);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) < 2) return;
  if (existing) return;

  await addUserFranchiseEntry(franchiseKey, userId, status);
};

/**
 * Whether the write is itself a statement worth putting in the feed. Only
 * ever true for the detail-page list button, and only per-season entries can
 * post — the feed is per-anime.
 */
interface ListWriteOptions {
  announce?: boolean;
}

/**
 * Add a list slot to the user's list.
 *
 * Adding a season also seeds the series row for its franchise (see
 * `seedFranchiseEntry`), so the franchise lands on the profile rather than a
 * lone season. That seeding is best-effort: the season is already saved and
 * the user has been told so, and it never writes to the feed, so a failure
 * must not surface as a failed add.
 *
 * @param target the season or series being added
 * @param userId uuid of the user
 * @param status status to add it with (default: "not_started")
 * @param options `announce` to also post a status_update for a season
 * @returns the newly created ListEntry
 */
export const addListEntry = async (
  target: ListTarget,
  userId: string,
  status: AnimeStatus = "not_started",
  { announce = false }: ListWriteOptions = {}
): Promise<ListEntry> => {
  if (target.kind === "franchise") {
    const row = await addUserFranchiseEntry(
      target.franchise_key,
      userId,
      status
    );
    return toFranchiseListEntry(row);
  }

  const row = announce
    ? await addUserAnimeEntry(target.anime_id, userId, status)
    : await addUserAnimeEntryListOnly(target.anime_id, userId, status);

  try {
    await seedFranchiseEntry(row.anime?.franchise_key, userId, status);
  } catch (error) {
    // Mirrors how importBackboneMembers treats its own failures: the thing
    // the user asked for succeeded, and the series row fills in next time.
    console.error("Could not seed series entry for franchise:", error);
  }

  return toAnimeListEntry(row);
};

/**
 * Update a list entry's status, rating, or notes.
 *
 * @param entry the entry being edited
 * @param updates partial updates to apply
 * @param options `announce` to also post a status_update when a season's
 *   status actually changed
 * @returns the updated ListEntry
 */
export const updateListEntry = async (
  entry: ListEntry,
  updates: ListEntryUpdate,
  { announce = false }: ListWriteOptions = {}
): Promise<ListEntry> => {
  if (entry.kind === "franchise") {
    return toFranchiseListEntry(
      await updateUserFranchiseEntry(entry.id, updates)
    );
  }

  return toAnimeListEntry(
    announce
      ? await updateUserAnimeEntry(entry.id, updates)
      : await updateUserAnimeEntryFields(entry.id, updates)
  );
};

/**
 * Remove a list entry. For seasons this also deletes the auto-generated
 * status_update posts about that anime, so removing a show from your list
 * doesn't leave "started watching X" posts pointing at nothing.
 *
 * @param entry the entry being removed
 */
export const removeListEntry = async (entry: ListEntry): Promise<void> =>
  entry.kind === "franchise"
    ? removeUserFranchiseEntry(entry.id)
    : removeUserAnimeEntry(entry.id);
