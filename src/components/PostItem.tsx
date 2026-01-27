/* src/components/PostItem.tsx */
import { Link } from "react-router";
import type { Post } from "./PostList";

interface PostItemProps {
  post: Post;
}

export const PostItem = ({ post }: PostItemProps) => {
  return (
    <div>
      <div></div>
      <Link to={`/posts/${post.id}`}>
        <div>
          {/* Header */}
          <div>
            <div>
              <div>{post.title}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div>
          <img src={post.image_url} alt={post.title} />
        </div>
      </Link>
    </div>
  );
};
