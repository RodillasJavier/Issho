/**
 * src/components/CreateEntry.tsx
 *
 * Component for creating a new entry.
 */
import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { useNavigate } from "react-router";
import {
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_PLACEHOLDERS,
} from "../constants/entryTypes";

// #region Types & Constants
import type { EntryType, Anime } from "../types/database.types";

interface EntryInput {
  entry_type: EntryType;
  anime_id: string | null;
  content: string;
}
// #endregion Types

// #region Component Logic
const createEntry = async (entry: EntryInput) => {
  const { data, error } = await supabase
    .from("entries")
    .insert(entry)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

const fetchAllAnime = async (): Promise<Anime[]> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};

export const CreateEntry = () => {
  const [content, setContent] = useState<string>("");
  const [animeId, setAnimeId] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<EntryType>("review");
  const navigate = useNavigate();

  const { data: allAnime } = useQuery<Anime[], Error>({
    queryKey: ["anime"],
    queryFn: fetchAllAnime,
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (data: EntryInput) => {
      return createEntry(data);
    },
    onSuccess: () => {
      navigate("/");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Stop page reload

    if (!content || !animeId) {
      return;
    }

    mutate({
      content,
      anime_id: animeId,
      entry_type: entryType,
    });
  };

  const handleAnimeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setAnimeId(value || null);
  };

  const handleEntryTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setEntryType(event.target.value as EntryType);
  };

  const getContentLabel = () => {
    switch (entryType) {
      case "review":
        return ENTRY_TYPE_LABELS.review;
      case "rating":
        return ENTRY_TYPE_LABELS.rating;
      case "status_update":
        return ENTRY_TYPE_LABELS.status_update;
      default:
        return "Content";
    }
  };

  const getContentPlaceholder = () => {
    switch (entryType) {
      case "review":
        return ENTRY_TYPE_PLACEHOLDERS.review;
      case "rating":
        return ENTRY_TYPE_PLACEHOLDERS.rating;
      case "status_update":
        return ENTRY_TYPE_PLACEHOLDERS.status_update;
      default:
        return "Enter content here...";
    }
  };
  // #endregion Component Logic

  // #region Render
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-5xl bg-neutral-900 p-6 rounded-md space-y-4"
    >
      {/* Select Entry Type */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="entry-type">Entry Type</label>

        <select
          id="entry-type"
          value={entryType}
          onChange={handleEntryTypeChange}
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
        >
          <option value="review">📝 Review</option>
          <option value="rating">⭐ Rating</option>
          <option value="status_update">📺 Status Update</option>
        </select>
      </div>

      {/* Select Anime */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="anime">Select Anime</label>

        <select
          id="anime"
          onChange={handleAnimeChange}
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
          required
        >
          <option value="">-- Select Anime --</option>

          {allAnime?.map((anime) => (
            <option key={anime.id} value={anime.id}>
              {anime.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content Input */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="content">{getContentLabel()}</label>

        {entryType === "rating" ? (
          <input
            type="number"
            id="content"
            className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
            placeholder={getContentPlaceholder()}
            min="1"
            max="10"
            required
            onChange={(event) => {
              setContent(event.target.value);
            }}
          />
        ) : (
          <textarea
            id="content"
            className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
            placeholder={getContentPlaceholder()}
            required
            rows={entryType === "review" ? 8 : 3}
            onChange={(event) => {
              setContent(event.target.value);
            }}
          />
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="text-white hover:text-rose-900/50 bg-rose-500 px-3 py-2 rounded-md focus:outline-none cursor-pointer hover:bg-rose-300 border border-rose-500 hover:border-rose-500 transition-colors"
      >
        {isPending ? "Creating..." : "Create Entry"}
      </button>

      {/* Error Message */}
      {isError && (
        <p className="text-red-500">
          Error creating entry: {error?.message}. Please try again.
        </p>
      )}
    </form>
  );
};
// #endregion Render
