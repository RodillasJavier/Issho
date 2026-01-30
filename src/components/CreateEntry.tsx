/**
 * src/components/CreateEntry.tsx
 *
 * Component for creating a new entry (or multiple entries at once).
 */
import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { getUserAnimeEntry } from "../services/supabase/userAnimeList";

// #region Types & Constants
import type { Anime, AnimeStatus } from "../types/database.types";

interface EntryInput {
  animeId: string;
  status?: AnimeStatus;
  rating?: number;
  review?: string;
}
// #endregion Types

// #region Component Logic
const createEntries = async (input: EntryInput, userId: string) => {
  const { animeId, status, rating, review } = input;

  // Check if user already has this anime in their list
  const existingEntry = await getUserAnimeEntry(animeId, userId);

  if (existingEntry) {
    // Update existing user anime entry directly without triggering auto-entries
    const updates: Partial<{
      status: AnimeStatus;
      rating: number | null;
      review: string | null;
    }> = {};
    if (status) updates.status = status;
    if (rating !== undefined) updates.rating = rating;
    if (review) updates.review = review;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("user_anime_entries")
        .update(updates)
        .eq("id", existingEntry.id);

      if (error) throw error;
    }
  } else {
    // Add to list directly without triggering auto-entry creation
    const { error } = await supabase.from("user_anime_entries").insert({
      anime_id: animeId,
      user_id: userId,
      status: status || "not_started",
      rating: rating || null,
      review: review || null,
    });

    if (error) throw error;
  }

  // Create a single combined entry with all provided values
  const entryType = review
    ? "review"
    : rating !== undefined
      ? "rating"
      : "status_update";

  const { error } = await supabase.from("entries").insert({
    user_id: userId,
    anime_id: animeId,
    entry_type: entryType,
    content: review || null,
    rating_value: rating || null,
    status_value: status || null,
  });

  if (error) throw error;
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
  const [animeId, setAnimeId] = useState<string>("");
  const [review, setReview] = useState<string>("");
  const [status, setStatus] = useState<AnimeStatus | "">("");
  const [rating, setRating] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allAnime } = useQuery<Anime[], Error>({
    queryKey: ["anime"],
    queryFn: fetchAllAnime,
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (data: EntryInput) => {
      if (!user) throw new Error("User not authenticated");
      return createEntries(data, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
      navigate("/");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent page reload

    if (!animeId) {
      return;
    }

    // At least one field must be filled
    if (!status && !rating && !review) {
      return;
    }

    mutate({
      animeId,
      status: status || undefined,
      rating: rating ? parseInt(rating) : undefined,
      review: review || undefined,
    });
  };

  const handleAnimeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setAnimeId(event.target.value);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value as AnimeStatus | "");
  };
  // #endregion Component Logic

  // #region Render
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-5xl bg-neutral-900 p-6 rounded-md space-y-4"
    >
      <h2 className="text-2xl font-bold text-rose-400">Create Entry</h2>
      <p className="text-gray-400 text-sm">
        Fill out any combination of fields below. All fields are optional except
        anime selection.
      </p>

      {/* Select Anime */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="anime" className="font-semibold">
          Select Anime <span className="text-red-500">*</span>
        </label>

        <select
          id="anime"
          value={animeId}
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

      {/* Status Selection */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="status" className="font-semibold">
          📺 Status
        </label>

        <select
          id="status"
          value={status}
          onChange={handleStatusChange}
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
        >
          <option value={""}>-- No Status Change --</option>
          <option value="not_started">Not Started</option>
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>

      {/* Rating Input */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="rating" className="font-semibold">
          ⭐ Rating (1-10)
        </label>

        <input
          type="number"
          id="rating"
          value={rating}
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
          placeholder="Enter rating (1-10)"
          min="1"
          max="10"
          onChange={(event) => setRating(event.target.value)}
        />
      </div>

      {/* Review Text */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="review" className="font-semibold">
          📝 Review
        </label>

        <textarea
          id="review"
          value={review}
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
          placeholder="Write your review..."
          rows={8}
          onChange={(event) => setReview(event.target.value)}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !animeId || (!status && !rating && !review)}
        className="text-white hover:text-rose-900/50 bg-rose-500 px-3 py-2 rounded-md focus:outline-none cursor-pointer hover:bg-rose-300 border border-rose-500 hover:border-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
