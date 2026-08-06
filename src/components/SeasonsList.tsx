/**
 * src/components/SeasonsList.tsx
 *
 * "Seasons & films" list in DetailSidebar: a single-column list of a
 * franchise's member releases, sized for the sidebar rather than the page's
 * full width. On a season page the current release is highlighted
 * ("Viewing"); every other release links to its own page. Clicking the
 * current release's own card (when currentSeasonHref is given) goes "up" to
 * the series page instead — a season page has no other one-click way back to
 * the series level. Each row shows the viewer's watch status for that
 * release (when known), and a "X of Y completed" progress bar summarizes the
 * whole franchise.
 */
import { Link } from "react-router";
import { STATUS_BADGE_STYLES, STATUS_LABELS } from "../constants/animeStatus";
import type { Anime, AnimeStatus } from "../types/database.types";

interface SeasonsListProps {
  members: Anime[];
  currentId?: string;
  statusByAnimeId?: Record<string, AnimeStatus>;
  currentSeasonHref?: string;
}

export const SeasonsList = ({
  members,
  currentId,
  statusByAnimeId,
  currentSeasonHref,
}: SeasonsListProps) => {
  const completedCount = statusByAnimeId
    ? members.filter((member) => statusByAnimeId[member.id] === "completed")
        .length
    : 0;
  const completedPercent =
    members.length > 0
      ? Math.round((completedCount / members.length) * 100)
      : 0;

  return (
    <section aria-labelledby="seasons-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">
            Series guide
          </p>
          <h2
            id="seasons-heading"
            className="mt-1 text-lg font-semibold tracking-tight text-zinc-100"
          >
            Seasons &amp; films
          </h2>
        </div>
        <p className="font-mono text-xs text-zinc-600">
          {members.length} {members.length === 1 ? "release" : "releases"}
        </p>
      </div>

      {statusByAnimeId && (
        <div className="mt-3">
          <p className="text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-100">
              {completedCount}
            </span>{" "}
            of {members.length} completed
          </p>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
            aria-valuenow={completedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Series completion"
          >
            <div
              className="h-full rounded-full bg-blue-400"
              style={{ width: `${completedPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3.5 flex flex-col gap-2">
        {members.map((member, index) => {
          const isCurrent = member.id === currentId;
          const status = statusByAnimeId?.[member.id];
          const badge = status ? STATUS_BADGE_STYLES[status] : null;
          const StatusIcon = badge?.icon;

          const inner = (
            <>
              {/* A faint, full-row echo of the poster sits behind the text —
                  darkest near the flush thumbnail and fading out to its
                  right — so the row reads as one piece without turning the
                  thumbnail into a full-bleed banner. The actual thumbnail
                  below is a real flush image, not this backdrop. */}
              {member.cover_image_url && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.12]"
                  style={{ backgroundImage: `url(${member.cover_image_url})` }}
                />
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#101014] via-[#101014]/85 to-transparent"
              />

              {member.cover_image_url ? (
                <img
                  src={member.cover_image_url}
                  alt=""
                  loading="lazy"
                  className="relative h-23 w-17 flex-none object-cover sm:h-26 sm:w-19"
                />
              ) : (
                <div className="relative h-23 w-17 flex-none bg-zinc-800 sm:h-26 sm:w-19" />
              )}

              <span className="relative flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-2">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {badge && StatusIcon && (
                      <span
                        className={`flex size-[18px] items-center justify-center rounded-full border ${badge.className}`}
                      >
                        <StatusIcon aria-hidden className="size-3" />
                        <span className="sr-only">
                          {STATUS_LABELS[status!]}
                        </span>
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-zinc-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-rose-300">
                      Viewing
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100">
                  {member.name}
                </span>
                <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                  {member.year != null && (
                    <span className="rounded border border-zinc-800 bg-zinc-900/80 px-1.5 py-px font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                      {member.year}
                    </span>
                  )}
                  {member.episode_count != null && (
                    <span>{member.episode_count} eps</span>
                  )}
                </span>
              </span>
            </>
          );

          const base =
            "group relative flex items-stretch overflow-hidden rounded-xl border text-left";
          const currentClassName = `${base} border-rose-400/45 bg-rose-400/[0.07]`;

          if (isCurrent) {
            return currentSeasonHref ? (
              <Link
                key={member.id}
                to={currentSeasonHref}
                className={`${currentClassName} transition-colors hover:border-rose-400/70 hover:bg-rose-400/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400`}
              >
                {inner}
              </Link>
            ) : (
              <div key={member.id} className={currentClassName}>
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={member.id}
              to={`/anime/${member.id}`}
              className={`${base} border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700 hover:bg-zinc-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400`}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
