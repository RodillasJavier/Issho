/**
 * src/components/FranchiseCard.tsx
 *
 * Browse-grid card for a franchise group. Single-member groups render the
 * classic anime card; multi-member groups render a series card with links to
 * each season/movie.
 */
import { Link } from "react-router";
import { yearRangeLabel, type FranchiseGroup } from "../utils/franchise";

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

  if (!isFranchise) {
    // Single-member franchise: the classic per-anime card
    return (
      <Link to={`/anime/${lead.id}`} className="group block">
        <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
          {/* Cover Image */}
          {lead.cover_image_url ? (
            <img
              src={lead.cover_image_url}
              alt={lead.name}
              loading="lazy"
              decoding="async"
              className="w-full aspect-[2/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-neutral-800 flex items-center justify-center text-neutral-600">
              No Image
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-rose-400 transition-colors">
              {lead.name}
            </h3>

            {/* Metadata Row */}
            <div className="flex flex-wrap gap-2 text-xs">
              {lead.year && (
                <span className="px-2 py-0.5 bg-white/10 rounded">
                  {lead.year}
                </span>
              )}

              {lead.status && (
                <span className="px-2 py-0.5 bg-white/10 rounded">
                  {lead.status}
                </span>
              )}

              {lead.episode_count && (
                <span className="px-2 py-0.5 bg-white/10 rounded">
                  {lead.episode_count} eps
                </span>
              )}
            </div>

            {/* Genres */}
            {lead.genres && (
              <div className="flex flex-wrap gap-1">
                {lead.genres
                  .split(", ")
                  .slice(0, 3)
                  .map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-xs"
                    >
                      {genre}
                    </span>
                  ))}
              </div>
            )}

            {/* Description */}
            {lead.description && (
              <p className="text-sm text-gray-400 line-clamp-3">
                {lead.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Multi-member franchise: series card with per-entry links
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
      {/* Cover Image (earliest member) */}
      <Link to={`/anime/${lead.id}`} className="group block relative">
        {lead.cover_image_url ? (
          <img
            src={lead.cover_image_url}
            alt={group.title}
            loading="lazy"
            decoding="async"
            className="w-full aspect-[2/3] object-cover"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-neutral-800 flex items-center justify-center text-neutral-600">
            No Image
          </div>
        )}
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs font-semibold text-rose-300">
          {group.members.length} entries
        </span>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-2">{group.title}</h3>

        <div className="flex flex-wrap gap-2 text-xs">
          {yearRange && (
            <span className="px-2 py-0.5 bg-white/10 rounded">{yearRange}</span>
          )}
          {lead.genres && (
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded">
              {lead.genres.split(", ")[0]}
            </span>
          )}
        </div>

        {/* Member links */}
        <ul className="space-y-1">
          {group.members.map((anime) => (
            <li key={anime.id}>
              <Link
                to={`/anime/${anime.id}`}
                className="flex justify-between gap-2 px-2 py-1 rounded hover:bg-white/10 text-sm text-gray-300 hover:text-rose-300 transition-colors"
              >
                <span className="line-clamp-1">{anime.name}</span>
                {anime.year && (
                  <span className="text-xs text-gray-500 shrink-0 self-center">
                    {anime.year}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
// #endregion Render
