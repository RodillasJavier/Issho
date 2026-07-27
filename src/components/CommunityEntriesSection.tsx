/**
 * src/components/CommunityEntriesSection.tsx
 *
 * "From your circle" entries grid shared by the season (AnimeFeed) and
 * series (FranchisePage) detail views — identical chrome, only the empty
 * state copy differs per caller.
 *
 * "Community" here means the viewer's friends, not every user: the callers
 * pass in the same RLS-scoped feed fetch the homepage uses, filtered by
 * anime/franchise.
 */
import { EntryItem } from "./EntryItem";
import type { Entry } from "../types/database.types";

interface CommunityEntriesSectionProps {
  entries: Entry[] | undefined;
  emptyMessage: string;
}

export const CommunityEntriesSection = ({
  entries,
  emptyMessage,
}: CommunityEntriesSectionProps) => (
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

    {entries && entries.length > 0 ? (
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
      </div>
    ) : (
      <p className="py-8 text-center text-gray-400">{emptyMessage}</p>
    )}
  </section>
);
