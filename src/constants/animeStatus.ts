import type { AnimeStatus } from "../types/database.types";

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  not_started: "To Watch",
  watching: "Watching",
  completed: "Completed",
  dropped: "Dropped",
};

export const STATUS_COLORS: Record<AnimeStatus, string> = {
  not_started: "border border-neutral-400 bg-neutral-400/25 text-white",
  watching: "bg-blue-400 text-neutral-900",
  completed: "bg-green-400 text-neutral-900",
  dropped: "border border-red-900 bg-red-900/25 text-red-400",
};
