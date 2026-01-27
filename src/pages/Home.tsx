/* src/pages/Home.tsx */
import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-mono text-3xl">Recent Posts</h2>

      <div>
        <PostList />
      </div>
    </div>
  );
};
