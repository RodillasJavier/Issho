/**
 * src/components/PublicFeed.tsx
 *
 * The logged-out feed. Issho is relationship-based, so visitors without a
 * session get a genuinely anonymous window onto recent activity rather than
 * a global one: the rows come from the get_public_feed RPC, whose return
 * type has no user_id and which never joins profiles, so no author identity
 * reaches the browser at all. There is nothing here to un-hide in devtools —
 * that is the point, and it's why this is a separate component from
 * EntryList rather than a flag on it.
 */
import { useQuery } from "@tanstack/react-query";
import { EntryItem } from "./EntryItem";
import { EmptyFeedState } from "./EntryList";
import { FeaturedEntry } from "./FeaturedEntry";
import {
  fetchPublicFeed,
  publicEntriesQueryKey,
} from "../services/supabase/entries";

const FEATURED_COUNT = 5;

export const PublicFeed = () => {
  const {
    data: entries,
    error,
    isLoading,
  } = useQuery({
    queryKey: publicEntriesQueryKey,
    queryFn: fetchPublicFeed,
  });

  if (isLoading) {
    return <div>Loading entries...</div>;
  }

  if (error) {
    return <div>Error loading entries: {error.message}</div>;
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyFeedState
        title="Nothing here yet"
        subtitle="Sign in to follow friends and see their activity."
        ctaHref="/signin"
        ctaLabel="Sign in"
      />
    );
  }

  const featuredEntries = entries.slice(0, FEATURED_COUNT);
  const featuredKey = featuredEntries.map((entry) => entry.id).join(",");

  return (
    <div className="flex flex-col gap-6">
      <FeaturedEntry key={featuredKey} entries={featuredEntries} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
          Recent activity
        </h3>
        <p className="font-mono text-xs text-neutral-600">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <EntryItem entry={entry} key={entry.id} />
        ))}
      </div>
    </div>
  );
};
