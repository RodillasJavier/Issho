/**
 * src/components/CreateEntry.tsx
 *
 * The Create Entry composer: pick an anime (search or from your lists), choose
 * whether the entry is about a single season or the whole series, set a
 * one-click status and 1–10 rating, and write optional thoughts. Publishing
 * updates the matching list (per-season or series-level) and, when there's a
 * status or review, posts a feed entry.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  CircleDot,
  CircleX,
  Search,
  Send,
  Star,
} from "lucide-react";
import supabase from "../supabase-client";
import { useAuth } from "../hooks/useAuth";
import { useFranchiseMembers } from "../hooks/useFranchiseMembers";
import {
  getUserAnimeEntry,
  fetchAllUserAnimeEntries,
} from "../services/supabase/userAnimeList";
import {
  getUserFranchiseEntry,
  addUserFranchiseEntry,
  updateUserFranchiseEntry,
} from "../services/supabase/userFranchiseList";
import { franchiseDisplayTitle, franchiseRootMember } from "../utils/franchise";

// #region Types & Constants
import type { Anime, AnimeStatus } from "../types/database.types";

type Scope = "season" | "franchise";

interface PublishInput {
  anime: Anime;
  scope: Scope;
  franchiseKey: number | null;
  anchorAnimeId: string;
  status: AnimeStatus | null;
  rating: number | null;
  review: string;
}

const REVIEW_MAX = 2000;
const PICKER_LIMIT = 10;

const STATUS_OPTIONS: {
  value: AnimeStatus;
  label: string;
  subtitle: string;
  icon: typeof CircleDot;
}[] = [
  {
    value: "watching",
    label: "Watching",
    subtitle: "I'm partway through",
    icon: CircleDot,
  },
  {
    value: "completed",
    label: "Completed",
    subtitle: "I finished it",
    icon: CheckCircle2,
  },
  {
    value: "not_started",
    label: "Plan to watch",
    subtitle: "Saving it for later",
    icon: Star,
  },
  {
    value: "dropped",
    label: "Dropped",
    subtitle: "Not for me",
    icon: CircleX,
  },
];

const LIST_TABS: { value: AnimeStatus; label: string }[] = [
  { value: "not_started", label: "To watch" },
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];
// #endregion

// #region Data
const fetchAllAnime = async (): Promise<Anime[]> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Anime[];
};

// Upsert the per-season list row directly (no auto status_update entries — we
// post one combined entry below instead).
const upsertSeasonList = async (
  animeId: string,
  userId: string,
  updates: {
    status?: AnimeStatus;
    rating?: number | null;
    review?: string | null;
  }
) => {
  const existing = await getUserAnimeEntry(animeId, userId);
  if (existing) {
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("user_anime_entries")
        .update(updates)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("user_anime_entries").insert({
      anime_id: animeId,
      user_id: userId,
      status: updates.status ?? "not_started",
      rating: updates.rating ?? null,
      review: updates.review ?? null,
    });
    if (error) throw new Error(error.message);
  }
};

// Upsert the series-level list row (these service calls create no feed rows).
const upsertFranchiseList = async (
  franchiseKey: number,
  userId: string,
  updates: {
    status?: AnimeStatus;
    rating?: number | null;
    review?: string | null;
  }
) => {
  const existing = await getUserFranchiseEntry(franchiseKey, userId);
  if (existing) {
    if (Object.keys(updates).length > 0) {
      await updateUserFranchiseEntry(existing.id, updates);
    }
    return;
  }
  const created = await addUserFranchiseEntry(
    franchiseKey,
    userId,
    updates.status ?? "not_started"
  );
  const postCreate: typeof updates = {};
  if (updates.rating != null) postCreate.rating = updates.rating;
  if (updates.review) postCreate.review = updates.review;
  if (Object.keys(postCreate).length > 0) {
    await updateUserFranchiseEntry(created.id, postCreate);
  }
};

const publishEntry = async (input: PublishInput, userId: string) => {
  const { anime, scope, franchiseKey, anchorAnimeId, status, rating, review } =
    input;
  const trimmedReview = review.trim();

  const listUpdates = {
    ...(status ? { status } : {}),
    ...(rating != null ? { rating } : {}),
    ...(trimmedReview ? { review: trimmedReview } : {}),
  };

  if (scope === "franchise" && franchiseKey != null) {
    await upsertFranchiseList(franchiseKey, userId, listUpdates);
  } else {
    await upsertSeasonList(anime.id, userId, listUpdates);
  }

  // A rating alone never creates a post — the entry page shows current rating
  // live. Only status and/or review produce a feed entry.
  if (!trimmedReview && !status) return;

  const { error } = await supabase.from("entries").insert({
    user_id: userId,
    anime_id: scope === "franchise" ? anchorAnimeId : anime.id,
    entry_type: trimmedReview ? "review" : "status_update",
    content: trimmedReview || null,
    rating_value: rating ?? null,
    status_value: status ?? null,
    franchise_key: scope === "franchise" ? franchiseKey : null,
  });
  if (error) throw new Error(error.message);
};
// #endregion

// #region Component
export const CreateEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [scope, setScope] = useState<Scope>("season");
  const [status, setStatus] = useState<AnimeStatus | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");

  const [search, setSearch] = useState("");
  // null = search the whole catalogue; a status = search within that list
  const [activeTab, setActiveTab] = useState<AnimeStatus | null>(null);

  const { data: allAnime } = useQuery<Anime[], Error>({
    queryKey: ["anime"],
    queryFn: fetchAllAnime,
  });

  const { data: userList } = useQuery({
    queryKey: ["userAnimeList", user?.id, "all"],
    queryFn: () => fetchAllUserAnimeEntries(user!.id),
    enabled: !!user,
  });

  const { franchiseMembers, isMultiEntryFranchise } = useFranchiseMembers(
    selectedAnime?.franchise_key ?? null
  );

  const rootAnchor =
    (franchiseMembers &&
      franchiseRootMember(
        franchiseMembers,
        selectedAnime?.franchise_key ?? null
      )) ??
    selectedAnime;

  const isFranchiseScope = scope === "franchise" && isMultiEntryFranchise;
  const seriesTitle = franchiseDisplayTitle(franchiseMembers ?? []);
  const displayTitle = isFranchiseScope
    ? (seriesTitle ?? selectedAnime?.name)
    : selectedAnime?.name;

  // The picker searches within the selected list, or the whole catalogue when
  // no list tab is active. Capped so long watch lists / large catalogues stay
  // scannable — searching narrows things down.
  const pickerResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = (anime: Anime) =>
      !query ||
      anime.name.toLowerCase().includes(query) ||
      (anime.name_japanese?.toLowerCase().includes(query) ?? false);

    const source = activeTab
      ? (userList ?? [])
          .filter((entry) => entry.status === activeTab && entry.anime)
          .map((entry) => entry.anime as Anime)
      : (allAnime ?? []);

    const matched = source.filter(matches);
    return {
      items: matched.slice(0, PICKER_LIMIT),
      hasMore: matched.length > PICKER_LIMIT,
    };
  }, [activeTab, search, userList, allAnime]);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("User not authenticated");
      if (!selectedAnime) throw new Error("No anime selected");
      return publishEntry(
        {
          anime: selectedAnime,
          scope: isFranchiseScope ? "franchise" : "season",
          franchiseKey: selectedAnime.franchise_key,
          anchorAnimeId: rootAnchor?.id ?? selectedAnime.id,
          status,
          rating,
          review,
        },
        user.id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["animeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["franchiseEntries"] });
      queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
      queryClient.invalidateQueries({ queryKey: ["userFranchiseList"] });
      navigate("/");
    },
  });

  const handleSelect = (anime: Anime) => {
    setSelectedAnime(anime);
    setScope("season");
    setSearch("");
  };

  const canPublish =
    !!selectedAnime && (!!status || rating != null || !!review.trim());

  // #region Render
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Left column */}
      <div className="flex flex-col gap-10">
        {/* 01 Pick an anime */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs font-semibold text-rose-400">
                01
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Pick an anime
              </h2>
            </div>
            <Link
              to="/anime"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
            >
              Browse all anime
            </Link>
          </div>

          {selectedAnime ? (
            <SelectedAnime
              title={displayTitle ?? "Unknown"}
              anime={selectedAnime}
              isFranchise={isMultiEntryFranchise}
              scope={scope}
              onScopeChange={setScope}
              onChange={() => setSelectedAnime(null)}
            />
          ) : (
            <div className="mt-4">
              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#101014] px-4 py-3 focus-within:border-rose-400/60">
                <Search aria-hidden className="size-5 shrink-0 text-zinc-500" />
                <span className="sr-only">Search anime</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, season, or alternate name"
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-zinc-800">
                {LIST_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() =>
                      setActiveTab(activeTab === tab.value ? null : tab.value)
                    }
                    className={`-mb-px cursor-pointer border-b-2 pb-2 text-sm font-medium transition-colors ${
                      activeTab === tab.value
                        ? "border-rose-400 text-rose-300"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <span className="ml-auto pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  {activeTab ? "In your list" : "Full catalogue"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {pickerResults.items.length > 0 ? (
                  <>
                    {pickerResults.items.map((anime) => (
                      <PickRow
                        key={anime.id}
                        anime={anime}
                        onSelect={() => handleSelect(anime)}
                      />
                    ))}
                    {pickerResults.hasMore && (
                      <p className="pt-1 text-center text-xs text-zinc-600">
                        Showing the first {PICKER_LIMIT} — refine your search to
                        see more.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="py-6 text-center text-sm text-zinc-500">
                    {activeTab && !search.trim() ? (
                      "Nothing in this list yet."
                    ) : (
                      <>
                        No matches. Try{" "}
                        <Link to="/anime" className="text-rose-300 underline">
                          Browse all anime
                        </Link>{" "}
                        to add it.
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 03 Your thoughts */}
        <section>
          <p className="font-mono text-xs font-semibold text-rose-400">03</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            Your thoughts{" "}
            <span className="text-base text-zinc-500">optional</span>
          </h2>

          <textarea
            value={review}
            maxLength={REVIEW_MAX}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What's on your mind? A first impression, a final verdict, or just a moment you loved..."
            rows={8}
            className="mt-4 w-full resize-y rounded-xl border border-zinc-800 bg-[#101014] px-4 py-3 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-rose-400/60"
          />
          <p className="mt-2 text-xs text-zinc-600">
            {review.length}/{REVIEW_MAX} · Be kind and keep spoilers tagged.
          </p>
        </section>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-6">
        {/* 02 Where are you? */}
        <section className="rounded-xl border border-zinc-800 bg-[#0c0c0f] p-5">
          <p className="font-mono text-xs font-semibold text-rose-400">02</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Where are you?
          </h2>

          <div className="mt-4 space-y-2">
            {STATUS_OPTIONS.map((option) => {
              const active = status === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(active ? null : option.value)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-rose-400/60 bg-rose-400/10"
                      : "border-zinc-800 bg-[#101014] hover:border-zinc-700"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 ${active ? "text-rose-300" : "text-zinc-500"}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-zinc-100">
                      {option.label}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {option.subtitle}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rating */}
        <section className="rounded-xl border border-zinc-800 bg-[#0c0c0f] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Optional
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Your rating
              </h2>
            </div>
            {rating != null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="cursor-pointer text-sm text-zinc-500 transition-colors hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div
              className="grid size-24 shrink-0 place-items-center rounded-full p-[5px] shadow-[0_0_28px_rgba(244,63,94,0.14)]"
              style={{
                background: `conic-gradient(#f43f5e 0deg ${(rating ?? 0) * 36}deg, #27272a ${(rating ?? 0) * 36}deg 360deg)`,
              }}
            >
              <div className="grid size-full place-items-center rounded-full bg-[#0c0c0f]">
                <p className="font-mono text-2xl font-semibold text-rose-400">
                  {rating ?? "—"}
                  <span className="ml-0.5 text-sm text-zinc-500">/10</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Tap a score. You can still share an entry without one.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(rating === value ? null : value)}
                className={`cursor-pointer rounded-md border py-2 text-sm font-semibold transition-colors ${
                  rating === value
                    ? "border-rose-400/60 bg-rose-400/10 text-rose-200"
                    : "border-zinc-800 bg-[#101014] text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </section>

        <div>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={!canPublish || isPending}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" />
            {isPending ? "Publishing..." : "Publish entry"}
          </button>
          <p className="mt-3 text-center text-xs text-zinc-600">
            You can publish a status, rating, review—or any combination.
          </p>
          {isError && (
            <p className="mt-3 text-center text-sm text-red-400">
              {error?.message ?? "Something went wrong."} Please try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
  // #endregion Render
};
// #endregion

// #region Subcomponents
const PickRow = ({
  anime,
  onSelect,
}: {
  anime: Anime;
  onSelect: () => void;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#101014] p-3">
    {anime.cover_image_url ? (
      <img
        src={anime.cover_image_url}
        alt=""
        loading="lazy"
        className="size-12 shrink-0 rounded-md object-cover"
      />
    ) : (
      <div className="size-12 shrink-0 rounded-md bg-zinc-800" />
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-zinc-100">
        {anime.name}
      </p>
      {anime.year && <p className="text-xs text-zinc-500">{anime.year}</p>}
    </div>
    <button
      type="button"
      onClick={onSelect}
      className="shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-rose-300"
    >
      Select
    </button>
  </div>
);

const SelectedAnime = ({
  title,
  anime,
  isFranchise,
  scope,
  onScopeChange,
  onChange,
}: {
  title: string;
  anime: Anime;
  isFranchise: boolean;
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  onChange: () => void;
}) => (
  <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/[0.04] p-4">
    <div className="flex items-center gap-4">
      {anime.cover_image_url ? (
        <img
          src={anime.cover_image_url}
          alt=""
          className="size-16 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="size-16 shrink-0 rounded-md bg-zinc-800" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-white">{title}</p>
        {anime.year && <p className="text-xs text-zinc-500">{anime.year}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 cursor-pointer text-sm text-zinc-500 transition-colors hover:text-zinc-200"
      >
        Change
      </button>
    </div>

    {isFranchise && (
      <div className="mt-4 inline-flex rounded-lg border border-zinc-800 bg-[#101014] p-1">
        {(
          [
            { value: "season", label: "This season" },
            { value: "franchise", label: "Whole series" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onScopeChange(option.value)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === option.value
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    )}
  </div>
);
// #endregion
