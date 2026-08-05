/** src/constants/listSort.test.ts */
import { describe, expect, it } from "vitest";
import type { ProfileListCardModel } from "../utils/listEntries";
import { DEFAULT_SORT_KEY, SORT_OPTIONS, sortProfileCards } from "./listSort";

const card = (
  overrides: Partial<ProfileListCardModel> & { title: string }
): ProfileListCardModel => ({
  groupKey: overrides.title,
  franchiseKey: null,
  seasons: [],
  franchiseEntry: null,
  isFranchise: false,
  coverUrl: null,
  years: [],
  episodeCount: null,
  genres: null,
  status: "watching",
  rating: null,
  review: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  animeId: null,
  ...overrides,
});

const titles = (cards: ProfileListCardModel[]) => cards.map((c) => c.title);

describe("sortProfileCards", () => {
  it("returns a copy and leaves the input untouched", () => {
    const cards = [card({ title: "B" }), card({ title: "A" })];
    const sorted = sortProfileCards(cards, "title_az");

    expect(sorted).not.toBe(cards);
    expect(titles(cards)).toEqual(["B", "A"]);
    expect(titles(sorted)).toEqual(["A", "B"]);
  });

  it("sorts by title in both directions", () => {
    const cards = [
      card({ title: "B" }),
      card({ title: "C" }),
      card({ title: "A" }),
    ];

    expect(titles(sortProfileCards(cards, "title_az"))).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(titles(sortProfileCards(cards, "title_za"))).toEqual([
      "C",
      "B",
      "A",
    ]);
  });

  it("sorts by updated time in both directions", () => {
    const cards = [
      card({ title: "mid", updatedAt: "2026-02-01T00:00:00.000Z" }),
      card({ title: "new", updatedAt: "2026-03-01T00:00:00.000Z" }),
      card({ title: "old", updatedAt: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(titles(sortProfileCards(cards, "recent"))).toEqual([
      "new",
      "mid",
      "old",
    ]);
    expect(titles(sortProfileCards(cards, "oldest"))).toEqual([
      "old",
      "mid",
      "new",
    ]);
  });

  it("sorts by rating in both directions", () => {
    const cards = [
      card({ title: "five", rating: 5 }),
      card({ title: "nine", rating: 9 }),
      card({ title: "one", rating: 1 }),
    ];

    expect(titles(sortProfileCards(cards, "rating_hi"))).toEqual([
      "nine",
      "five",
      "one",
    ]);
    expect(titles(sortProfileCards(cards, "rating_lo"))).toEqual([
      "one",
      "five",
      "nine",
    ]);
  });

  it("sinks unrated cards to the bottom in BOTH rating directions", () => {
    // "Rating: low to high" should surface the worst thing you actually rated,
    // not everything you haven't got round to rating.
    const cards = [
      card({ title: "unrated", rating: null }),
      card({ title: "nine", rating: 9 }),
      card({ title: "one", rating: 1 }),
    ];

    expect(titles(sortProfileCards(cards, "rating_hi")).at(-1)).toBe("unrated");
    expect(titles(sortProfileCards(cards, "rating_lo")).at(-1)).toBe("unrated");
  });

  it("returns the copy unchanged for an unknown key", () => {
    const cards = [card({ title: "B" }), card({ title: "A" })];
    expect(titles(sortProfileCards(cards, "nonsense" as never))).toEqual([
      "B",
      "A",
    ]);
  });
});

describe("sort options", () => {
  it("offers every SortKey the comparator handles, and defaults to one of them", () => {
    expect(SORT_OPTIONS.map((o) => o.key)).toEqual([
      "recent",
      "oldest",
      "rating_hi",
      "rating_lo",
      "title_az",
      "title_za",
    ]);
    expect(SORT_OPTIONS.map((o) => o.key)).toContain(DEFAULT_SORT_KEY);
  });
});
