/**
 * src/services/anilistApi.ts
 *
 * Client for interacting with the AniList GraphQL API.
 * Documentation: https://docs.anilist.co/
 */
const ANILIST_ENDPOINT = "https://graphql.anilist.co";
// AniList allows 90 req/min plus a burst limiter; ~50/min sustained is the safe rate
const RATE_LIMIT_DELAY = 1200;

let lastRequestTime = 0;

// #region Types
export type MediaRelationType =
  | "ADAPTATION"
  | "PREQUEL"
  | "SEQUEL"
  | "PARENT"
  | "SIDE_STORY"
  | "CHARACTER"
  | "SUMMARY"
  | "ALTERNATIVE"
  | "SPIN_OFF"
  | "OTHER"
  | "SOURCE"
  | "COMPILATION"
  | "CONTAINS";

export interface AniListRelationNode {
  id: number;
  idMal: number | null;
  type: string;
  format: string | null;
  title: {
    romaji: string | null;
    english: string | null;
  };
}

export interface AniListMedia {
  id: number;
  idMal: number | null;
  type: string;
  format: string | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
  };
  bannerImage: string | null;
  episodes: number | null;
  genres: string[];
  status: string | null;
  seasonYear: number | null;
  startDate: { year: number | null };
  siteUrl: string;
  isAdult: boolean;
  relations: {
    edges: Array<{
      relationType: MediaRelationType;
      node: AniListRelationNode;
    }>;
  };
}

/** AniList returned 403 — the API is temporarily disabled under load */
export class AniListDisabledError extends Error {
  constructor() {
    super("AniList API is temporarily unavailable");
    this.name = "AniListDisabledError";
  }
}

/** AniList returned 429 — retry after `retryAfterSec` seconds */
export class AniListRateLimitError extends Error {
  retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super("AniList rate limit reached");
    this.name = "AniListRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}
// #endregion Types

// #region Queries
const CORE_FRAGMENT = `
fragment Core on Media {
  id
  idMal
  type
  format
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large }
  bannerImage
  episodes
  genres
  status
  seasonYear
  startDate { year }
  siteUrl
  isAdult
  relations {
    edges {
      relationType
      node { id idMal type format title { romaji english } }
    }
  }
}`;

const BY_ID_QUERY = `
query ById($id: Int) { Media(id: $id, type: ANIME) { ...Core } }
${CORE_FRAGMENT}`;

const BY_MAL_QUERY = `
query ByMal($malId: Int) { Media(idMal: $malId, type: ANIME) { ...Core } }
${CORE_FRAGMENT}`;

const SEARCH_QUERY = `
query Search($search: String, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
      ...Core
    }
  }
}
${CORE_FRAGMENT}`;
// #endregion Queries

// #region Fetch Helpers

/**
 * Helper to respect rate limiting
 */
const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
};

/**
 * POST a GraphQL query to AniList with rate limiting
 *
 * @param query GraphQL query string
 * @param variables Query variables
 * @returns Promise resolving to the `data` payload
 */
export const anilist = async <T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> => {
  await rateLimit();
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 429) {
    const retry = Number(response.headers.get("Retry-After") ?? "60");
    throw new AniListRateLimitError(retry);
  }
  if (response.status === 403) {
    throw new AniListDisabledError();
  }
  // A missing entry comes back as HTTP 404 with a "Not Found." GraphQL error
  // and a null Media in `data` — surface that as data, not as a failure
  if (!response.ok && response.status !== 404) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.data) {
    return json.data;
  }
  if (json.errors?.length) {
    throw new Error(`AniList GraphQL: ${json.errors[0].message}`);
  }
  throw new Error("AniList returned an empty response");
};

/**
 * Retry wrapper: sleeps out rate limits and retries.
 * AniListDisabledError (403 outage) is NOT retried — it bubbles to the caller.
 */
export const withRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof AniListRateLimitError) {
        await new Promise((resolve) =>
          setTimeout(resolve, e.retryAfterSec * 1000)
        );
        continue;
      }
      throw e;
    }
  }
};

// #endregion Fetch Helpers

// #region API Functions

/**
 * Search for anime by query string (adult content excluded)
 *
 * @param query - Search term
 * @param perPage - Results to return (default 10)
 * @returns Promise resolving to matching media
 */
export const searchAnime = async (
  query: string,
  perPage: number = 10
): Promise<AniListMedia[]> => {
  const data = await anilist<{ Page: { media: AniListMedia[] } }>(
    SEARCH_QUERY,
    { search: query, perPage }
  );
  return data.Page.media;
};

/**
 * Get anime details by AniList ID
 *
 * @param anilistId - AniList media ID
 * @returns Promise resolving to the media, or null if not found
 */
export const getAnimeById = async (
  anilistId: number
): Promise<AniListMedia | null> => {
  const data = await anilist<{ Media: AniListMedia | null }>(BY_ID_QUERY, {
    id: anilistId,
  });
  return data.Media;
};

/**
 * Get anime details by MyAnimeList ID (for migrating legacy rows)
 *
 * @param malId - MyAnimeList ID
 * @returns Promise resolving to the media, or null if AniList has no counterpart
 */
export const getAnimeByMalId = async (
  malId: number
): Promise<AniListMedia | null> => {
  const data = await anilist<{ Media: AniListMedia | null }>(BY_MAL_QUERY, {
    malId,
  });
  return data.Media;
};

// #endregion API Functions
