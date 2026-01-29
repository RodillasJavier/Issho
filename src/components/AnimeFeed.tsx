/**
 * src/components/AnimeFeed.tsx
 *
 * Component that displays a feed of entries related to a specific anime.
 */
import { useState } from "react";
import type { Entry } from "../types/database.types";
import supabase from "../supabase-client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { EntryItem } from "./EntryItem";

import { AddToListButton } from "./AddToListButton";
import { EditListEntryModal } from "./EditListEntryModal";

import { getUserAnimeEntry } from "../api/userAnimeList";

// #region Types
interface AnimeFeedProps {
  animeId: string;
}
// #endregion

// #region Component Logic
const fetchAnimeEntries = async (animeId: string): Promise<Entry[]> => {
  const { data, error } = await supabase
    .from("entries")
    .select("*, anime(name, cover_image_url)")
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

  const { data, isLoading, error } = useQuery<Entry[], Error>({
    queryKey: ["animeEntries", animeId],
    queryFn: () => fetchAnimeEntries(animeId),
  });

  const { data: listEntry } = useQuery({
    queryKey: ["userAnimeList", animeId, user?.id],
    queryFn: () => getUserAnimeEntry(animeId, user!.id),
    enabled: !!user,
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
    <div className="flex flex-col gap-2">
      <h2 className="text-5xl font-semibold text-center bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
        {data && data[0]?.anime?.name}
      </h2>

      {/* Add to List Button */}
      {user && (
        <div className="flex justify-center my-4">
          <AddToListButton
            animeId={animeId}
            onEditClick={() => setShowEditModal(true)}
          />
        </div>
      )}

      {data && data.length > 0 ? (
        <div className="flex flex-wrap gap-6 justify-center">
          {data.map((entry) => (
            <EntryItem key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p>No activity for this anime yet.</p>
      )}

      {/* Edit Modal */}
      {showEditModal && listEntry && (
        <EditListEntryModal
          entry={listEntry}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};
// #endregion Render
