import type { Post } from "./PostList";
import supabase from "../supabase-client";
import { useQuery } from "@tanstack/react-query";
import { PostItem } from "./PostItem";

interface AnimeFeedProps {
  animeId: number;
}

interface PostWithAnime extends Post {
  anime: {
    name: string;
  };
}

const fetchAnimePost = async (animeId: number): Promise<PostWithAnime[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*, anime(name)")
    .eq("anime_id", animeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as PostWithAnime[];
};

export const AnimeFeed = ({ animeId }: AnimeFeedProps) => {
  const { data, isLoading, error } = useQuery<PostWithAnime[], Error>({
    queryKey: ["animePost", animeId],
    queryFn: () => fetchAnimePost(animeId),
  });

  if (isLoading) {
    return <div>Loading anime...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading anime: {error.message}</div>;
  }
  //   <h2 className="text-5xl font-semibold text-center bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent"></h2>;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-5xl font-semibold text-center bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
        {data && data[0].anime.name}
      </h2>

      {data && data.length > 0 ? (
        <div>
          {data.map((post, key) => (
            <PostItem key={key} post={post} />
          ))}
        </div>
      ) : (
        <p>No posts from this community yet.</p>
      )}
    </div>
  );
};
