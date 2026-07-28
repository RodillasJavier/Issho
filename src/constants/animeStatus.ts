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

export const STATUS_COLORS: Record<AnimeStatus, string> = {
  not_started: "border border-neutral-400 bg-neutral-400/25 text-white",
  watching: "bg-blue-400 text-neutral-900",
  completed: "bg-green-400 text-neutral-900",
  dropped: "border border-red-900 bg-red-900/25 text-red-400",
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
