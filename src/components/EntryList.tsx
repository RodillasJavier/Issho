/**
 * src/components/EntryList.tsx
 *
 * Component that fetches and displays a list of recent entries with their
 * associated anime data.
 */
import { useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { EntryItem } from "./EntryItem";
import type { Entry } from "../types/database.types";

// #region Types
interface EntryWithCounts {
  id: string;
  anime_id: string;
  user_id: string;
  entry_type: string;
  content: string;
  created_at: string;
  vote_count: number;
  comment_count: number;
  rating_value: number | null;
  status_value: string | null;
}

interface AnimeData {
  id: string;
  name: string;
  cover_image_url: string | null;
}

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
}
// #endregion Types

// #region Component Logic
const fetchEntries = async (): Promise<Entry[]> => {
  // Use RPC function to get entries with vote counts & comment counts
  const { data: entriesWithCounts, error } = await supabase.rpc(
    "get_entries_with_counts"
  );
  if (error) throw new Error(error.message);

  if (!entriesWithCounts || entriesWithCounts.length === 0) {
    return [];
  }

  // Fetch anime and profile data separately and join in memory
  const entryIds = (entriesWithCounts as EntryWithCounts[]).map(
    (entry) => entry.anime_id
  );
  const userIds = [
    ...new Set(
      (entriesWithCounts as EntryWithCounts[]).map((entry) => entry.user_id)
    ),
  ];

  const { data: animeData } = await supabase
    .from("anime")
    .select("id, name, cover_image_url")
    .in("id", entryIds);

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  // Map anime and profile data to entries
  const entriesWithData = (entriesWithCounts as EntryWithCounts[]).map(
    (entry) => ({
      ...entry,
      anime: animeData?.find((a: AnimeData) => a.id === entry.anime_id),
      profile: profileData?.find((p: ProfileData) => p.id === entry.user_id),
    })
  );

  return entriesWithData as Entry[];
};

export const EntryList = () => {
  const { data, error, isLoading } = useQuery<Entry[], Error>({
    queryKey: ["entries"],
    queryFn: fetchEntries,
  });
  // #endregion Component Logic

  // #region Render
  if (isLoading) {
    return <div>Loading entries...</div>;
  }

  if (error) {
    return <div>Error loading entries: {error.message}</div>;
  }

  return (
    <div className="flex flex-row flex-wrap gap-6 justify-center">
      {data?.map((entry) => (
        <EntryItem entry={entry} key={entry.id} />
      ))}
    </div>
  );
  // #endregion Render
};
