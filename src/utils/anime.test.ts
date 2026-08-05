/** src/utils/anime.test.ts */
import { describe, expect, it } from "vitest";
import { splitGenres } from "./anime";

describe("splitGenres", () => {
  it("splits a comma-separated list and trims each entry", () => {
    expect(splitGenres("Action, Comedy,Fantasy")).toEqual([
      "Action",
      "Comedy",
      "Fantasy",
    ]);
  });

  it("drops empty segments left by stray or trailing commas", () => {
    expect(splitGenres("Action,,Comedy,")).toEqual(["Action", "Comedy"]);
  });

  it("returns an empty array for null, undefined, and empty input", () => {
    expect(splitGenres(null)).toEqual([]);
    expect(splitGenres(undefined)).toEqual([]);
    expect(splitGenres("")).toEqual([]);
    expect(splitGenres("   ")).toEqual([]);
  });
});
