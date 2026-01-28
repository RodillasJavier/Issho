/* src/pages/CreateAnimePage.tsx */
import { CreateAnime } from "../components/CreateAnime";

export const CreateAnimePage = () => {
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="w-full text-3xl">
        Create a new community for this anime.{" "}
      </h2>

      <CreateAnime />
    </div>
  );
};
