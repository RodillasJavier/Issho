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
import { TabList } from "./TabList";

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
}: ActivityFilterTabsProps) => (
  <TabList
    value={value}
    onChange={onChange}
    options={ACTIVITY_FILTERS}
    ariaLabel="Filter activity"
    className="mt-5 sm:mt-0"
  />
);
// #endregion Component Logic
// #endregion
