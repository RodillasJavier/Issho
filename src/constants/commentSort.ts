/**
 * src/constants/commentSort.ts
 *
 * Sort options for a comment thread (Top / Newest / Oldest), shared between
 * CommentSortTabs (renders the tabs) and sortComments (utils/comments.ts,
 * applies the ordering). Not a database enum — this is a pure UI sort mode,
 * same category as ActivityFilter in activityFilters.ts.
 */
import { Clock, Flame, History, type LucideIcon } from "lucide-react";

export type CommentSort = "top" | "new" | "old";

export const COMMENT_SORT_OPTIONS: {
  value: CommentSort;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "top", label: "Top", icon: Flame },
  { value: "new", label: "Newest", icon: Clock },
  { value: "old", label: "Oldest", icon: History },
];
