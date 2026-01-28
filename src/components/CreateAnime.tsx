/* src/components/CreateAnime.tsx */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import supabase from "../supabase-client";

interface AnimeInput {
  name: string;
  description: string;
}

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

    mutate({ name, description });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-5xl bg-neutral-900 p-6 rounded-md space-y-4"
    >
      <div className="flex flex-col space-y-2">
        <label>Anime Name</label>
        <input
          type="text"
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none"
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
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none"
          placeholder="Write a short description for this Anime..."
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
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
