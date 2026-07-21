/**
 * src/components/ActivityFilterTabs.tsx
 *
 * Tri-state tablist for the activity feed (All activity / Friends / You).
 * Owned by Home, which renders it in the page header next to the title;
 * EntryList consumes the selected value as a prop.
 */
import {
  ACTIVITY_FILTERS,
  type ActivityFilter,
} from "../constants/activityFilters";

// #region Types
interface ActivityFilterTabsProps {
  value: ActivityFilter;
  onChange: (value: ActivityFilter) => void;
}
// #endregion Types

// #region Component Logic
export const ActivityFilterTabs = ({
  value,
  onChange,
}: ActivityFilterTabsProps) => {
  return (
    <div
      role="tablist"
      aria-label="Filter activity"
      className="mt-5 inline-flex w-fit rounded-md border border-neutral-800 bg-neutral-950 p-1 sm:mt-0"
    >
      {ACTIVITY_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          role="tab"
          aria-selected={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`rounded text-sm font-medium px-3 py-1.5 transition-colors cursor-pointer ${
            value === filter.value
              ? "bg-neutral-800 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-200"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
  // #endregion Component Logic
};
// #endregion
