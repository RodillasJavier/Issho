/**
 * src/services/jikanApi.ts
 *
 * Client for interacting with the Jikan API (unofficial MyAnimeList API).
 * Documentation: https://docs.api.jikan.moe/
 */
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";
const RATE_LIMIT_DELAY = 1000; // Jikan has a rate limit of 3 requests per second, we'll be conservative

let lastRequestTime = 0;

// #region Types
export interface JikanAnime {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  trailer: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
  };
  approved: boolean;
  titles: Array<{
    type: string;
    title: string;
  }>;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  aired: {
    from: string | null;
    to: string | null;
    prop: {
      from: { day: number | null; month: number | null; year: number | null };
      to: { day: number | null; month: number | null; year: number | null };
    };
    string: string | null;
  };
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
  producers: Array<{ mal_id: number; type: string; name: string; url: string }>;
  licensors: Array<{ mal_id: number; type: string; name: string; url: string }>;
  studios: Array<{ mal_id: number; type: string; name: string; url: string }>;
  genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
  themes: Array<{ mal_id: number; type: string; name: string; url: string }>;
  demographics: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
}

export interface JikanSearchResponse {
  data: JikanAnime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

export interface JikanAnimeResponse {
  data: JikanAnime;
}
// #endregion Types

// #region Rate Limiting

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
 * Fetch wrapper with rate limiting
 *
 * @param endpoint API endpoint to fetch
 * @returns Promise resolving to the fetched data
 */
const jikanFetch = async <T>(endpoint: string): Promise<T> => {
  await rateLimit();
  const response = await fetch(`${JIKAN_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `Jikan API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
};

// #endregion Rate Limiting

// #region API Functions

/**
 * Search for anime by query string
 * https://docs.api.jikan.moe/#/anime/getanimesearch
 *
 * @param query - Search term
 * @param page - Page number (optional)
 * @param limit - Results per page (optional, max 25)
 * @returns Promise resolving to search results
 */
export const searchAnime = async (
  query: string,
  page: number = 1,
  limit: number = 10
): Promise<JikanSearchResponse> => {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: Math.min(limit, 25).toString(), // Jikan max is 25
    order_by: "popularity",
    sort: "asc",
    sfw: "true",
  });

  return jikanFetch<JikanSearchResponse>(`/anime?${params.toString()}`);
};

/**
 * Get anime details by MyAnimeList ID
 *
 * @param malId - MyAnimeList ID
 * @returns Promise resolving to anime details
 */
export const getAnimeById = async (malId: number): Promise<JikanAnime> => {
  const response = await jikanFetch<JikanAnimeResponse>(`/anime/${malId}`);
  return response.data;
};

/**
 * Get seasonal anime (current season)
 *
 * @param year - Year
 * @param season - Season (winter, spring, summer, fall)
 * @returns Promise resolving to seasonal anime
 */
export const getSeasonalAnime = async (
  year: number,
  season: "winter" | "spring" | "summer" | "fall"
): Promise<JikanSearchResponse> => {
  return jikanFetch<JikanSearchResponse>(`/seasons/${year}/${season}`);
};

/**
 * Get top anime
 *
 * @param page - Page number (optional)
 * @param limit - Results per page (optional, max 25)
 * @returns Promise resolving to top anime
 */
export const getTopAnime = async (
  page: number = 1,
  limit: number = 10
): Promise<JikanSearchResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: Math.min(limit, 25).toString(),
  });

  return jikanFetch<JikanSearchResponse>(`/top/anime?${params.toString()}`);
};

// #endregion API Functions
