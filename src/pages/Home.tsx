/* src/pages/Home.tsx */
import { useState } from "react";
import { Link } from "react-router";
import { EntryList } from "../components/EntryList";
import { PublicFeed } from "../components/PublicFeed";
import { ActivityFilterTabs } from "../components/ActivityFilterTabs";
import type { ActivityFilter } from "../constants/activityFilters";
import { useAuth } from "../hooks/useAuth";

export const Home = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ActivityFilter>("all");

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-b border-neutral-800 pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-rose-400">
            {user ? "From your circle" : "Public feed"}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Recent activity
            </h1>
            <p className="text-sm text-neutral-500">
              {user
                ? "Fresh entries from you and your friends."
                : "Anonymous activity. Sign in to see who's behind it."}
            </p>
          </div>
        </div>

        {user && <ActivityFilterTabs value={filter} onChange={setFilter} />}
      </section>

      {!user && (
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

      {user ? <EntryList filter={filter} /> : <PublicFeed />}
    </div>
  );
};
