/**
 * src/services/anilistFranchise.ts
 *
 * Resolves an anime's franchise key from the AniList relations graph.
 *
 * Two-tier grouping:
 *  - Backbone: follow SEQUEL/PREQUEL edges only (across all narrative formats).
 *    The head of the chain (no prequel) is the franchise root; its AniList id
 *    is the franchise_key stored on every member.
 *  - Side-attach: an entry whose PARENT edge points at a backbone member (a
 *    gaiden film, an OVA special) attaches to that member's key — ONE hop
 *    only, never chained.
 *
 * SPIN_OFF/CHARACTER/OTHER are never followed (different show, shared
 * universe). ALTERNATIVE merges alternate retellings and is off by default.
 * Titles are never compared — no relation edge means no grouping.
 */
import { getAnimeById, withRetry } from "./anilistApi";
import type { AniListMedia } from "./anilistApi";

// #region Config
// MUSIC excluded; every other anime format can sit on or attach to a backbone
const NARRATIVE_FORMATS = new Set([
  "TV",
  "TV_SHORT",
  "ONA",
  "OVA",
  "MOVIE",
  "SPECIAL",
]);

// Edges are directional: on a child, PARENT points at its parent series; on a
// parent, SIDE_STORY points DOWN at its side content — so only PARENT is an
// attach edge (following SIDE_STORY would re-key a series onto its own OVAs).
// PARENT alone is ambiguous, though: spin-off children also carry it, so the
// attach additionally requires the parent's reciprocal edge to be one of
// these (add "ALTERNATIVE" to also group alternate retellings — risks
// Fate-style over-merging).
const ATTACH_RELATIONS = new Set(["PARENT"]);
const RECIPROCAL_ATTACH_RELATIONS = new Set(["SIDE_STORY"]);
// #endregion Config

// #region Types
export interface FranchiseInfo {
  key: number;
  title: string;
}

/**
 * Shared resolution context. `cache` memoizes resolved keys and `mediaCache`
 * memoizes fetched Media within a run (the prequel walk and the backbone
 * collection visit the same nodes); `lookupKnown` (optional) checks the local
 * DB for an already-resolved neighbour so seasons of one show don't each
 * re-walk the whole spine.
 */
export interface ResolveContext {
  cache: Map<number, FranchiseInfo>;
  mediaCache: Map<number, AniListMedia>;
  lookupKnown?: (anilistId: number) => Promise<FranchiseInfo | null>;
}

export const createResolveContext = (
  lookupKnown?: ResolveContext["lookupKnown"]
): ResolveContext => ({ cache: new Map(), mediaCache: new Map(), lookupKnown });
// #endregion Types

// #region Resolution
const isNarrativeAnime = (node: {
  type: string;
  format: string | null;
}): boolean =>
  node.type === "ANIME" &&
  node.format != null &&
  NARRATIVE_FORMATS.has(node.format);

const titleOf = (media: {
  id: number;
  title: { english: string | null; romaji: string | null };
}): string => media.title.english ?? media.title.romaji ?? String(media.id);

/** Fetch a media node, reusing anything already seen in this run */
const fetchMedia = async (
  id: number,
  ctx: ResolveContext
): Promise<AniListMedia | null> => {
  const cached = ctx.mediaCache.get(id);
  if (cached) return cached;
  const media = await withRetry(() => getAnimeById(id));
  if (media) ctx.mediaCache.set(id, media);
  return media;
};

/** Check memo cache, then the local DB, for an already-known franchise key */
const findKnown = async (
  anilistId: number,
  ctx: ResolveContext
): Promise<FranchiseInfo | null> => {
  const cached = ctx.cache.get(anilistId);
  if (cached) return cached;
  if (ctx.lookupKnown) {
    const known = await ctx.lookupKnown(anilistId);
    if (known) {
      ctx.cache.set(anilistId, known);
      return known;
    }
  }
  return null;
};

/**
 * Tier 1: walk PREQUEL edges to the head of the sequel/prequel chain.
 * Short-circuits when a chain member's key is already known.
 *
 * @param start Media to walk from (already fetched)
 * @param ctx Shared resolution context
 * @returns Franchise info of the chain root
 */
const backboneRoot = async (
  start: AniListMedia,
  ctx: ResolveContext
): Promise<FranchiseInfo> => {
  let media = start;
  const seen = new Set<number>([media.id]);

  for (;;) {
    const prequel = media.relations.edges.find(
      (e) => e.relationType === "PREQUEL" && isNarrativeAnime(e.node)
    );
    if (!prequel) {
      return { key: media.id, title: titleOf(media) };
    }

    // Cycle guard: some franchises have odd bidirectional links
    if (seen.has(prequel.node.id)) {
      return { key: media.id, title: titleOf(media) };
    }
    seen.add(prequel.node.id);

    const known = await findKnown(prequel.node.id, ctx);
    if (known) return known;

    const next = await fetchMedia(prequel.node.id, ctx);
    if (!next) {
      return { key: media.id, title: titleOf(media) };
    }
    media = next;
  }
};

/**
 * Resolve the franchise key for a media entry: one attach hop outward to its
 * anchoring backbone member (if it's side content), then that anchor's
 * backbone root.
 *
 * @param media The entry's media (already fetched, with relations)
 * @param ctx Shared resolution context
 * @returns The franchise key (root AniList id) and denormalized root title
 */
export const resolveFranchiseKey = async (
  media: AniListMedia,
  ctx: ResolveContext = createResolveContext()
): Promise<FranchiseInfo> => {
  ctx.mediaCache.set(media.id, media);
  const known = await findKnown(media.id, ctx);
  if (known) return known;

  // Tier 2: side content attaches to its parent's backbone — ONE hop only,
  // so we never inspect the anchor's own attach edges
  let anchor = media;
  const attach = media.relations.edges.filter(
    (e) => ATTACH_RELATIONS.has(e.relationType) && isNarrativeAnime(e.node)
  );
  if (attach.length > 0) {
    const primary = attach.find((e) => e.node.format === "TV") ?? attach[0];
    if (attach.length > 1) {
      console.warn(
        `[franchise] ${media.id} has ${attach.length} attach parents; picked ${primary.node.id}`
      );
    }

    // A spin-off child also points PARENT at its origin series, so only
    // attach when the parent's reciprocal edge marks this entry as a
    // SIDE_STORY — spin-offs stay their own franchise
    const parent = await fetchMedia(primary.node.id, ctx);
    const reciprocal = parent?.relations.edges.find(
      (e) => e.node.id === media.id
    )?.relationType;
    if (parent && reciprocal && RECIPROCAL_ATTACH_RELATIONS.has(reciprocal)) {
      const anchorKnown = await findKnown(parent.id, ctx);
      if (anchorKnown) {
        ctx.cache.set(media.id, anchorKnown);
        return anchorKnown;
      }
      anchor = parent;
    }
  }

  const root = await backboneRoot(anchor, ctx);
  ctx.cache.set(media.id, root);
  ctx.cache.set(anchor.id, root);
  return root;
};

/**
 * Enumerate the whole backbone chain by following SEQUEL edges down from the
 * franchise root. Used by the add flow so importing any one season brings in
 * the entire series.
 *
 * @param rootId AniList id of the backbone root (the franchise key)
 * @param ctx Shared resolution context (reuses media fetched during resolution)
 * @returns Chain members in order, root first
 */
export const collectBackbone = async (
  rootId: number,
  ctx: ResolveContext = createResolveContext()
): Promise<AniListMedia[]> => {
  const members: AniListMedia[] = [];
  const seen = new Set<number>();
  let currentId: number | null = rootId;

  while (currentId != null && !seen.has(currentId)) {
    seen.add(currentId);
    const media = await fetchMedia(currentId, ctx);
    if (!media) break;
    members.push(media);

    const sequel = media.relations.edges.find(
      (e) => e.relationType === "SEQUEL" && isNarrativeAnime(e.node)
    );
    currentId = sequel ? sequel.node.id : null;
  }

  return members;
};
// #endregion Resolution
