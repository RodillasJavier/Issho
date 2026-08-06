/**
 * src/api/animeMapping.test.ts
 *
 * Every field here is a fallback chain feeding a NOT NULL or externally-keyed
 * column, and the backfill script shares this mapper — so a regression lands
 * in the database rather than on screen.
 */
import { describe, expect, it } from "vitest";
import { makeMedia } from "../test/factories";
import { mapAniListToAnime } from "./animeMapping";

describe("mapAniListToAnime — titles and keys", () => {
  it("prefers the English title and keeps the native one alongside", () => {
    const row = mapAniListToAnime(
      makeMedia({
        id: 1,
        title: { english: "English", romaji: "Romaji", native: "ネイティブ" },
      })
    );

    expect(row.name).toBe("English");
    expect(row.name_japanese).toBe("ネイティブ");
  });

  it("falls back to romaji, then to the bare id", () => {
    expect(
      mapAniListToAnime(
        makeMedia({
          id: 2,
          title: { english: null, romaji: "Romaji", native: null },
        })
      ).name
    ).toBe("Romaji");

    expect(
      mapAniListToAnime(
        makeMedia({
          id: 3,
          title: { english: null, romaji: null, native: null },
        })
      ).name
    ).toBe("3");
  });

  it("carries both external keys and builds a MAL url only when there's a MAL id", () => {
    const withMal = mapAniListToAnime(makeMedia({ id: 10, idMal: 99 }));
    expect(withMal.anilist_id).toBe(10);
    expect(withMal.mal_id).toBe(99);
    expect(withMal.mal_url).toBe("https://myanimelist.net/anime/99");

    const withoutMal = mapAniListToAnime(makeMedia({ id: 10, idMal: null }));
    expect(withoutMal.mal_url).toBeNull();
  });
});

describe("mapAniListToAnime — nullable fallbacks", () => {
  it("empties a null description, since the column is NOT NULL", () => {
    expect(
      mapAniListToAnime(makeMedia({ id: 1, description: null })).description
    ).toBe("");
  });

  it("prefers the larger cover image", () => {
    expect(
      mapAniListToAnime(
        makeMedia({
          id: 1,
          coverImage: { extraLarge: "xl.jpg", large: "l.jpg" },
        })
      ).cover_image_url
    ).toBe("xl.jpg");

    expect(
      mapAniListToAnime(
        makeMedia({ id: 1, coverImage: { extraLarge: null, large: "l.jpg" } })
      ).cover_image_url
    ).toBe("l.jpg");
  });

  it("falls back from seasonYear to the start date's year", () => {
    expect(
      mapAniListToAnime(
        makeMedia({ id: 1, seasonYear: 2016, startDate: { year: 2015 } })
      ).year
    ).toBe(2016);

    expect(
      mapAniListToAnime(
        makeMedia({ id: 1, seasonYear: null, startDate: { year: 2015 } })
      ).year
    ).toBe(2015);
  });

  it("joins genres, or stores null when there are none", () => {
    expect(
      mapAniListToAnime(makeMedia({ id: 1, genres: ["Action", "Drama"] }))
        .genres
    ).toBe("Action, Drama");
    expect(
      mapAniListToAnime(makeMedia({ id: 1, genres: [] })).genres
    ).toBeNull();
  });
});

describe("mapAniListToAnime — status mapping", () => {
  it.each([
    ["FINISHED", "Finished Airing"],
    ["RELEASING", "Currently Airing"],
    ["NOT_YET_RELEASED", "Not Yet Aired"],
    ["CANCELLED", "Cancelled"],
    ["HIATUS", "On Hiatus"],
  ])("maps %s to %s", (anilistStatus, expected) => {
    expect(
      mapAniListToAnime(makeMedia({ id: 1, status: anilistStatus })).status
    ).toBe(expected);
  });

  it("passes an unrecognized status through rather than dropping it", () => {
    expect(
      mapAniListToAnime(makeMedia({ id: 1, status: "SOMETHING_NEW" })).status
    ).toBe("SOMETHING_NEW");
  });

  it("stores null when AniList has no status", () => {
    expect(
      mapAniListToAnime(makeMedia({ id: 1, status: null })).status
    ).toBeNull();
  });
});

describe("mapAniListToAnime — franchise", () => {
  it("denormalizes the resolved franchise key and title", () => {
    const row = mapAniListToAnime(makeMedia({ id: 1 }), {
      key: 100,
      title: "The Series",
    });

    expect(row.franchise_key).toBe(100);
    expect(row.franchise_title).toBe("The Series");
  });

  it("nulls both when the franchise is unresolved", () => {
    const row = mapAniListToAnime(makeMedia({ id: 1 }));
    expect(row.franchise_key).toBeNull();
    expect(row.franchise_title).toBeNull();
  });
});

describe("description stripping", () => {
  /** stripHtml is private; it only runs via the description field. */
  const strip = (description: string) =>
    mapAniListToAnime(makeMedia({ id: 1, description })).description;

  it("turns line breaks into newlines and drops the remaining tags", () => {
    expect(strip("One<br>Two<br />Three")).toBe("One\nTwo\nThree");
    expect(strip("<i>Italic</i> and <b>bold</b>")).toBe("Italic and bold");
  });

  it("unescapes the entities AniList emits", () => {
    expect(strip("Tom &amp; Jerry")).toBe("Tom & Jerry");
    expect(strip("&lt;tag&gt;")).toBe("<tag>");
    expect(strip("&quot;quoted&quot;")).toBe('"quoted"');
  });

  it("handles both apostrophe encodings", () => {
    // AniList emits &#39; and &#039; interchangeably.
    expect(strip("it&#39;s")).toBe("it's");
    expect(strip("it&#039;s")).toBe("it's");
  });

  it("collapses runs of blank lines and trims the result", () => {
    expect(strip("  A<br><br><br><br>B  ")).toBe("A\n\nB");
  });
});
