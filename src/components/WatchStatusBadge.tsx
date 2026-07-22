/**
 * src/components/WatchStatusBadge.tsx
 *
 * Small pill for a user's watch status, used in the detail-page heroes.
 */
import { STATUS_BADGE_STYLES, STATUS_LABELS } from "../constants/animeStatus";
import type { AnimeStatus } from "../types/database.types";

export const WatchStatusBadge = ({ status }: { status: AnimeStatus }) => {
  const { className, icon: Icon } = STATUS_BADGE_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${className}`}
    >
      <Icon aria-hidden className="size-3" />
      {STATUS_LABELS[status]}
    </span>
  );
};
