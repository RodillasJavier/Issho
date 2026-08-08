/**
 * src/components/CommentSortTabs.tsx
 *
 * Segmented Top/Newest/Oldest control for a comment thread. Structural
 * clone of ActivityFilterTabs, parameterized on CommentSort.
 */
import {
  COMMENT_SORT_OPTIONS,
  type CommentSort,
} from "../constants/commentSort";

// #region Types
interface CommentSortTabsProps {
  value: CommentSort;
  onChange: (value: CommentSort) => void;
}
// #endregion Types

// #region Component Logic
export const CommentSortTabs = ({ value, onChange }: CommentSortTabsProps) => {
  return (
    <div
      role="tablist"
      aria-label="Sort comments"
      className="inline-flex w-fit rounded-md border border-neutral-800 bg-neutral-950 p-1"
    >
      {COMMENT_SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            value === option.value
              ? "bg-neutral-800 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-200"
          }`}
        >
          <option.icon className="size-3.5" aria-hidden="true" />
          {option.label}
        </button>
      ))}
    </div>
  );
  // #endregion Component Logic
};
// #endregion
