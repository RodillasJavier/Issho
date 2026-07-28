/**
 * src/components/ListToolbar.tsx
 *
 * Search box and sort dropdown above a profile's list, plus a live result
 * count. Both narrow an already-fetched list in memory — nothing here
 * triggers a refetch.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown, Search, X } from "lucide-react";
import { SORT_OPTIONS } from "../constants/listSort";
import type { SortKey } from "../constants/listSort";

// #region Types
interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  resultCount: number;
  totalCount: number;
}
// #endregion Types

// #region Component Logic
export const ListToolbar = ({
  query,
  onQueryChange,
  sortKey,
  onSortChange,
  resultCount,
  totalCount,
}: ListToolbarProps) => {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const activeSort =
    SORT_OPTIONS.find((option) => option.key === sortKey) ?? SORT_OPTIONS[0];

  // Listeners only exist while the menu is open, so a closed menu costs
  // nothing and there's no stale handler left behind.
  useEffect(() => {
    if (!sortOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSortOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [sortOpen]);
  // #endregion Component Logic

  // #region Render
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative h-10 w-full sm:max-w-sm">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search this list by title..."
          aria-label="Search anime in this list"
          className="h-10 w-full rounded-lg border border-zinc-800 bg-[#101014] pr-9 pl-9 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 hover:border-zinc-700 focus:border-rose-400/60 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          aria-live="polite"
          className="font-mono text-[10px] tracking-[0.18em] whitespace-nowrap text-zinc-500 uppercase"
        >
          {/* Narrows for a status filter as well as a search — otherwise it
              reads "57 series" while nine are on screen. The `!query` keeps a
              search that happens to match everything from reading identically
              to no search at all, which would leave this live region silent. */}
          {resultCount === totalCount && !query
            ? `${totalCount} series`
            : `${resultCount} of ${totalCount}`}
        </span>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-[#101014] px-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
              sortOpen
                ? "border-zinc-700"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <ArrowUpDown aria-hidden className="size-4 text-zinc-500" />
            <span className="hidden font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase sm:inline">
              Sort
            </span>
            <span className="font-medium text-zinc-300">
              {activeSort.label}
            </span>
            <ChevronDown
              aria-hidden
              className={`size-4 text-zinc-500 transition-transform duration-200 ${
                sortOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {sortOpen && (
            <ul
              role="listbox"
              aria-label="Sort order"
              className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-800 bg-neutral-950 py-1 shadow-xl"
            >
              {SORT_OPTIONS.map((option) => {
                const selected = option.key === sortKey;
                return (
                  <li key={option.key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onSortChange(option.key);
                        setSortOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-900 focus:outline-none focus-visible:bg-neutral-900 ${
                        selected
                          ? "text-rose-400"
                          : "text-zinc-400 hover:text-zinc-100"
                      }`}
                    >
                      {option.label}
                      {selected && (
                        <Check aria-hidden className="size-4 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
  // #endregion Render
};
