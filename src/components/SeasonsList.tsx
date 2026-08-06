/**
 * src/components/SeasonsList.tsx
 *
 * "Seasons & films" list in DetailSidebar: a single-column list of a
 * franchise's member releases, sized for the sidebar rather than the page's
 * full width. On a season page the current release is highlighted
 * ("Viewing") and not linked; every other release links to its own page.
 * Each row shows the viewer's watch status for that release (when known),
 * and a "X of Y completed" progress bar summarizes the whole franchise.
 */
import { Link } from "react-router";
import { Clock3 } from "lucide-react";
import { WatchStatusBadge } from "./WatchStatusBadge";
import type { Anime, AnimeStatus } from "../types/database.types";

interface SeasonsListProps {
  members: Anime[];
  currentId?: string;
  statusByAnimeId?: Record<string, AnimeStatus>;
}

const meta = (anime: Anime): string =>
  [
    anime.year?.toString(),
    anime.episode_count
      ? `${anime.episode_count} ${anime.episode_count === 1 ? "episode" : "episodes"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const SeasonsList = ({
  members,
  currentId,
  statusByAnimeId,
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
            className="mt-1.5 h-[5px] w-full overflow-hidden rounded-full bg-zinc-800"
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
          const inner = (
            <>
              {member.cover_image_url ? (
                <img
                  src={member.cover_image_url}
                  alt=""
                  loading="lazy"
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="size-14 shrink-0 rounded-lg bg-zinc-800" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {status && <WatchStatusBadge status={status} />}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-rose-300">
                      Viewing
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-zinc-100">
                  {member.name}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500">
                  <Clock3 aria-hidden className="size-3" />
                  {meta(member)}
                </span>
              </span>
            </>
          );

          const base =
            "group flex gap-3 rounded-xl border p-2.5 text-left transition-colors";

          return isCurrent ? (
            <div
              key={member.id}
              className={`${base} border-rose-400/45 bg-rose-400/[0.07]`}
            >
              {inner}
            </div>
          ) : (
            <Link
              key={member.id}
              to={`/anime/${member.id}`}
              className={`${base} border-zinc-800 bg-[#101014] hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400`}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
