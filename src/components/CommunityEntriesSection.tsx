/**
 * src/components/CommunityEntriesSection.tsx
 *
 * "From your circle" entries section shared by the season (AnimeFeed) and
 * series (FranchisePage) detail views — identical chrome, only the empty
 * state copy differs per caller. The most recent entry (or few, rotating)
 * gets FeaturedEntry's spotlight treatment, same as the homepage feed. Below
 * it, ALL entries (including the ones already spotlighted above — this is
 * deliberate, not deduped) render as a paginated list of slim EntryCompactRow
 * items, following the same fetch-once-then-slice pattern EntryList uses for
 * the homepage feed: everything here is a client-side slice of the array the
 * caller already fetched, no extra network requests.
 *
 * "Community" here means the viewer's friends, not every user: the callers
 * pass in the same RLS-scoped feed fetch the homepage uses, filtered by
 * anime/franchise.
 */
import { useState } from "react";
import { FeaturedEntry } from "./FeaturedEntry";
import { EntryCompactRow } from "./EntryCompactRow";
import { Pagination } from "./ui/Pagination";
import type { Entry } from "../types/database.types";

const ENTRIES_PER_PAGE = 10;

interface CommunityEntriesSectionProps {
  entries: Entry[] | undefined;
  emptyMessage: string;
  // Identifies which season/franchise is being viewed (animeId or
  // franchiseKey) so pagination can reset when the caller navigates to a
  // different one — AnimeFeed's route isn't `key`-ed, so this component can
  // stay mounted across a season-to-season hop, and resetting off `entries`
  // identity instead would wrongly reset the page on every vote/comment
  // mutation too (those also produce a new `entries` array reference).
  resetKey: string | number;
}

export const CommunityEntriesSection = ({
  entries,
  emptyMessage,
  resetKey,
}: CommunityEntriesSectionProps) => {
  const [pageNumber, setPageNumber] = useState(0);
  const allEntries = entries ?? [];
  const maxPageNumber = Math.max(
    0,
    Math.ceil(allEntries.length / ENTRIES_PER_PAGE) - 1
  );
  const pageCount = maxPageNumber + 1;

  // Reset to page 1 whenever resetKey changes (see prop doc above).
  // Adjusting state during render, rather than in an effect, avoids an
  // extra cascading render on every navigation — same pattern EntryList
  // uses to reset its own pageNumber when its `filter` prop changes.
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPageNumber(0);
  } else if (pageNumber > maxPageNumber) {
    // The underlying entries array can shrink independent of resetKey
    // changing — a background refetch of the shared feed query (window
    // refocus, a friend's visibility changing) can legitimately return
    // fewer rows. Without this, a viewer sitting on a later page would see
    // an empty page with "Next" disabled and no way out except "Prev".
    setPageNumber(maxPageNumber);
  }

  const featuredEntries = allEntries.slice(0, 5);
  // Keying on the actual entry ids (rather than array identity, which
  // changes on every render) lets the carousel remount and reset its
  // rotation only when the underlying entries truly change.
  const featuredKey = featuredEntries.map((entry) => entry.id).join(",");

  const pageEntries = allEntries.slice(
    pageNumber * ENTRIES_PER_PAGE,
    (pageNumber + 1) * ENTRIES_PER_PAGE
  );
  const hasMore = (pageNumber + 1) * ENTRIES_PER_PAGE < allEntries.length;

  const handlePrevPage = () => {
    if (pageNumber > 0) setPageNumber(pageNumber - 1);
  };
  const handleNextPage = () => {
    if (hasMore) setPageNumber(pageNumber + 1);
  };

  return (
    <section
      aria-labelledby="activity-heading"
      className="border-t border-zinc-800 pt-8"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">
            From your circle
          </p>

          <h2
            id="activity-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100"
          >
            Recent entries
          </h2>
        </div>
      </div>

      {featuredEntries.length > 0 ? (
        <div className="flex flex-col gap-4">
          <FeaturedEntry key={featuredKey} entries={featuredEntries} />

          <Pagination
            pageNumber={pageNumber}
            pageCount={pageCount}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />

          <div className="flex flex-col gap-2">
            {pageEntries.map((entry) => (
              <EntryCompactRow key={entry.id} entry={entry} />
            ))}
          </div>

          <Pagination
            pageNumber={pageNumber}
            pageCount={pageCount}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        </div>
      ) : (
        <p className="py-8 text-center text-gray-400">{emptyMessage}</p>
      )}
    </section>
  );
};
