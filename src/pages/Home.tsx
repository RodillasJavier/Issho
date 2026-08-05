/* src/pages/Home.tsx */
import { useState } from "react";
import { Link } from "react-router";
import { EntryList } from "../components/EntryList";
import { PublicFeed } from "../components/PublicFeed";
import { ActivityFilterTabs } from "../components/ActivityFilterTabs";
import type { ActivityFilter } from "../constants/activityFilters";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../styles/tokens";

export const Home = () => {
  const { user, initializing } = useAuth();
  const [filter, setFilter] = useState<ActivityFilter>("all");

  // Which feed this page is depends entirely on the session, so nothing
  // auth-dependent renders until it lands. Guessing wrong would swap the
  // whole page under the reader and fire a public-feed request a signed-in
  // user never needed. `invisible` keeps the eyebrow and subtitle in the
  // layout so the heading doesn't jump when they fill in.
  const signedOut = !initializing && !user;

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-b border-neutral-800 pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p
            className={cn(
              "font-mono text-xs font-medium uppercase tracking-widest text-rose-400",
              initializing && "invisible"
            )}
          >
            {signedOut ? "Public feed" : "From your circle"}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Recent activity
            </h1>
            <p
              className={cn(
                "text-sm text-neutral-500",
                initializing && "invisible"
              )}
            >
              {signedOut
                ? "Anonymous activity. Sign in to see who's behind it."
                : "Fresh entries from you and your friends."}
            </p>
          </div>
        </div>

        {user && <ActivityFilterTabs value={filter} onChange={setFilter} />}
      </section>

      {signedOut && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <p className="text-center text-gray-300">
            Authors are hidden on the public feed.{" "}
            <Link to="/signin" className="text-rose-400 hover:text-rose-300">
              Sign in
            </Link>{" "}
            to see your friends' activity and personalize your experience.
          </p>
        </div>
      )}

      {initializing ? null : user ? (
        <EntryList filter={filter} />
      ) : (
        <PublicFeed />
      )}
    </div>
  );
};
