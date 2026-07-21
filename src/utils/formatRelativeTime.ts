/**
 * src/utils/formatRelativeTime.ts
 *
 * Formats an ISO timestamp as a short relative label ("42m ago", "Yesterday"),
 * falling back to an absolute "Jul 14" (or "Jul 14, 2025" across year
 * boundaries) once it's more than two days old.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const elapsed = Date.now() - date.getTime();

  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 2 * DAY) return "Yesterday";

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
};
