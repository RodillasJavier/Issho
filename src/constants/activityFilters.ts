/**
 * src/constants/activityFilters.ts
 *
 * Filter options for the activity feed (All activity / Friends / You),
 * shared between ActivityFilterTabs (renders the tabs) and EntryList
 * (looks up the active filter's label).
 */
export type ActivityFilter = "all" | "friends" | "mine";

export const ACTIVITY_FILTERS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "friends", label: "Friends" },
  { value: "mine", label: "You" },
];
