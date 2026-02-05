/* src/components/EntryDetail.tsx */
import { useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { getEntryTypeLabel } from "../constants/entryTypes";
import { STATUS_LABELS } from "../constants/animeStatus";
import { UserInfo } from "./UserInfo";

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
      anime(name, cover_image_url, description),
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
  // #endregion Component Logic

  // #region Render
  if (isLoading) {
    return <div>Loading entry...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading entry: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* User Info */}
      {anonymized ? (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm">
            ?
          </div>
          <span className="text-md text-gray-400">Anonymous User</span>
        </div>
      ) : (
        data?.profile && (
          <UserInfo
            username={data.profile.username}
            avatarUrl={data.profile.avatar_url}
            size="md"
          />
        )
      )}

      <div className="text-sm text-rose-400 font-semibold">
        {data && getEntryTypeLabel(data.entry_type)}
      </div>

      <h2 className="text-5xl font-semibold text-center bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
        {data?.anime?.name}
      </h2>

      {data?.anime?.cover_image_url && (
        <img
          src={data.anime.cover_image_url}
          alt={data.anime.name}
          className="rounded object-cover w-full h-64"
        />
      )}

      <span className="border border-neutral-700 mt-2" />

      <div className="flex flex-col gap-2">
        {data?.status_value && (
          <p className="text-md text-white">
            Marked as{" "}
            <span className="font-semibold text-rose-400">
              {STATUS_LABELS[data.status_value]}
            </span>
          </p>
        )}

        {data?.rating_value && (
          <p className="text-md text-white">
            Rated{" "}
            <span className="font-semibold text-rose-400">
              {data.rating_value}/10
            </span>
          </p>
        )}

        {data?.content && (
          <p className="text-md text-white leading-relaxed">{data.content}</p>
        )}
      </div>

      <p className="text-sm text-neutral-400">
        Posted on {data && new Date(data.created_at).toLocaleDateString()}
      </p>

      <span className="border border-neutral-700 my-2" />

      <LikeButton entryId={entryId} />
      <CommentSection entryId={entryId} anonymized={anonymized} />
    </div>
  );
};
// #endregion Render
