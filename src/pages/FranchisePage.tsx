/**
 * src/pages/FranchisePage.tsx
 *
 * Series landing page (route /series/:franchiseKey): a full-bleed hero built
 * from the franchise's root member, series-level tracking, a "Seasons & films"
 * grid linking to each season, and the series-level community feed.
 */
import { useMemo } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useFranchiseMembers } from "../hooks/useFranchiseMembers";
import {
  franchiseDisplayTitle,
  franchiseRootMember,
  yearRangeLabel,
} from "../utils/franchise";
import { splitGenres } from "../utils/anime";
import { DetailHero } from "../components/DetailHero";
import { SeasonsGrid } from "../components/SeasonsGrid";
import { WatchStatusBadge } from "../components/WatchStatusBadge";
import { CommunityEntriesSection } from "../components/CommunityEntriesSection";
import { FranchiseListButton } from "../components/FranchiseListButton";
import { fetchEntriesWithCounts } from "../services/supabase/entries";
import { getUserFranchiseEntry } from "../services/supabase/userFranchiseList";

export const FranchisePage = () => {
  const { franchiseKey: franchiseKeyParam } = useParams<{
    franchiseKey: string;
  }>();
  const franchiseKey = Number(franchiseKeyParam);
  const validKey = !Number.isNaN(franchiseKey);
  const { user } = useAuth();

  const { franchiseMembers } = useFranchiseMembers(
    validKey ? franchiseKey : null
  );

  const { data: franchiseEntry } = useQuery({
    queryKey: ["userFranchiseList", franchiseKey, user?.id],
    queryFn: () => getUserFranchiseEntry(franchiseKey, user!.id),
    enabled: !!user && validKey,
  });

  // Shares the ["entries"] cache with the homepage feed/Friends page (per
  // CLAUDE.md), so this never triggers its own fetch once that's warm, and
  // gets the same accurate like/dislike/comment counts they do.
  const { data: allEntries } = useQuery({
    queryKey: ["entries"],
    queryFn: fetchEntriesWithCounts,
  });
  const seriesEntries = useMemo(
    () =>
      (allEntries ?? []).filter(
        (entry) => entry.franchise_key === franchiseKey
      ),
    [allEntries, franchiseKey]
  );

  // #region Render
  if (!validKey) {
    return <div className="text-gray-400">Series not found.</div>;
  }

  if (!franchiseMembers) {
    return <div className="h-64 w-full animate-pulse rounded-xl bg-white/5" />;
  }

  if (franchiseMembers.length === 0) {
    return <div className="text-gray-400">This series has no seasons yet.</div>;
  }

  const title = franchiseDisplayTitle(franchiseMembers) ?? "Series";
  const root = franchiseRootMember(franchiseMembers, franchiseKey)!;
  const bannerUrl = root.banner_image_url ?? root.cover_image_url ?? null;
  const yearRange = yearRangeLabel(
    franchiseMembers
      .map((member) => member.year)
      .filter((year): year is number => year != null)
  );
  const subtitle = [root.name_japanese, yearRange].filter(Boolean).join(" · ");
  const genres = splitGenres(root.genres);

  return (
    <div className="flex flex-col gap-10">
      <DetailHero
        bannerUrl={bannerUrl}
        eyebrow="Series"
        title={title}
        subtitle={subtitle || undefined}
        statusBadge={
          franchiseEntry ? (
            <WatchStatusBadge status={franchiseEntry.status} />
          ) : undefined
        }
        genres={genres}
        description={root.description}
        actions={
          <>
            {user && <FranchiseListButton franchiseKey={franchiseKey} />}
            <Link
              to="/entry/create"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/45 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            >
              <Plus aria-hidden className="size-4 text-rose-300" />
              Create an entry
            </Link>
          </>
        }
      />

      <SeasonsGrid members={franchiseMembers} />

      <CommunityEntriesSection
        entries={seriesEntries}
        emptyMessage="No series-level posts yet. Share your thoughts on the whole series!"
      />
    </div>
  );
  // #endregion Render
};
