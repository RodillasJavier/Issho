/**
 * src/components/CommunityEntriesSection.tsx
 *
 * "From your circle" entries section shared by the season (AnimeFeed) and
 * series (FranchisePage) detail views — identical chrome, only the empty
 * state copy differs per caller. The most recent entry (or few, rotating)
 * gets FeaturedEntry's spotlight treatment, same as the homepage feed; the
 * rest render as slim EntryCompactRow list items below it.
 *
 * "Community" here means the viewer's friends, not every user: the callers
 * pass in the same RLS-scoped feed fetch the homepage uses, filtered by
 * anime/franchise.
 */
import { FeaturedEntry } from "./FeaturedEntry";
import { EntryCompactRow } from "./EntryCompactRow";
import type { Entry } from "../types/database.types";

interface CommunityEntriesSectionProps {
  entries: Entry[] | undefined;
  emptyMessage: string;
}

export const CommunityEntriesSection = ({
  entries,
  emptyMessage,
}: CommunityEntriesSectionProps) => {
  const featuredEntries = entries?.slice(0, 5) ?? [];
  const restEntries = entries?.slice(5) ?? [];
  // Keying on the actual entry ids (rather than array identity, which
  // changes on every render) lets the carousel remount and reset its
  // rotation only when the underlying entries truly change.
  const featuredKey = featuredEntries.map((entry) => entry.id).join(",");

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

          {restEntries.length > 0 && (
            <div className="flex flex-col gap-2">
              {restEntries.map((entry) => (
                <EntryCompactRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="py-8 text-center text-gray-400">{emptyMessage}</p>
      )}
    </section>
  );
};
