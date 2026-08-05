/**
 * src/services/anilistFranchise.test.ts
 *
 * The franchise-key algorithm decides which seasons the UI treats as one show.
 * When it's wrong the app doesn't break — it just quietly groups things
 * badly — so these tests pin the exact edges it follows and refuses to.
 *
 * Every case seeds the whole relation graph into `mediaCache`, which
 * `fetchMedia` consults before reaching for the network. `anilistApi` is also
 * mocked so any node a test forgets to seed fails loudly instead of trying to
 * hit AniList.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeEdge, makeMedia, seededContext } from "../test/factories";
import {
  collectBackbone,
  createResolveContext,
  resolveFranchiseKey,
} from "./anilistFranchise";

vi.mock("./anilistApi", () => ({
  getAnimeById: vi.fn(async (id: number) => {
    throw new Error(`unexpected network fetch for media ${id}`);
  }),
  withRetry: vi.fn((fn: () => unknown) => fn()),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveFranchiseKey — backbone walk", () => {
  it("walks PREQUEL edges to the head of the chain", async () => {
    // s3 -> s2 -> s1, so every season keys on s1.
    const s1 = makeMedia({
      id: 1,
      title: { romaji: "Show", english: "Show", native: null },
      relations: { edges: [makeEdge("SEQUEL", { id: 2 })] },
    });
    const s2 = makeMedia({
      id: 2,
      relations: {
        edges: [makeEdge("PREQUEL", { id: 1 }), makeEdge("SEQUEL", { id: 3 })],
      },
    });
    const s3 = makeMedia({
      id: 3,
      relations: { edges: [makeEdge("PREQUEL", { id: 2 })] },
    });

    const ctx = seededContext([s1, s2, s3]);
    await expect(resolveFranchiseKey(s3, ctx)).resolves.toEqual({
      key: 1,
      title: "Show",
    });
  });

  it("keys a show with no prequel on itself", async () => {
    const solo = makeMedia({ id: 7 });
    await expect(
      resolveFranchiseKey(solo, seededContext([solo]))
    ).resolves.toEqual({ key: 7, title: "Anime 7" });
  });

  it("stops at a cycle instead of looping forever", async () => {
    // Some franchises really do carry bidirectional PREQUEL edges.
    const a = makeMedia({
      id: 10,
      relations: { edges: [makeEdge("PREQUEL", { id: 11 })] },
    });
    const b = makeMedia({
      id: 11,
      relations: { edges: [makeEdge("PREQUEL", { id: 10 })] },
    });

    await expect(
      resolveFranchiseKey(a, seededContext([a, b]))
    ).resolves.toEqual({ key: 11, title: "Anime 11" });
  });

  it("ignores prequel edges that aren't narrative anime", async () => {
    // A manga source and a MUSIC video are both real PREQUEL-adjacent noise.
    const media = makeMedia({
      id: 20,
      relations: {
        edges: [
          makeEdge("PREQUEL", { id: 21, type: "MANGA", format: "MANGA" }),
          makeEdge("PREQUEL", { id: 22, format: "MUSIC" }),
        ],
      },
    });

    await expect(
      resolveFranchiseKey(media, seededContext([media]))
    ).resolves.toEqual({ key: 20, title: "Anime 20" });
  });

  it("never follows ALTERNATIVE — retellings stay separate franchises", async () => {
    const retelling = makeMedia({
      id: 30,
      relations: { edges: [makeEdge("ALTERNATIVE", { id: 31 })] },
    });

    await expect(
      resolveFranchiseKey(retelling, seededContext([retelling]))
    ).resolves.toEqual({ key: 30, title: "Anime 30" });
  });

  it("prefers the English title, falling back to romaji then the bare id", async () => {
    const english = makeMedia({
      id: 40,
      title: { english: "English", romaji: "Romaji", native: null },
    });
    const romajiOnly = makeMedia({
      id: 41,
      title: { english: null, romaji: "Romaji", native: null },
    });
    const untitled = makeMedia({
      id: 42,
      title: { english: null, romaji: null, native: null },
    });

    await expect(
      resolveFranchiseKey(english, seededContext([english]))
    ).resolves.toEqual({ key: 40, title: "English" });
    await expect(
      resolveFranchiseKey(romajiOnly, seededContext([romajiOnly]))
    ).resolves.toEqual({ key: 41, title: "Romaji" });
    await expect(
      resolveFranchiseKey(untitled, seededContext([untitled]))
    ).resolves.toEqual({ key: 42, title: "42" });
  });
});

describe("resolveFranchiseKey — side-story attach", () => {
  /** An OVA pointing PARENT at a series, with the reciprocal edge varying. */
  const attachGraph = (reciprocal: "SIDE_STORY" | "SPIN_OFF") => {
    const child = makeMedia({
      id: 101,
      format: "OVA",
      relations: { edges: [makeEdge("PARENT", { id: 100 })] },
    });
    const parent = makeMedia({
      id: 100,
      title: { english: "Parent Series", romaji: null, native: null },
      relations: { edges: [makeEdge(reciprocal, { id: 101, format: "OVA" })] },
    });
    return { child, parent };
  };

  it("attaches side content to its parent's backbone", async () => {
    const { child, parent } = attachGraph("SIDE_STORY");

    await expect(
      resolveFranchiseKey(child, seededContext([child, parent]))
    ).resolves.toEqual({ key: 100, title: "Parent Series" });
  });

  it("does NOT attach a spin-off, even though it also points PARENT", async () => {
    // This is the guard that keeps a shared-universe spin-off out of the
    // parent's franchise: same PARENT edge, different reciprocal.
    const { child, parent } = attachGraph("SPIN_OFF");

    await expect(
      resolveFranchiseKey(child, seededContext([child, parent]))
    ).resolves.toEqual({ key: 101, title: "Anime 101" });
  });

  it("attaches to the parent's chain head, not the parent itself", async () => {
    const root = makeMedia({
      id: 200,
      title: { english: "Root", romaji: null, native: null },
    });
    const parent = makeMedia({
      id: 201,
      relations: {
        edges: [
          makeEdge("PREQUEL", { id: 200 }),
          makeEdge("SIDE_STORY", { id: 202, format: "OVA" }),
        ],
      },
    });
    const child = makeMedia({
      id: 202,
      format: "OVA",
      relations: { edges: [makeEdge("PARENT", { id: 201 })] },
    });

    await expect(
      resolveFranchiseKey(child, seededContext([child, parent, root]))
    ).resolves.toEqual({ key: 200, title: "Root" });
  });

  it("prefers a TV parent when several PARENT edges compete, and warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const child = makeMedia({
      id: 302,
      format: "SPECIAL",
      relations: {
        edges: [
          makeEdge("PARENT", { id: 300, format: "OVA" }),
          makeEdge("PARENT", { id: 301, format: "TV" }),
        ],
      },
    });
    const tvParent = makeMedia({
      id: 301,
      title: { english: "TV Parent", romaji: null, native: null },
      relations: {
        edges: [makeEdge("SIDE_STORY", { id: 302, format: "SPECIAL" })],
      },
    });
    const ovaParent = makeMedia({ id: 300, format: "OVA" });

    await expect(
      resolveFranchiseKey(child, seededContext([child, tvParent, ovaParent]))
    ).resolves.toEqual({ key: 301, title: "TV Parent" });
    expect(warn).toHaveBeenCalledOnce();
  });

  it("never chains attaches — the anchor's own PARENT edge is not followed", async () => {
    // grandchild -> child -> grandparent. Only the first hop is taken, so the
    // key is the child's chain head, not the grandparent's.
    const grandchild = makeMedia({
      id: 402,
      format: "OVA",
      relations: { edges: [makeEdge("PARENT", { id: 401 })] },
    });
    const child = makeMedia({
      id: 401,
      title: { english: "Middle", romaji: null, native: null },
      relations: {
        edges: [
          makeEdge("SIDE_STORY", { id: 402, format: "OVA" }),
          makeEdge("PARENT", { id: 400 }),
        ],
      },
    });
    const grandparent = makeMedia({
      id: 400,
      relations: { edges: [makeEdge("SIDE_STORY", { id: 401 })] },
    });

    await expect(
      resolveFranchiseKey(
        grandchild,
        seededContext([grandchild, child, grandparent])
      )
    ).resolves.toEqual({ key: 401, title: "Middle" });
  });
});

describe("resolveFranchiseKey — known-key short circuit", () => {
  it("returns a known key without walking the chain at all", async () => {
    const lookupKnown = vi.fn(async (id: number) =>
      id === 500 ? { key: 500, title: "Already Known" } : null
    );
    const media = makeMedia({
      id: 500,
      relations: { edges: [makeEdge("PREQUEL", { id: 499 })] },
    });

    // 499 is deliberately absent from the cache: reaching it would fetch.
    await expect(
      resolveFranchiseKey(media, seededContext([media], lookupKnown))
    ).resolves.toEqual({ key: 500, title: "Already Known" });
    expect(lookupKnown).toHaveBeenCalledExactlyOnceWith(500);
  });

  it("stops mid-walk when an ancestor is already known", async () => {
    const lookupKnown = vi.fn(async (id: number) =>
      id === 601 ? { key: 600, title: "Known Root" } : null
    );
    const s3 = makeMedia({
      id: 602,
      relations: { edges: [makeEdge("PREQUEL", { id: 601 })] },
    });

    // Neither 601 nor 600 is seeded — the short circuit must fire before
    // either would be fetched.
    await expect(
      resolveFranchiseKey(s3, seededContext([s3], lookupKnown))
    ).resolves.toEqual({ key: 600, title: "Known Root" });
    expect(lookupKnown).toHaveBeenCalledWith(602);
    expect(lookupKnown).toHaveBeenCalledWith(601);
  });

  it("memoizes a resolved key so a second call skips the lookup", async () => {
    const lookupKnown = vi.fn(async () => null);
    const media = makeMedia({ id: 700 });
    const ctx = seededContext([media], lookupKnown);

    await resolveFranchiseKey(media, ctx);
    lookupKnown.mockClear();

    await expect(resolveFranchiseKey(media, ctx)).resolves.toEqual({
      key: 700,
      title: "Anime 700",
    });
    expect(lookupKnown).not.toHaveBeenCalled();
  });
});

describe("collectBackbone", () => {
  it("returns the chain in order, root first", async () => {
    const s1 = makeMedia({
      id: 1,
      relations: { edges: [makeEdge("SEQUEL", { id: 2 })] },
    });
    const s2 = makeMedia({
      id: 2,
      relations: { edges: [makeEdge("SEQUEL", { id: 3 })] },
    });
    const s3 = makeMedia({ id: 3 });

    const members = await collectBackbone(1, seededContext([s1, s2, s3]));
    expect(members.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("stops on a cycle rather than collecting forever", async () => {
    const a = makeMedia({
      id: 10,
      relations: { edges: [makeEdge("SEQUEL", { id: 11 })] },
    });
    const b = makeMedia({
      id: 11,
      relations: { edges: [makeEdge("SEQUEL", { id: 10 })] },
    });

    const members = await collectBackbone(10, seededContext([a, b]));
    expect(members.map((m) => m.id)).toEqual([10, 11]);
  });

  it("ignores non-narrative sequel edges", async () => {
    const root = makeMedia({
      id: 20,
      relations: {
        edges: [makeEdge("SEQUEL", { id: 21, format: "MUSIC" })],
      },
    });

    const members = await collectBackbone(20, seededContext([root]));
    expect(members.map((m) => m.id)).toEqual([20]);
  });
});

describe("createResolveContext", () => {
  it("hands out independent caches per run", () => {
    const a = createResolveContext();
    const b = createResolveContext();
    a.cache.set(1, { key: 1, title: "x" });

    expect(b.cache.size).toBe(0);
    expect(a.lookupKnown).toBeUndefined();
  });
});
