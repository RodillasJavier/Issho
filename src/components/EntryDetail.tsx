/**
 * src/components/EntryDetail.tsx
 *
 * Single-post page: magazine-style article (banner art, title, review) with
 * an "Entry details" sidebar showing the author's LIVE tracking state — their
 * current status/rating for the season from user_anime_entries, plus series
 * context from user_franchise_entries — rather than values frozen into the
 * post. Frozen post values only appear as a fallback when the author no
 * longer tracks the anime.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import supabase from "../supabase-client";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { getEntryTypeLabel } from "../constants/entryTypes";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/animeStatus";
import { UserInfo } from "./UserInfo";
import {
  getUserAnimeEntry,
  countCompletedAnimeEntries,
} from "../services/supabase/userAnimeList";
import { getUserFranchiseEntry } from "../services/supabase/userFranchiseList";
import { useFranchiseMembers } from "../hooks/useFranchiseMembers";
import { franchiseDisplayTitle } from "../utils/franchise";

// #region Types
import type { Entry } from "../types/database.types";

interface EntryDetailProps {
  entryId: string;
  anonymized?: boolean;
}
// #endregion Types

// #region Component Logic
const fetchEntryById = async (id: string): Promise<Entry> => {
  const { data, error } = await supabase
    .from("entries")
    .select(
      `
      *,
      anime(*),
      profile:profiles!user_id(id, username, avatar_url)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data as Entry;
};

export const EntryDetail = ({
  entryId,
  anonymized = false,
}: EntryDetailProps) => {
  const { data, error, isLoading } = useQuery<Entry, Error>({
    queryKey: ["entry", entryId],
    queryFn: () => fetchEntryById(entryId),
  });

  const authorId = data?.user_id;
  const animeId = data?.anime_id;
  const franchiseKey = data?.anime?.franchise_key ?? null;

  // The author's current per-season entry — the live values the sidebar leads with
  const { data: authorSeasonEntry, isLoading: seasonEntryLoading } = useQuery({
    queryKey: ["userAnimeList", animeId, authorId],
    queryFn: () => getUserAnimeEntry(animeId!, authorId!),
    enabled: !!animeId && !!authorId,
  });

  const { franchiseMembers, isMultiEntryFranchise } =
    useFranchiseMembers(franchiseKey);

  const { data: authorFranchiseEntry } = useQuery({
    queryKey: ["userFranchiseList", franchiseKey, authorId],
    queryFn: () => getUserFranchiseEntry(franchiseKey!, authorId!),
    enabled: franchiseKey != null && !!authorId && isMultiEntryFranchise,
  });

  const memberIds = (franchiseMembers ?? []).map((member) => member.id);

  const { data: completedSeasons = 0 } = useQuery({
    queryKey: ["userAnimeList", authorId, "completedCount", memberIds],
    queryFn: () => countCompletedAnimeEntries(authorId!, memberIds),
    enabled: !!authorId && isMultiEntryFranchise && memberIds.length > 0,
  });

  // Live values when the author still tracks the anime; frozen post values otherwise
  const isLive = !!authorSeasonEntry;
  const displayStatus = authorSeasonEntry
    ? authorSeasonEntry.status
    : (data?.status_value ?? null);
  const displayRating = authorSeasonEntry
    ? authorSeasonEntry.rating
    : (data?.rating_value ?? null);

  const seriesTitle = franchiseDisplayTitle(franchiseMembers ?? []);
  // #endregion Component Logic

  // #region Render
  if (isLoading) {
    return <div>Loading entry...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading entry: {error.message}</div>;
  }

  if (!data) {
    return <div>Entry not found</div>;
  }

  const bannerUrl = data.anime?.banner_image_url ?? data.anime?.cover_image_url;
  const ratingDegrees = displayRating ? displayRating * 36 : 0;

  return (
    <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      {/* Entry Details Sidebar */}
      <aside className="mb-8 lg:mb-0">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Entry details
        </p>

        {/* Author Card */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          {anonymized ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm">
                ?
              </div>
              <span className="text-md text-gray-400">Anonymous User</span>
            </div>
          ) : (
            data.profile && (
              <UserInfo
                username={data.profile.username}
                avatarUrl={data.profile.avatar_url}
                size="md"
              />
            )
          )}

          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-rose-400">
            {getEntryTypeLabel(data.entry_type)}
          </p>

          {/* Live watch status */}
          {displayStatus && (
            <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Watch status
              </span>
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold ${STATUS_COLORS[displayStatus]}`}
              >
                {STATUS_LABELS[displayStatus]}
              </span>
            </div>
          )}
          {!isLive &&
            !seasonEntryLoading &&
            (displayStatus || displayRating) && (
              <p className="mt-2 text-[11px] text-neutral-600">
                As of posting — no longer in the author's list
              </p>
            )}
        </section>

        {/* Rating Dial */}
        <section className="mt-5 border-y border-neutral-800 py-6">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            {isLive ? "Current rating" : "Rating"}
          </p>
          <div
            className="mx-auto grid size-28 place-items-center rounded-full p-[5px] shadow-[0_0_28px_rgba(244,63,94,0.14)]"
            style={{
              background: `conic-gradient(#f43f5e 0deg ${ratingDegrees}deg, #262626 ${ratingDegrees}deg 360deg)`,
            }}
          >
            <div className="grid size-full place-items-center rounded-full bg-neutral-950">
              {displayRating ? (
                <p className="font-mono text-3xl font-semibold text-rose-400">
                  {displayRating}
                  <span className="ml-1 text-lg text-neutral-500">/10</span>
                </p>
              ) : (
                <p className="font-mono text-2xl text-neutral-600">—</p>
              )}
            </div>
          </div>
        </section>

        {/* Series Context */}
        {isMultiEntryFranchise && seriesTitle && (
          <section className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Series
            </p>
            <p className="mt-1.5 text-sm font-semibold text-white line-clamp-2">
              {seriesTitle}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {authorFranchiseEntry ? (
                <>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${STATUS_COLORS[authorFranchiseEntry.status]}`}
                  >
                    {STATUS_LABELS[authorFranchiseEntry.status]}
                  </span>
                  {authorFranchiseEntry.rating && (
                    <span className="text-yellow-500 text-sm font-semibold">
                      ⭐ {authorFranchiseEntry.rating}/10
                    </span>
                  )}
                </>
              ) : (
                <span className="px-2.5 py-1 rounded text-xs border border-neutral-700 text-neutral-400">
                  No series status
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              {completedSeasons} / {franchiseMembers?.length ?? 0} seasons
              completed
            </p>
          </section>
        )}

        {/* Reactions */}
        <div className="mt-5">
          <LikeButton entryId={entryId} />
        </div>
      </aside>

      {/* Article */}
      <article className="min-w-0 animate-[entry-fade-in_0.45s_ease-out]">
        {bannerUrl && (
          <div className="overflow-hidden rounded-xl border border-neutral-800 shadow-2xl shadow-black/30">
            <img
              src={bannerUrl}
              alt={data.anime?.name}
              className="h-48 w-full object-cover sm:h-64 lg:h-72"
            />
          </div>
        )}

        <div className="mt-8 max-w-3xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest text-rose-400">
            Anime journal entry
          </p>
          <Link
            to={`/anime/${data.anime_id}`}
            className="block hover:text-rose-300 transition-colors"
          >
            <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
              {data.anime?.name}
            </h1>
          </Link>

          <div className="mt-7 space-y-4">
            {data.content ? (
              <div className="border-l-2 border-rose-400 pl-5">
                <p className="text-[15px] leading-8 text-neutral-300 sm:text-base">
                  {data.content}
                </p>
              </div>
            ) : data.entry_type === "status_update" && data.status_value ? (
              <p className="text-lg text-neutral-300">
                Marked as{" "}
                <span className="font-semibold text-rose-400">
                  {STATUS_LABELS[data.status_value]}
                </span>
              </p>
            ) : data.entry_type === "rating" && data.rating_value ? (
              <p className="text-lg text-neutral-300">
                Rated{" "}
                <span className="font-semibold text-rose-400">
                  {data.rating_value}/10
                </span>{" "}
                at the time of posting
              </p>
            ) : null}
          </div>

          <p className="mt-6 text-sm text-neutral-500">
            Posted on {new Date(data.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Comments */}
        <div className="mt-12 max-w-3xl border-t border-neutral-800 pt-8">
          <CommentSection entryId={entryId} anonymized={anonymized} />
        </div>
      </article>
    </div>
  );
};
// #endregion Render
