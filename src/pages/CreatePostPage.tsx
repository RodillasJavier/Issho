import { CreatePost } from "../components/CreatePost";

export const CreatePostPage = () => {
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="w-full text-3xl font-mono">Create New Post</h2>

      <CreatePost />
    </div>
  );
};
