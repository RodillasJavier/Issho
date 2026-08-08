/**
 * src/components/CommentSortTabs.tsx
 *
 * Segmented Top/Newest/Oldest control for a comment thread, built on the
 * shared TabList shell (also used by ActivityFilterTabs).
 */
import {
  COMMENT_SORT_OPTIONS,
  type CommentSort,
} from "../constants/commentSort";
import { TabList } from "./TabList";

// #region Types
interface CommentSortTabsProps {
  value: CommentSort;
  onChange: (value: CommentSort) => void;
}
// #endregion Types

// #region Component Logic
export const CommentSortTabs = ({ value, onChange }: CommentSortTabsProps) => (
  <TabList
    value={value}
    onChange={onChange}
    options={COMMENT_SORT_OPTIONS}
    ariaLabel="Sort comments"
  />
);
// #endregion Component Logic
// #endregion
