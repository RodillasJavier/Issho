/** src/utils/franchise.test.ts */
import { describe, expect, it } from "vitest";
import { makeAnime, makeAnimeListEntry } from "../test/factories";
import {
  franchiseDisplayTitle,
  franchiseRootMember,
  groupAnimeByFranchise,
  groupUserEntriesByFranchise,
  yearRangeLabel,
} from "./franchise";

describe("franchiseDisplayTitle", () => {
  it("prefers the earliest TV member over the chain root", () => {
    // The root is often an OVA — a stable key but a poor headline.
    const title = franchiseDisplayTitle([
      makeAnime({ name: "No Regrets", format: "OVA" }),
      makeAnime({ name: "Attack on Titan", format: "TV" }),
    ]);

    expect(title).toBe("Attack on Titan");
  });

  it("falls back to the first member when none is TV", () => {
    expect(
      franchiseDisplayTitle([
        makeAnime({ name: "The Movie", format: "MOVIE" }),
        makeAnime({ name: "The Special", format: "SPECIAL" }),
      ])
    ).toBe("The Movie");
  });

  it("skips missing members and returns null when none remain", () => {
    expect(
      franchiseDisplayTitle([undefined, makeAnime({ name: "Real" })])
    ).toBe("Real");
    expect(franchiseDisplayTitle([undefined, undefined])).toBeNull();
    expect(franchiseDisplayTitle([])).toBeNull();
  });
});

describe("franchiseRootMember", () => {
  it("finds the member whose anilist_id is the franchise key", () => {
    const root = makeAnime({ anilist_id: 100, name: "Root" });
    const other = makeAnime({ anilist_id: 101, name: "Sequel" });

    expect(franchiseRootMember([other, root], 100)).toBe(root);
  });

  it("falls back to the first member when the root isn't present locally", () => {
    const first = makeAnime({ anilist_id: 101 });
    expect(franchiseRootMember([first], 100)).toBe(first);
    expect(franchiseRootMember([first], null)).toBe(first);
  });

  it("returns undefined for an empty member list", () => {
    expect(franchiseRootMember([], 100)).toBeUndefined();
  });
});

describe("yearRangeLabel", () => {
  it("renders a single year alone", () => {
    expect(yearRangeLabel([2013])).toBe("2013");
    expect(yearRangeLabel([2013, 2013])).toBe("2013");
  });

  it("renders a span with an en dash", () => {
    // U+2013, not a hyphen — pinned because it's invisible in review.
    expect(yearRangeLabel([2016, 2013, 2023])).toBe("2013–2023");
  });

  it("returns null with no known years", () => {
    expect(yearRangeLabel([])).toBeNull();
  });
});

describe("groupAnimeByFranchise", () => {
  it("groups members sharing a franchise key", () => {
    const groups = groupAnimeByFranchise([
      makeAnime({ franchise_key: 10, anilist_id: 1, name: "S1", year: 2013 }),
      makeAnime({ franchise_key: 10, anilist_id: 2, name: "S2", year: 2016 }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupKey).toBe("f:10");
    expect(groups[0].franchiseKey).toBe(10);
    expect(groups[0].members).toHaveLength(2);
  });

  it("keys on anilist_id when there is no franchise key", () => {
    const groups = groupAnimeByFranchise([
      makeAnime({ franchise_key: null, anilist_id: 55 }),
    ]);

    expect(groups[0].groupKey).toBe("a:55");
    expect(groups[0].franchiseKey).toBeNull();
  });

  it("falls back to the row uuid for legacy rows with neither", () => {
    const legacy = makeAnime({ franchise_key: null, anilist_id: null });
    const groups = groupAnimeByFranchise([legacy]);

    expect(groups[0].groupKey).toBe(legacy.id);
  });

  it("keeps unrelated rows as separate singleton groups", () => {
    const groups = groupAnimeByFranchise([
      makeAnime({ franchise_key: null, anilist_id: 1 }),
      makeAnime({ franchise_key: null, anilist_id: 2 }),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("preserves first-appearance order across groups", () => {
    const groups = groupAnimeByFranchise([
      makeAnime({ franchise_key: 20, anilist_id: 1 }),
      makeAnime({ franchise_key: 10, anilist_id: 2 }),
      makeAnime({ franchise_key: 20, anilist_id: 3 }),
    ]);

    expect(groups.map((g) => g.groupKey)).toEqual(["f:20", "f:10"]);
  });

  it("sorts members by year within a group", () => {
    const groups = groupAnimeByFranchise([
      makeAnime({ franchise_key: 10, anilist_id: 3, name: "C", year: 2020 }),
      makeAnime({ franchise_key: 10, anilist_id: 1, name: "A", year: 2013 }),
      makeAnime({ franchise_key: 10, anilist_id: 2, name: "B", year: 2016 }),
    ]);

    expect(groups[0].members.map((m) => m.name)).toEqual(["A", "B", "C"]);
  });

  it("sorts year-less members last via the 9999 sentinel", () => {
    const groups = groupAnimeByFranchise([
      makeAnime({
        franchise_key: 10,
        anilist_id: 1,
        name: "Undated",
        year: null,
      }),
      makeAnime({
        franchise_key: 10,
        anilist_id: 2,
        name: "Dated",
        year: 2013,
      }),
    ]);

    expect(groups[0].members.map((m) => m.name)).toEqual(["Dated", "Undated"]);
  });

  it("breaks a year tie by name length, then alphabetically", () => {
    const groups = groupAnimeByFranchise([
      makeAnime({
        franchise_key: 10,
        anilist_id: 1,
        name: "Long Title",
        year: 2013,
      }),
      makeAnime({
        franchise_key: 10,
        anilist_id: 2,
        name: "Short",
        year: 2013,
      }),
      makeAnime({
        franchise_key: 10,
        anilist_id: 3,
        name: "Shore",
        year: 2013,
      }),
    ]);

    expect(groups[0].members.map((m) => m.name)).toEqual([
      "Shore",
      "Short",
      "Long Title",
    ]);
  });
});

describe("groupUserEntriesByFranchise", () => {
  it("groups a user's seasons and titles the group by its earliest TV member", () => {
    const groups = groupUserEntriesByFranchise([
      makeAnimeListEntry({
        anime: makeAnime({
          franchise_key: 10,
          anilist_id: 2,
          name: "Season Two",
          year: 2016,
        }),
      }),
      makeAnimeListEntry({
        anime: makeAnime({
          franchise_key: 10,
          anilist_id: 1,
          name: "Season One",
          year: 2013,
        }),
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Season One");
    expect(groups[0].entries).toHaveLength(2);
  });

  it("keys an entry with no joined anime on its anime_id", () => {
    const entry = makeAnimeListEntry({ anime: undefined });
    const groups = groupUserEntriesByFranchise([entry]);

    expect(groups[0].groupKey).toBe(entry.anime_id);
    expect(groups[0].franchiseKey).toBeNull();
    expect(groups[0].title).toBe("Unknown Anime");
  });

  it("keeps the stored franchise title when no member supplies a better one", () => {
    const groups = groupUserEntriesByFranchise([
      makeAnimeListEntry({ anime: undefined }),
    ]);

    // franchiseDisplayTitle returns null here, so the fallback title stands.
    expect(groups[0].title).toBe("Unknown Anime");
  });
});
