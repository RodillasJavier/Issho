/**
 * src/components/AnimeListStats.tsx
 *
 * The six stat tiles above a profile's list. Five of them double as the
 * status filter — they are the only one on the page — so they stay buttons
 * with an active state rather than plain figures. Avg Rating is a readout,
 * not a filter, and is styled apart to say so.
 */
import type { AnimeListFilter } from "../constants/animeStatus";

// #region Types
interface AnimeListStatsProps {
  stats: {
    total: number;
    watching: number;
    completed: number;
    notStarted: number;
    dropped: number;
    avgRating: string;
  };
  activeFilter: AnimeListFilter;
  onFilterChange: (filter: AnimeListFilter) => void;
}
// #endregion Types

// #region Component
export const AnimeListStats = ({
  stats,
  activeFilter,
  onFilterChange,
}: AnimeListStatsProps) => {
  const tiles: {
    filter: AnimeListFilter;
    label: string;
    value: number;
    valueClass: string;
    activeClass: string;
  }[] = [
    {
      filter: "all",
      label: "Total",
      value: stats.total,
      valueClass: "text-rose-400",
      activeClass: "border-rose-500 bg-rose-500/15",
    },
    {
      filter: "watching",
      label: "Watching",
      value: stats.watching,
      valueClass: "text-blue-400",
      activeClass: "border-blue-500 bg-blue-500/15",
    },
    {
      filter: "completed",
      label: "Completed",
      value: stats.completed,
      valueClass: "text-green-400",
      activeClass: "border-green-500 bg-green-500/15",
    },
    {
      filter: "not_started",
      label: "To Watch",
      value: stats.notStarted,
      valueClass: "text-yellow-400",
      activeClass: "border-yellow-500 bg-yellow-500/15",
    },
    {
      filter: "dropped",
      label: "Dropped",
      value: stats.dropped,
      valueClass: "text-red-400",
      activeClass: "border-red-500 bg-red-500/15",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
      {tiles.map((tile) => {
        const active = activeFilter === tile.filter;
        return (
          <button
            key={tile.filter}
            type="button"
            onClick={() => onFilterChange(tile.filter)}
            aria-pressed={active}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-3.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
              active
                ? tile.activeClass
                : "border-zinc-800 bg-[#0c0c0f] hover:border-zinc-700"
            }`}
          >
            <span
              className={`text-2xl leading-none font-bold ${tile.valueClass}`}
            >
              {tile.value}
            </span>
            <span className="mt-1.5 text-center font-mono text-[10px] tracking-[0.14em] text-zinc-500 uppercase">
              {tile.label}
            </span>
          </button>
        );
      })}

      {/* A readout, not a filter — hence the different treatment. */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-purple-500/10 px-2 py-3.5">
        <span className="bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-2xl leading-none font-bold text-transparent">
          {stats.avgRating}
        </span>
        <span className="mt-1.5 text-center font-mono text-[10px] tracking-[0.14em] text-zinc-500 uppercase">
          Avg Rating
        </span>
      </div>
    </div>
  );
};
// #endregion Component
