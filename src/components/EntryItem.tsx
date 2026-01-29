/**
 * src/components/EntryItem.tsx
 *
 * Component that displays a single entry item in a list or feed.
 */
import { Link } from "react-router";
import type { Entry } from "../types/database.types";

// #region Types
interface EntryItemProps {
  entry: Entry;
}
// #endregion

// #region Component Logic
const getEntryTypeLabel = (type: string) => {
  switch (type) {
    case "review":
      return "📝 Review";
    case "rating":
      return "⭐ Rating";
    case "status_update":
      return "📺 Status Update";
    default:
      return type;
  }
};

export const EntryItem = ({ entry }: EntryItemProps) => {
  // #endregion

  // #region Render
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-950 to-rose-400 blur-sm opacity-0 group-hover:opacity-25 transition duration-250" />

      <Link to={`/entry/${entry.id}`} className="relative z-10">
        <div className="w-sm h-sm p-4 gap-2 bg-neutral-950 border border-neutral-800 rounded-md text-white flex flex-col overflow-hidden transition-colors duration-250 group-hover:border-rose-400/50 group-hover:bg-transparent cursor-pointer">
          {/* Header */}
          <div className="flex flex-col flex-1">
            <div className="text-xs text-rose-400 font-semibold mb-1">
              {getEntryTypeLabel(entry.entry_type)}
            </div>

            {entry.anime && (
              <div className="text-md font-semibold">{entry.anime.name}</div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1">
            {entry.anime?.cover_image_url && (
              <img
                src={entry.anime.cover_image_url}
                alt={entry.anime.name}
                className="w-full rounded-sm object-cover max-h-64"
              />
            )}
          </div>

          <div className="flex flex-row py-1 px-2 w-fit gap-2 rounded border border-neutral-800 bg-neutral-900">
            <span className="flex flex-row gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="white"
                className="w-6"
              >
                <path d="M144 224C161.7 224 176 238.3 176 256L176 512C176 529.7 161.7 544 144 544L96 544C78.3 544 64 529.7 64 512L64 256C64 238.3 78.3 224 96 224L144 224zM334.6 80C361.9 80 384 102.1 384 129.4L384 133.6C384 140.4 382.7 147.2 380.2 153.5L352 224L512 224C538.5 224 560 245.5 560 272C560 291.7 548.1 308.6 531.1 316C548.1 323.4 560 340.3 560 360C560 383.4 543.2 402.9 521 407.1C525.4 414.4 528 422.9 528 432C528 454.2 513 472.8 492.6 478.3C494.8 483.8 496 489.8 496 496C496 522.5 474.5 544 448 544L360.1 544C323.8 544 288.5 531.6 260.2 508.9L248 499.2C232.8 487.1 224 468.7 224 449.2L224 262.6C224 247.7 227.5 233 234.1 219.7L290.3 107.3C298.7 90.6 315.8 80 334.6 80z" />
              </svg>
              {entry.vote_count ?? 0}
            </span>

            <span className="rounded w-0.25 bg-neutral-700" />

            <span className="flex flex-row gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="white"
                className="w-6"
              >
                <path d="M576 304C576 436.5 461.4 544 320 544C282.9 544 247.7 536.6 215.9 523.3L97.5 574.1C88.1 578.1 77.3 575.8 70.4 568.3C63.5 560.8 62 549.8 66.8 540.8L115.6 448.6C83.2 408.3 64 358.3 64 304C64 171.5 178.6 64 320 64C461.4 64 576 171.5 576 304z" />
              </svg>
              {entry.comment_count ?? 0}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
// #endregion
