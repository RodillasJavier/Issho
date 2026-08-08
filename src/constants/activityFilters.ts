/**
 * src/constants/activityFilters.ts
 *
 * Filter options for the activity feed (All / Friends / You),
 * shared between ActivityFilterTabs (renders the tabs) and EntryList
 * (looks up the active filter's label).
 *
 * "all" means everything the viewer can see — their friends' entries plus
 * their own — not a global feed. Nothing in this app shows the activity of
 * people you aren't friends with.
 */
export type ActivityFilter = "all" | "friends" | "mine";

export const ACTIVITY_FILTERS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "friends", label: "Friends" },
  { value: "mine", label: "You" },
];
