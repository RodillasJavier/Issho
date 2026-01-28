/* src/components/PostDetail.tsx */
import { useQuery } from "@tanstack/react-query";
import supabase from "../supabase-client";
import type { Post } from "./PostList";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";

interface PostDetailProps {
  postId: number;
}

const fetchPostById = async (id: number): Promise<Post> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Post;
};

export const PostDetail = ({ postId }: PostDetailProps) => {
  const { data, error, isLoading } = useQuery<Post, Error>({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  if (isLoading) {
    return <div>Loading post...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading post: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-5xl font-semibold text-center bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
        {data?.title}
      </h2>

      {data?.image_url && (
        <img
          src={data?.image_url}
          alt={data?.title}
          className="rounded object-cover w-full h-64"
        />
      )}

      <span className="border border-neutral-700 mt-2" />

      <p className="text-md text-white">{data?.content}</p>
      <p className="text-sm text-neutral-400">
        Posted on {new Date(data!.created_at).toLocaleDateString()}
      </p>

      <span className="border border-neutral-700 my-2" />

      <LikeButton postId={postId} />
      <CommentSection postId={postId} />
    </div>
  );
};
