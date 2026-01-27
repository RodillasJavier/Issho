/* src/components/PostItem.tsx */
import { Link } from "react-router";
import type { Post } from "./PostList";

interface PostItemProps {
  post: Post;
}

export const PostItem = ({ post }: PostItemProps) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-950 to-rose-400 blur-sm opacity-0 group-hover:opacity-25 transition duration-250" />

      <Link to={`/post/${post.id}`} className="relative z-10">
        <div className="w-sm h-sm p-4 gap-2 bg-neutral-950 border border-neutral-800 rounded-md text-white flex flex-col overflow-hidden transition-colors duration-250 group-hover:border-rose-400/50 group-hover:bg-transparent cursor-pointer">
          {/* Header */}
          <div className="flex flex-col flex-1">
            <div className="text-md font-semibold">{post.title}</div>
          </div>

          {/* Body */}
          <div className="flex-1">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-sm object-cover max-h-64"
            />
          </div>
        </div>
      </Link>
    </div>
  );
};
