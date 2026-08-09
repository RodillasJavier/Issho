import {
  Check,
  CheckCircle2,
  CircleDot,
  CircleX,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { AnimeStatus } from "../types/database.types";

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  not_started: "To Watch",
  watching: "Watching",
  completed: "Completed",
  dropped: "Dropped",
};

/**
 * The status picker's options, in the order they're offered: roughly the
 * order a show moves through a list. Shared by the Create composer and the
 * list edit modal via StatusOptionList, so the two can't drift.
 */
export const STATUS_OPTIONS: {
  value: AnimeStatus;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}[] = [
  {
    value: "watching",
    label: "Watching",
    subtitle: "I'm partway through",
    icon: CircleDot,
  },
  {
    value: "completed",
    label: "Completed",
    subtitle: "I finished it",
    icon: CheckCircle2,
  },
  {
    value: "not_started",
    label: "Plan to watch",
    subtitle: "Saving it for later",
    icon: Star,
  },
  {
    value: "dropped",
    label: "Dropped",
    subtitle: "Not for me",
    icon: CircleX,
  },
];

// A profile list's status filter always adds an "all" option on top of the
// four real statuses. Shared by AnimeListStats (renders the tiles) and
// UserProfilePage (owns the filter state) so the two can't drift.
export type AnimeListFilter = "all" | AnimeStatus;

export const isAnimeListFilter = (
  value: string | null
): value is AnimeListFilter =>
  value === "all" || STATUS_OPTIONS.some((option) => option.value === value);

// Interactive weight of the same bordered/translucent language as
// STATUS_BADGE_STYLES below — a shade stronger since these sit on clickable
// buttons (ListStatusButton, SearchResultCard) as well as static tags
// (EntryItem, EntryCompactRow, EntryDetail), and buttons need a hover state.
// Kept alongside STATUS_BADGE_STYLES so both stay in the same hue family per
// status rather than drifting independently.
export const STATUS_COLORS: Record<AnimeStatus, string> = {
  not_started:
    "border border-zinc-700 bg-zinc-800/70 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800",
  watching:
    "border border-blue-400/30 bg-blue-400/10 text-blue-300 hover:border-blue-400/50 hover:bg-blue-400/15",
  completed:
    "border border-green-400/30 bg-green-400/10 text-green-300 hover:border-green-400/50 hover:bg-green-400/15",
  dropped:
    "border border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-500/50 hover:bg-red-500/15",
};

// Bordered/translucent variant + icon, used by WatchStatusBadge on detail-page
// heroes. Kept alongside STATUS_COLORS so both variants stay in the same
// blue/green/red hue family per status rather than drifting independently.
export const STATUS_BADGE_STYLES: Record<
  AnimeStatus,
  { className: string; icon: LucideIcon }
> = {
  completed: {
    className: "border-green-400/20 bg-green-400/[0.08] text-green-300",
    icon: Check,
  },
  watching: {
    className: "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
    icon: CircleDot,
  },
  not_started: {
    className: "border-zinc-700 bg-zinc-800 text-zinc-300",
    icon: Star,
  },
  dropped: {
    className: "border-red-900 bg-red-900/25 text-red-400",
    icon: CircleX,
  },
};
