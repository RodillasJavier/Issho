/**
 * src/components/AnimeListStats.tsx
 *
 * Reusable stats cards component for anime lists
 */
import type { AnimeStatus } from "../types/database.types";

// #region Types

type FilterTab = "all" | AnimeStatus;

interface AnimeListStatsProps {
  stats: {
    total: number;
    watching: number;
    completed: number;
    notStarted: number;
    dropped: number;
    avgRating: string;
  };
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
}

// #endregion Types

// #region Component

export const AnimeListStats = ({
  stats,
  activeFilter,
  onFilterChange,
}: AnimeListStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <button
        onClick={() => onFilterChange("all")}
        className={`p-4 border rounded-lg text-center transition-all cursor-pointer ${
          activeFilter === "all"
            ? "bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20"
            : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:shadow-lg"
        }`}
      >
        <div className="text-3xl font-bold text-rose-400">{stats.total}</div>
        <div className="text-sm text-gray-400">Total</div>
      </button>

      <button
        onClick={() => onFilterChange("watching")}
        className={`p-4 border rounded-lg text-center transition-all cursor-pointer ${
          activeFilter === "watching"
            ? "bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20"
            : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:shadow-lg"
        }`}
      >
        <div className="text-3xl font-bold text-blue-400">{stats.watching}</div>
        <div className="text-sm text-gray-400">Watching</div>
      </button>

      <button
        onClick={() => onFilterChange("completed")}
        className={`p-4 border rounded-lg text-center transition-all cursor-pointer ${
          activeFilter === "completed"
            ? "bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20"
            : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:shadow-lg"
        }`}
      >
        <div className="text-3xl font-bold text-green-400">
          {stats.completed}
        </div>
        <div className="text-sm text-gray-400">Completed</div>
      </button>

      <button
        onClick={() => onFilterChange("not_started")}
        className={`p-4 border rounded-lg text-center transition-all cursor-pointer ${
          activeFilter === "not_started"
            ? "bg-yellow-500/20 border-yellow-500 shadow-lg shadow-yellow-500/20"
            : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:shadow-lg"
        }`}
      >
        <div className="text-3xl font-bold text-yellow-400">
          {stats.notStarted}
        </div>
        <div className="text-sm text-gray-400">To Watch</div>
      </button>

      <button
        onClick={() => onFilterChange("dropped")}
        className={`p-4 border rounded-lg text-center transition-all cursor-pointer ${
          activeFilter === "dropped"
            ? "bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20"
            : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:shadow-lg"
        }`}
      >
        <div className="text-3xl font-bold text-red-400">{stats.dropped}</div>
        <div className="text-sm text-gray-400">Dropped</div>
      </button>

      <div className="p-4 bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-rose-500/30 rounded-lg text-center transition">
        <div className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
          {stats.avgRating}
        </div>
        <div className="text-sm text-gray-400">Avg Rating</div>
      </div>
    </div>
  );
};

// #endregion Component
