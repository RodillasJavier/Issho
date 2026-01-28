import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import type { Anime } from "./AnimeList";
import { useNavigate } from "react-router";

interface PostInput {
  title: string;
  content: string;
  anime_id: number | null;
}

const createPost = async (post: PostInput, imageFile: File) => {
  const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, imageFile);

  if (uploadError) {
    throw new Error(uploadError?.message);
  }

  const { data: publicURLData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, image_url: publicURLData.publicUrl });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const fetchAllAnime = async (): Promise<Anime[]> => {
  const { data, error } = await supabase
    .from("anime")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const CreatePost = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [animeId, setAnimeId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const { data: allAnime } = useQuery<Anime[], Error>({
    queryKey: ["anime"],
    queryFn: fetchAllAnime,
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
    onSuccess: () => {
      navigate("/");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Stop page reload

    if (!selectedFile) {
      return;
    }

    mutate({
      post: { title, content, anime_id: animeId },
      imageFile: selectedFile,
    });
  };

  const handleAnimeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setAnimeId(value ? Number(value) : null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // #region Render
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-5xl bg-neutral-900 p-6 rounded-md space-y-4"
    >
      <div className="flex flex-col space-y-2">
        <label htmlFor="">Title</label>

        <input
          type="text"
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none"
          placeholder="Enter the title for your post here..."
          id="title"
          required
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-col space-y-2">
        {""}
        <label htmlFor="">Content</label>

        <textarea
          id="content"
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none"
          placeholder="Enter the content for your post here..."
          required
          rows={5}
          onChange={(event) => {
            setContent(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label>Select Anime</label>

        <select id="anime" onChange={handleAnimeChange}>
          <option disabled selected>
            -- Select Anime --
          </option>

          {allAnime?.map((anime, key) => (
            <option key={key} value={anime.id}>
              {anime.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-2">
        {""}
        <label htmlFor="">Upload Image</label>

        <input
          type="file"
          className="border border-neutral-800 px-3 py-2 rounded-md focus:outline-none"
          id="image"
          accept="image/*"
          required
          onChange={handleFileChange}
        />
      </div>

      <button
        type="submit"
        className="text-white hover:text-rose-900/50 bg-rose-500 px-3 py-2 rounded-md focus:outline-none cursor-pointer hover:bg-rose-300 border border-rose-500 hover:border-rose-500 transition-colors"
      >
        {isPending ? "Creating..." : "Create Post"}
      </button>

      {isError && (
        <p className="text-red-500">
          Error creating post, {error?.message}. Please try again.
        </p>
      )}
    </form>
  );
  // #endregion Render
};
