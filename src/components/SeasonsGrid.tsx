/**
 * src/components/SeasonsGrid.tsx
 *
 * "Seasons & films" section for the detail pages: a grid of a franchise's
 * member releases. On a season page the current release is highlighted
 * ("Viewing") and not linked; every other release links to its own page.
 */
import { Link } from "react-router";
import { Clock3 } from "lucide-react";
import type { Anime } from "../types/database.types";

interface SeasonsGridProps {
  members: Anime[];
  currentId?: string;
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

export const SeasonsGrid = ({ members, currentId }: SeasonsGridProps) => (
  <section aria-labelledby="seasons-heading">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">
          Series guide
        </p>
        <h2
          id="seasons-heading"
          className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100"
        >
          Seasons &amp; films
        </h2>
      </div>
      <p className="font-mono text-xs text-zinc-600">
        {members.length} {members.length === 1 ? "release" : "releases"}
      </p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      {members.map((member, index) => {
        const isCurrent = member.id === currentId;
        const inner = (
          <>
            {member.cover_image_url ? (
              <img
                src={member.cover_image_url}
                alt=""
                loading="lazy"
                className="size-16 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="size-16 shrink-0 rounded-lg bg-zinc-800" />
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-zinc-600">
                  {String(index + 1).padStart(2, "0")}
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
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-500">
                <Clock3 aria-hidden className="size-3" />
                {meta(member)}
              </span>
            </span>
          </>
        );

        const base =
          "group flex gap-3 rounded-xl border p-3 text-left transition-colors";

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
