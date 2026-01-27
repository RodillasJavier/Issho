/* src/pages/Home.tsx */
import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div>
      <h2 className="font-mono text-3xl">Recent Posts</h2>

      <div>
        <PostList />
      </div>
    </div>
  );
};
