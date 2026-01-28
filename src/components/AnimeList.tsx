/* src/components/AnimeList.tsx */
import { useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { Link } from "react-router";

export interface Anime {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

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

export const AnimeList = () => {
  const { data, isLoading, error } = useQuery<Anime[], Error>({
    queryKey: ["anime"],
    queryFn: fetchAllAnime,
  });

  if (isLoading) {
    return <div>Loading anime...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading anime: {error.message}</div>;
  }

  return (
    <div className="flex flex-col w-full gap-2 cursor-pointer">
      {data?.map((anime, key) => (
        <div
          key={key}
          className="group bg-neutral-950 rounded p-2 hover:scale-105 transition transition-duration-1000"
        >
          <Link to={`/anime/:${anime.id}`}>
            <h3 className="bg-clip-text font-semibold text-3xl group-hover:text-rose-400 transition transition 1000">
              {anime.name}
            </h3>
            <p className="text-neutral-500 group-hover:text-neutral-400 transition transition 1000">
              {anime.description}
            </p>
          </Link>
        </div>
      ))}
    </div>
  );
};
