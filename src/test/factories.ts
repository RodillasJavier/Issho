/**
 * src/test/factories.ts
 *
 * Builders for the shapes tests need. Each takes a partial override so a test
 * states only the fields it actually cares about — the noise of a full
 * AniListMedia or Anime row is what makes hand-built fixtures unreadable.
 */
import type {
  AniListMedia,
  AniListRelationNode,
  MediaRelationType,
} from "../services/anilistApi";
import type {
  FranchiseInfo,
  ResolveContext,
} from "../services/anilistFranchise";
import type {
  Anime,
  Franchise,
  UserAnimeEntry,
  UserFranchiseEntry,
} from "../types/database.types";
import type { AnimeListEntry, FranchiseListEntry } from "../types/listEntry";

let seq = 0;
/** Distinct ids without every test having to invent them. */
const nextId = () => `id-${(seq += 1)}`;

const TIMESTAMP = "2026-01-01T00:00:00.000Z";

// #region AniList
export const makeRelationNode = (
  overrides: Partial<AniListRelationNode> & { id: number }
): AniListRelationNode => ({
  idMal: null,
  type: "ANIME",
  format: "TV",
  title: { romaji: `Anime ${overrides.id}`, english: null },
  ...overrides,
});

export const makeEdge = (
  relationType: MediaRelationType,
  node: Partial<AniListRelationNode> & { id: number }
): AniListMedia["relations"]["edges"][number] => ({
  relationType,
  node: makeRelationNode(node),
});

export const makeMedia = (
  overrides: Partial<AniListMedia> & { id: number }
): AniListMedia => ({
  idMal: null,
  type: "ANIME",
  format: "TV",
  title: { romaji: `Anime ${overrides.id}`, english: null, native: null },
  description: null,
  coverImage: { extraLarge: null, large: null },
  bannerImage: null,
  episodes: null,
  genres: [],
  status: null,
  seasonYear: null,
  startDate: { year: null },
  siteUrl: `https://anilist.co/anime/${overrides.id}`,
  isAdult: false,
  relations: { edges: [] },
  ...overrides,
});

/**
 * A resolve context pre-seeded with a whole relation graph.
 *
 * `resolveFranchiseKey` reads `mediaCache` before it ever fetches, so seeding
 * every node makes the algorithm run fully offline — no network stub needed.
 */
export const seededContext = (
  media: AniListMedia[],
  lookupKnown?: (anilistId: number) => Promise<FranchiseInfo | null>
): ResolveContext => ({
  cache: new Map(),
  mediaCache: new Map(media.map((m) => [m.id, m])),
  lookupKnown,
});
// #endregion AniList

// #region Anime rows
export const makeAnime = (overrides: Partial<Anime> = {}): Anime => ({
  id: nextId(),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  name: "Some Anime",
  name_japanese: null,
  description: null,
  episode_count: null,
  cover_image_url: null,
  year: null,
  external_id: null,
  genres: null,
  status: null,
  mal_url: null,
  anilist_id: null,
  mal_id: null,
  format: "TV",
  anilist_url: null,
  franchise_key: null,
  franchise_title: null,
  banner_image_url: null,
  ...overrides,
});

export const makeFranchise = (
  overrides: Partial<Franchise> & { anilist_root_id: number }
): Franchise => ({
  title: `Franchise ${overrides.anilist_root_id}`,
  display_title: `Franchise ${overrides.anilist_root_id}`,
  member_count: 2,
  first_year: null,
  last_year: null,
  cover_image_url: null,
  banner_image_url: null,
  ...overrides,
});
// #endregion Anime rows

// #region List entries
export const makeAnimeListEntry = (
  overrides: Partial<AnimeListEntry> = {}
): AnimeListEntry => ({
  kind: "anime",
  id: nextId(),
  user_id: "user-1",
  anime_id: nextId(),
  status: "watching",
  rating: null,
  review: null,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  ...overrides,
});

export const makeFranchiseListEntry = (
  overrides: Partial<FranchiseListEntry> & { franchise_key: number }
): FranchiseListEntry => ({
  kind: "franchise",
  id: nextId(),
  user_id: "user-1",
  status: "watching",
  rating: null,
  review: null,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  ...overrides,
});

/** The raw table rows, for testing the `toXListEntry` converters. */
export const makeUserAnimeRow = (
  overrides: Partial<UserAnimeEntry> = {}
): UserAnimeEntry => ({
  id: nextId(),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  user_id: "user-1",
  anime_id: nextId(),
  status: "watching",
  rating: null,
  review: null,
  ...overrides,
});

export const makeUserFranchiseRow = (
  overrides: Partial<UserFranchiseEntry> & { franchise_key: number }
): UserFranchiseEntry => ({
  id: nextId(),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  user_id: "user-1",
  status: "watching",
  rating: null,
  review: null,
  ...overrides,
});
// #endregion List entries
