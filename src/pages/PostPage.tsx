/* src/pages/PostPage.tsx */
import { PostDetail } from "../components/PostDetail";
import { useParams } from "react-router";

export const PostPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-4">
      <PostDetail postId={Number(id)} />
    </div>
  );
};
