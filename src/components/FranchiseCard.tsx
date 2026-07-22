/**
 * src/components/FranchiseCard.tsx
 *
 * Browse-grid card for a franchise group. Multi-member groups carry an
 * "N entries" badge and a "Series" tag; single-member groups render as a
 * plain per-anime card. Either way the whole card links to the lead entry's
 * anime page (where series-level controls live).
 */
import { Link } from "react-router";
import { yearRangeLabel, type FranchiseGroup } from "../utils/franchise";
import { splitGenres } from "../utils/anime";

// #region Types
interface FranchiseCardProps {
  group: FranchiseGroup;
}
// #endregion Types

// #region Render
export const FranchiseCard = ({ group }: FranchiseCardProps) => {
  const lead = group.members[0];
  const isFranchise = group.members.length > 1;

  const yearRange = yearRangeLabel(
    group.members
      .map((anime) => anime.year)
      .filter((year): year is number => year != null)
  );

  // Multi-member franchises open the Series page; singletons open the anime.
  const href =
    isFranchise && group.franchiseKey != null
      ? `/series/${group.franchiseKey}`
      : `/anime/${lead.id}`;
  const title = isFranchise ? group.title : lead.name;
  const badge = isFranchise ? "Series" : (lead.year?.toString() ?? null);
  const metaLine = isFranchise
    ? yearRange
    : lead.episode_count
      ? `${lead.episode_count} ${lead.episode_count === 1 ? "episode" : "episodes"}`
      : (lead.format ?? null);
  const genres = splitGenres(lead.genres).slice(0, 2);

  return (
    <Link
      to={href}
      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-[#101014] shadow-sm shadow-black/20 transition-colors hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
    >
      <div className="relative overflow-hidden bg-zinc-900">
        {lead.cover_image_url ? (
          <img
            src={lead.cover_image_url}
            alt={title}
            loading="lazy"
            decoding="async"
            className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center text-neutral-600">
            No Image
          </div>
        )}

        {isFranchise && (
          <span className="absolute right-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold text-rose-300 backdrop-blur">
            {group.members.length} entries
          </span>
        )}
      </div>

      <div className="p-4">
        {badge && (
          <span className="inline-block rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {badge}
          </span>
        )}

        <h3 className="mt-3 line-clamp-2 text-base font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-rose-200">
          {title}
        </h3>

        {metaLine && (
          <p className="mt-1 truncate text-sm text-zinc-400">{metaLine}</p>
        )}

        {genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {genres.map((genre) => (
              <span
                key={genre}
                className="rounded bg-zinc-800 px-1.5 py-1 text-[10px] text-zinc-500"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};
// #endregion Render
