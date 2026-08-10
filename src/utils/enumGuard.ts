/**
 * src/utils/enumGuard.ts
 *
 * Factory for "is this a known value from a fixed set" type guards — the
 * shape every `useSearchParams().get(...)` result (a raw `string | null`)
 * needs before it can be trusted as a narrower union type. Used to build
 * `isAnimeListFilter`/`isSortKey`, both of which restore filter/sort state
 * from the URL.
 */
export const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (value: string | null): value is T =>
    value !== null && (values as readonly string[]).includes(value);
