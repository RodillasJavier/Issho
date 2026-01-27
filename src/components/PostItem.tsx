/* src/components/PostItem.tsx */
import { Link } from "react-router";
import type { Post } from "./PostList";

interface PostItemProps {
  post: Post;
}

export const PostItem = ({ post }: PostItemProps) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-rose-950 to-rose-100 blur-sm opacity-0 group-hover:opacity-20 transition duration-250 cursor-pointer" />

      <Link to={`/posts/${post.id}`}>
        <div className="w-sm h-sm bg-gray p-4 gap-2 border border-neutral-700 rounded-md text-white flex flex-col overflow-hidden transition-colors duration-250 group-hover:border-rose-400">
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
