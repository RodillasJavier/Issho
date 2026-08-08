/**
 * src/components/TabList.tsx
 *
 * Generic segmented tablist shell shared by ActivityFilterTabs and
 * CommentSortTabs — a labelled tab strip with an optional icon per option.
 */
import type { ElementType } from "react";

// #region Types
export interface TabListOption<T extends string> {
  value: T;
  label: string;
  icon?: ElementType;
}

interface TabListProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly TabListOption<T>[];
  ariaLabel: string;
  className?: string;
}
// #endregion Types

export function TabList<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: TabListProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex w-fit rounded-md border border-neutral-800 bg-neutral-950 p-1 ${className}`}
    >
      {options.map((option) => (
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
          {option.icon && (
            <option.icon className="size-3.5" aria-hidden="true" />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}
