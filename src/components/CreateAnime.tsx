/**
 * src/components/CreateAnime.tsx
 *
 * Component for manually creating a new anime entry.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import supabase from "../supabase-client";

// #region Types & Constants
interface AnimeInput {
  name: string;
  description: string;
  cover_image_url: string;
  episode_count: number | null;
  year: number | null;
  external_id: string;
}

const DEFAULT_COVER_IMAGE_URL =
  "https://via.placeholder.com/300x400?text=No+Image";
// #endregion Types & Constants

// #region Component Logic
const createAnime = async (anime: AnimeInput) => {
  const { data, error } = await supabase.from("anime").insert(anime);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const CreateAnime = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [episodeCount, setEpisodeCount] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: createAnime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anime"] });
      navigate("/anime");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload

    mutate({
      name,
      description,
      cover_image_url: coverImageUrl || DEFAULT_COVER_IMAGE_URL,
      episode_count: episodeCount,
      year: year,
      external_id: `manual_${Date.now()}`,
    });
  };
  // #endregion Component Logic

  // #region Render
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-5xl bg-neutral-900 p-6 rounded-md space-y-4"
    >
      <div className="flex flex-col space-y-2">
        <label>Anime Name</label>
        <input
          type="text"
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
          placeholder="Enter the name for the Anime..."
          id="name"
          required
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label>Anime Description</label>
        <textarea
          id="description"
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
          placeholder="Write a short description for this Anime..."
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label>Cover Image URL (optional)</label>
        <input
          type="url"
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
          placeholder="https://example.com/image.jpg"
          id="cover_image_url"
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />
      </div>

      <div className="flex flex-row gap-4">
        <div className="flex flex-col space-y-2 flex-1">
          <label>Episode Count (optional)</label>
          <input
            type="number"
            className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
            placeholder="12"
            id="episode_count"
            onChange={(e) =>
              setEpisodeCount(e.target.value ? parseInt(e.target.value) : null)
            }
          />
        </div>

        <div className="flex flex-col space-y-2 flex-1">
          <label>Release Year (optional)</label>
          <input
            type="number"
            className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none bg-neutral-950 text-white"
            placeholder="2024"
            id="year"
            onChange={(e) =>
              setYear(e.target.value ? parseInt(e.target.value) : null)
            }
          />
        </div>
      </div>

      <button
        type="submit"
        className="text-white hover:text-rose-900/50 bg-rose-500 px-3 py-2 rounded-md focus:outline-none cursor-pointer hover:bg-rose-300 border border-rose-500 hover:border-rose-500 transition-colors"
      >
        {isPending ? "Creating..." : "Create Anime"}
      </button>

      {isError && (
        <p className="text-red-500">
          Error Creating Anime. Please refresh the page and try again.
        </p>
      )}
    </form>
  );
};
// #endregion Render
