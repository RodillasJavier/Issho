/**
 * src/components/SearchResultCard.tsx
 *
 * A single result in the unified /anime search grid. Represents one title,
 * backed by a local anime row, an AniList search hit, or both. Adding it to
 * your list transparently imports it from AniList first when it isn't local
 * yet — the "add to database" step is never shown. Reuses useListStatusEntry
 * so the status picker matches the anime detail page.
 */
import { ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useListStatusEntry } from "../hooks/useListStatusEntry";
import { StatusPickerDropdown } from "./StatusPickerDropdown";
import { getAnimeByAnilistId } from "../api/animeImport";
import { addAniListAnimeToList } from "../api/watchlist";
import {
  getUserAnimeEntry,
  addUserAnimeEntry,
  updateUserAnimeEntry,
  removeUserAnimeEntry,
} from "../services/supabase/userAnimeList";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import { splitGenres } from "../utils/anime";
import type { AnimeStatus, Anime } from "../types/database.types";
import type { AniListMedia } from "../services/anilistApi";

// #region Types
interface SearchResultCardProps {
  localAnime: Anime | null;
  anilistMedia: AniListMedia | null;
}
// #endregion Types

// #region Component Logic
export const SearchResultCard = ({
  localAnime,
  anilistMedia,
}: SearchResultCardProps) => {
  const { user } = useAuth();

  const anilistId = anilistMedia?.id ?? localAnime?.anilist_id ?? null;

  const title =
    localAnime?.name ??
    anilistMedia?.title.english ??
    anilistMedia?.title.romaji ??
    "Unknown Anime";
  const romaji = anilistMedia?.title.romaji ?? null;
  const showRomaji =
    !localAnime && romaji != null && romaji !== anilistMedia?.title.english;
  const coverUrl =
    localAnime?.cover_image_url ?? anilistMedia?.coverImage.large ?? null;
  const year =
    localAnime?.year ??
    anilistMedia?.seasonYear ??
    anilistMedia?.startDate.year ??
    null;
  const genres = (
    localAnime?.genres != null
      ? splitGenres(localAnime.genres)
      : (anilistMedia?.genres ?? [])
  ).slice(0, 2);
  const localHref = localAnime ? `/anime/${localAnime.id}` : null;

  const {
    entry: listEntry,
    isLoading,
    showStatusPicker,
    setShowStatusPicker,
    handleStatusSelect,
    isMutating,
  } = useListStatusEntry({
    queryKey: ["searchListEntry", anilistId ?? localAnime?.id, user?.id],
    getEntry: async () => {
      const local =
        localAnime ??
        (anilistId != null ? await getAnimeByAnilistId(anilistId) : null);
      if (!local) return null;
      return getUserAnimeEntry(local.id, user!.id);
    },
    addEntry: (status: AnimeStatus) =>
      localAnime
        ? addUserAnimeEntry(localAnime.id, user!.id, status)
        : addAniListAnimeToList(anilistId!, user!.id, status),
    updateEntry: (entryId, status) => updateUserAnimeEntry(entryId, { status }),
    removeEntry: (entryId) => removeUserAnimeEntry(entryId),
    invalidateKeys: [
      ["searchListEntry", anilistId ?? localAnime?.id, user?.id],
      ["userAnimeList", user?.id],
      ["anime"],
      ["entries"],
    ],
    enabled: !!user,
  });
  // #endregion Component Logic

  // #region Render
  const titleClasses =
    "line-clamp-2 text-base font-semibold tracking-tight text-zinc-100";

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#101014] shadow-sm shadow-black/20">
      {localHref ? (
        <Link
          to={localHref}
          className="group block overflow-hidden bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-400"
        >
          <Cover coverUrl={coverUrl} title={title} interactive />
        </Link>
      ) : (
        <div className="overflow-hidden bg-zinc-900">
          <Cover coverUrl={coverUrl} title={title} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        {localHref ? (
          <Link
            to={localHref}
            className={`${titleClasses} transition-colors hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400`}
          >
            {title}
          </Link>
        ) : (
          <h3 className={titleClasses}>{title}</h3>
        )}

        {showRomaji && (
          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{romaji}</p>
        )}

        <p className="mt-2 text-xs text-zinc-500">
          {[year, genres.join(", ") || null].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-4 flex-1" />

        <ListControl
          hasUser={!!user}
          isLoading={isLoading}
          listEntry={listEntry}
          showStatusPicker={showStatusPicker}
          setShowStatusPicker={setShowStatusPicker}
          handleStatusSelect={handleStatusSelect}
          isMutating={isMutating}
        />
      </div>
    </article>
  );
  // #endregion Render
};

// #region Subcomponents
const Cover = ({
  coverUrl,
  title,
  interactive = false,
}: {
  coverUrl: string | null;
  title: string;
  interactive?: boolean;
}) =>
  coverUrl ? (
    <img
      src={coverUrl}
      alt={title}
      loading="lazy"
      decoding="async"
      className={`aspect-[2/3] w-full object-cover ${
        interactive
          ? "transition-transform duration-300 group-hover:scale-[1.03]"
          : ""
      }`}
    />
  ) : (
    <div className="flex aspect-[2/3] w-full items-center justify-center text-neutral-600">
      No Image
    </div>
  );

const ListControl = ({
  hasUser,
  isLoading,
  listEntry,
  showStatusPicker,
  setShowStatusPicker,
  handleStatusSelect,
  isMutating,
}: {
  hasUser: boolean;
  isLoading: boolean;
  listEntry: { status: AnimeStatus } | null | undefined;
  showStatusPicker: boolean;
  setShowStatusPicker: (value: boolean) => void;
  handleStatusSelect: (status: AnimeStatus) => void;
  isMutating: boolean;
}) => {
  const buttonBase =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400";

  // Signed out: send them to sign in rather than exposing the add action.
  if (!hasUser) {
    return (
      <Link
        to="/signin"
        className={`${buttonBase} bg-rose-500 text-white hover:bg-rose-600`}
      >
        + Add to list
      </Link>
    );
  }

  if (isLoading) {
    return (
      <div className={`${buttonBase} cursor-default bg-zinc-800 text-zinc-500`}>
        Loading...
      </div>
    );
  }

  return (
    <div className="relative">
      {listEntry ? (
        <button
          type="button"
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={`${buttonBase} cursor-pointer ${STATUS_COLORS[listEntry.status]}`}
        >
          {STATUS_LABELS[listEntry.status]}
          <ChevronDown className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className={`${buttonBase} cursor-pointer bg-rose-500 text-white hover:bg-rose-600`}
        >
          + Add to list
        </button>
      )}

      {showStatusPicker && (
        <>
          <div className="absolute bottom-full left-0 z-100 mb-2 min-w-[200px] rounded border border-neutral-800 bg-neutral-900 shadow-lg">
            <StatusPickerDropdown
              currentStatus={listEntry?.status}
              onSelect={handleStatusSelect}
              isMutating={isMutating}
            />
          </div>

          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowStatusPicker(false)}
          />
        </>
      )}
    </div>
  );
};
// #endregion Subcomponents
