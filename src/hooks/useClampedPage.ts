/**
 * src/hooks/useClampedPage.ts
 *
 * Local 0-indexed page-number state for a client-side-sliced list: resets to
 * page 0 whenever `resetKey` changes (a caller-owned identity for "this is a
 * different list now" — a filter tab, a route param, ...), and otherwise
 * clamps down whenever `itemCount`/`pageSize` shrink the valid range out from
 * under the page the caller is sitting on (a background refetch legitimately
 * returning fewer rows). Without the clamp, a viewer sitting on a later page
 * would see an empty page with "Next" disabled and no way out except "Prev".
 *
 * Both adjustments happen during render rather than in an effect, avoiding an
 * extra cascading render — safe under StrictMode's double-render since each
 * condition is false the second time through once the first render's
 * setState lands. `else if`, not two independent `if`s: both read the same
 * pre-render `pageNumber`, so if a `resetKey` change also lands `pageNumber`
 * out of range for the new `itemCount`, two literal `setPageNumber` calls in
 * one render would race — the later call would win outright rather than
 * composing with the first. `else if` guarantees only one fires.
 */
import { useState } from "react";

export function useClampedPage(
  itemCount: number,
  pageSize: number,
  resetKey: string | number
) {
  const [pageNumber, setPageNumber] = useState(0);
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));

  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPageNumber(0);
  } else if (pageNumber > pageCount - 1) {
    setPageNumber(pageCount - 1);
  }

  return { pageNumber, pageCount, setPageNumber } as const;
}
