/**
 * src/components/AnimeFeed.tsx
 *
 * Component that displays a feed of entries related to a specific anime.
 */
import { useState } from "react";
import { Link } from "react-router";
import type { Anime, Entry } from "../types/database.types";
import supabase from "../supabase-client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { EntryItem } from "./EntryItem";
import { AddToListButton } from "./AddToListButton";
import { EditListEntryModal } from "./EditListEntryModal";
import { FranchiseListButton } from "./FranchiseListButton";
import { EditFranchiseEntryModal } from "./EditFranchiseEntryModal";
import { AnimeHeader } from "./AnimeHeader";
import { fetchAnime } from "../services/supabase/anime";
import { getUserAnimeEntry } from "../services/supabase/userAnimeList";
import { getUserFranchiseEntry } from "../services/supabase/userFranchiseList";
import { useFranchiseMembers } from "../hooks/useFranchiseMembers";
import { franchiseDisplayTitle } from "../utils/franchise";

// #region Types
interface AnimeFeedProps {
  animeId: string;
}
// #endregion

// #region Component Logic

/**
 * Fetch anime entries for a specific anime.
 *
 * @param animeId uuid of the anime
 * @returns List of entries for the anime
 */
const fetchAnimeEntries = async (animeId: string): Promise<Entry[]> => {
  const { data, error } = await supabase
    .from("entries")
    .select(
      `
      *,
      anime(name, cover_image_url),
      profile:profiles!user_id(id, username, avatar_url)
    `
    )
    .eq("anime_id", animeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Entry[];
};

export const AnimeFeed = ({ animeId }: AnimeFeedProps) => {
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFranchiseModal, setShowFranchiseModal] = useState(false);

  const { data, isLoading, error } = useQuery<Entry[], Error>({
    queryKey: ["animeEntries", animeId],
    queryFn: () => fetchAnimeEntries(animeId),
  });

  const { data: listEntry } = useQuery({
    queryKey: ["userAnimeList", animeId, user?.id],
    queryFn: () => getUserAnimeEntry(animeId, user!.id),
    enabled: !!user,
  });

  const { data: anime } = useQuery<Anime, Error>({
    queryKey: ["anime", animeId],
    queryFn: () => fetchAnime(animeId),
  });

  const franchiseKey = anime?.franchise_key ?? null;

  // Series-level UI only appears for real multi-entry franchises
  const { franchiseMembers, isMultiEntryFranchise } =
    useFranchiseMembers(franchiseKey);
  const franchiseTitle =
    franchiseDisplayTitle(franchiseMembers ?? []) ??
    anime?.franchise_title ??
    anime?.name ??
    "this series";

  const { data: franchiseEntry } = useQuery({
    queryKey: ["userFranchiseList", franchiseKey, user?.id],
    queryFn: () => getUserFranchiseEntry(franchiseKey!, user!.id),
    enabled: !!user && franchiseKey != null && isMultiEntryFranchise,
  });
  // #endregion

  // #region Render
  if (isLoading) {
    return <div>Loading entries...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading entries: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Anime Header */}
      <AnimeHeader animeId={animeId} />

      {/* Add to List Buttons (per-entry, plus series-level for franchises) */}
      {user && (
        <div className="flex justify-center gap-3 flex-wrap">
          <AddToListButton
            animeId={animeId}
            onEditClick={() => setShowEditModal(true)}
          />
          {isMultiEntryFranchise && franchiseKey != null && (
            <FranchiseListButton
              franchiseKey={franchiseKey}
              onEditClick={() => setShowFranchiseModal(true)}
            />
          )}
        </div>
      )}

      {/* Franchise seasons — always the full list, current one highlighted
          rather than omitted, so the layout stays stable while navigating
          between seasons */}
      {isMultiEntryFranchise && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-rose-300">
            Seasons in {franchiseTitle}
          </h3>
          <div className="flex flex-wrap gap-2">
            {franchiseMembers?.map((member) =>
              member.id === animeId ? (
                <span
                  key={member.id}
                  className="px-3 py-1.5 bg-rose-500/20 border border-rose-400/50 rounded text-sm font-semibold text-rose-300"
                >
                  {member.name}
                  {member.year && (
                    <span className="text-rose-400/70"> · {member.year}</span>
                  )}
                </span>
              ) : (
                <Link
                  key={member.id}
                  to={`/anime/${member.id}`}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-rose-400/50 rounded text-sm text-gray-300 hover:text-rose-300 transition-colors"
                >
                  {member.name}
                  {member.year && (
                    <span className="text-neutral-500"> · {member.year}</span>
                  )}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      {/* Entries Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-rose-300">
          Community Activity
        </h3>

        {data && data.length > 0 ? (
          <div className="flex flex-wrap gap-6 justify-center">
            {data.map((entry) => (
              <EntryItem key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">
            No activity for this anime yet. Be the first to post!
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && listEntry && (
        <EditListEntryModal
          entry={listEntry}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Series Edit Modal */}
      {showFranchiseModal && franchiseEntry && (
        <EditFranchiseEntryModal
          entry={franchiseEntry}
          franchiseTitle={franchiseTitle}
          onClose={() => setShowFranchiseModal(false)}
        />
      )}
    </div>
  );
};
// #endregion Render
