/**
 * src/utils/listEntries.test.ts
 *
 * The profile page renders exactly what buildProfileListCards returns, so the
 * `isFranchise` predicate here decides whether a user sees "one show" or "a
 * series" — and it fans out into nearly every other field on the card.
 */
import { describe, expect, it } from "vitest";
import {
  makeAnime,
  makeAnimeListEntry,
  makeFranchise,
  makeFranchiseListEntry,
} from "../test/factories";
import type { AnimeStatus } from "../types/database.types";
import {
  buildProfileListCards,
  deriveSeriesStatus,
  franchiseKeysNeedingMembers,
} from "./listEntries";

const ALL_STATUSES: AnimeStatus[] = [
  "not_started",
  "watching",
  "completed",
  "dropped",
];

describe("deriveSeriesStatus", () => {
  it.each([
    { statuses: [], expected: "not_started", why: "nothing tracked" },
    { statuses: ["watching"], expected: "watching", why: "mid-way" },
    { statuses: ["not_started"], expected: "not_started", why: "untouched" },
    { statuses: ["dropped"], expected: "dropped", why: "abandoned" },
    {
      statuses: ["dropped", "dropped"],
      expected: "dropped",
      why: "every season dropped",
    },
    {
      statuses: ["dropped", "not_started"],
      expected: "not_started",
      why: "not uniformly dropped",
    },
    {
      statuses: ["completed", "not_started"],
      expected: "watching",
      why: "partway through the series",
    },
  ] satisfies {
    statuses: AnimeStatus[];
    expected: AnimeStatus;
    why: string;
  }[])("$why -> $expected", ({ statuses, expected }) => {
    expect(deriveSeriesStatus(statuses)).toBe(expected);
  });

  // The load-bearing rule: finishing every season you track says nothing about
  // whether the show itself is over, so this must never assert "completed".
  it("never infers completed, whatever the seasons say", () => {
    const combos: AnimeStatus[][] = [
      ["completed"],
      ["completed", "completed"],
      ["completed", "completed", "completed"],
      ...ALL_STATUSES.map((s): AnimeStatus[] => ["completed", s]),
    ];

    for (const statuses of combos) {
      expect(deriveSeriesStatus(statuses)).not.toBe("completed");
    }
  });

  it("caps an all-completed series at watching", () => {
    expect(deriveSeriesStatus(["completed", "completed"])).toBe("watching");
  });
});

describe("buildProfileListCards — the isFranchise predicate", () => {
  const seasonOf = (key: number | null, overrides = {}) =>
    makeAnimeListEntry({
      anime: makeAnime({
        franchise_key: key,
        franchise_title: key != null ? "The Series" : null,
        name: "Season One",
        anilist_id: 1,
      }),
      ...overrides,
    });

  it("treats a lone season with no series row as a standalone show", () => {
    const [card] = buildProfileListCards([seasonOf(10)]);

    expect(card.isFranchise).toBe(false);
    expect(card.title).toBe("Season One");
    expect(card.animeId).not.toBeNull();
  });

  it("treats two seasons of one franchise as a series", () => {
    const cards = buildProfileListCards([
      seasonOf(10),
      makeAnimeListEntry({
        anime: makeAnime({
          franchise_key: 10,
          franchise_title: "The Series",
          name: "Season Two",
          anilist_id: 2,
        }),
      }),
    ]);

    expect(cards).toHaveLength(1);
    expect(cards[0].isFranchise).toBe(true);
    expect(cards[0].animeId).toBeNull();
  });

  it("treats a single season as a series once a series row exists", () => {
    const [card] = buildProfileListCards([
      seasonOf(10),
      makeFranchiseListEntry({ franchise_key: 10, status: "completed" }),
    ]);

    expect(card.isFranchise).toBe(true);
    expect(card.status).toBe("completed");
  });

  it("stays standalone when the anime has no franchise key at all", () => {
    const [card] = buildProfileListCards([
      seasonOf(null),
      seasonOf(null, {
        anime: makeAnime({ franchise_key: null, name: "Other" }),
      }),
    ]);

    expect(card.isFranchise).toBe(false);
  });
});

describe("buildProfileListCards — field derivation", () => {
  const twoSeasons = () => [
    makeAnimeListEntry({
      status: "completed",
      rating: 9,
      review: "season one notes",
      updated_at: "2026-01-01T00:00:00.000Z",
      anime: makeAnime({
        franchise_key: 10,
        franchise_title: "The Series",
        anilist_id: 10,
        name: "Season One",
        cover_image_url: "root.jpg",
        year: 2013,
        episode_count: 25,
        genres: "Action, Drama",
      }),
    }),
    makeAnimeListEntry({
      status: "watching",
      rating: 7,
      updated_at: "2026-03-01T00:00:00.000Z",
      anime: makeAnime({
        franchise_key: 10,
        franchise_title: "The Series",
        anilist_id: 11,
        name: "Season Two",
        cover_image_url: "s2.jpg",
        year: 2016,
      }),
    }),
  ];

  it("derives status for a series but never a rating", () => {
    // The documented asymmetry: an inferred "watching" is a reasonable
    // summary, an inferred score is a claim the user never made.
    const [card] = buildProfileListCards(twoSeasons());

    expect(card.status).toBe("watching");
    expect(card.rating).toBeNull();
    expect(card.review).toBeNull();
  });

  it("lets the series row override the derived status and supply a rating", () => {
    const [card] = buildProfileListCards([
      ...twoSeasons(),
      makeFranchiseListEntry({
        franchise_key: 10,
        status: "dropped",
        rating: 4,
        review: "series notes",
        updated_at: "2026-06-01T00:00:00.000Z",
      }),
    ]);

    expect(card.status).toBe("dropped");
    expect(card.rating).toBe(4);
    expect(card.review).toBe("series notes");
    expect(card.updatedAt).toBe("2026-06-01T00:00:00.000Z");
  });

  it("uses the newest season timestamp for a series with no series row", () => {
    const [card] = buildProfileListCards(twoSeasons());
    expect(card.updatedAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("takes cover art from the chain root, not the lead season", () => {
    const [card] = buildProfileListCards(twoSeasons());
    expect(card.coverUrl).toBe("root.jpg");
  });

  it("suppresses per-show fields on a series card", () => {
    const [card] = buildProfileListCards(twoSeasons());

    expect(card.episodeCount).toBeNull();
    expect(card.genres).toBeNull();
    expect(card.animeId).toBeNull();
  });

  it("keeps per-show fields on a standalone card", () => {
    const [card] = buildProfileListCards([
      makeAnimeListEntry({
        status: "watching",
        rating: 8,
        review: "notes",
        anime: makeAnime({
          name: "Solo Movie",
          episode_count: 1,
          genres: "Drama",
          cover_image_url: "solo.jpg",
          year: 2020,
        }),
      }),
    ]);

    expect(card.episodeCount).toBe(1);
    expect(card.genres).toBe("Drama");
    expect(card.rating).toBe(8);
    expect(card.review).toBe("notes");
    expect(card.coverUrl).toBe("solo.jpg");
    expect(card.years).toEqual([2020]);
  });
});

describe("buildProfileListCards — series tracked with no seasons", () => {
  it("renders a card from the franchises view", () => {
    const [card] = buildProfileListCards(
      [makeFranchiseListEntry({ franchise_key: 42, status: "watching" })],
      [
        makeFranchise({
          anilist_root_id: 42,
          title: "Root OVA",
          display_title: "The Real Title",
          cover_image_url: "art.jpg",
          first_year: 2013,
          last_year: 2023,
        }),
      ]
    );

    expect(card.isFranchise).toBe(true);
    expect(card.title).toBe("The Real Title");
    expect(card.coverUrl).toBe("art.jpg");
    expect(card.years).toEqual([2013, 2023]);
    expect(card.seasons).toEqual([]);
  });

  it("falls back to the root title, then a placeholder", () => {
    const [withRoot] = buildProfileListCards(
      [makeFranchiseListEntry({ franchise_key: 42 })],
      [makeFranchise({ anilist_root_id: 42, display_title: null })]
    );
    expect(withRoot.title).toBe("Franchise 42");

    const [unknown] = buildProfileListCards([
      makeFranchiseListEntry({ franchise_key: 99 }),
    ]);
    expect(unknown.title).toBe("Unknown Series");
  });

  it("does not double-count a series that also has seasons listed", () => {
    const cards = buildProfileListCards([
      makeAnimeListEntry({
        anime: makeAnime({ franchise_key: 42, anilist_id: 1 }),
      }),
      makeFranchiseListEntry({ franchise_key: 42 }),
    ]);

    expect(cards).toHaveLength(1);
  });
});

describe("franchiseKeysNeedingMembers", () => {
  it("returns only series-level keys with no season covering them", () => {
    const keys = franchiseKeysNeedingMembers([
      makeAnimeListEntry({ anime: makeAnime({ franchise_key: 10 }) }),
      makeFranchiseListEntry({ franchise_key: 10 }),
      makeFranchiseListEntry({ franchise_key: 20 }),
    ]);

    expect(keys).toEqual([20]);
  });

  it("ignores seasons whose anime is missing or unkeyed", () => {
    const keys = franchiseKeysNeedingMembers([
      makeAnimeListEntry({ anime: undefined }),
      makeAnimeListEntry({ anime: makeAnime({ franchise_key: null }) }),
      makeFranchiseListEntry({ franchise_key: 30 }),
    ]);

    expect(keys).toEqual([30]);
  });

  it("returns nothing when every tracked series has a season listed", () => {
    expect(
      franchiseKeysNeedingMembers([
        makeAnimeListEntry({ anime: makeAnime({ franchise_key: 10 }) }),
        makeFranchiseListEntry({ franchise_key: 10 }),
      ])
    ).toEqual([]);
  });
});
