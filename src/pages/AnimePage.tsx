/* src/pages/AnimePage.tsx */
import { AnimeList } from "../components/AnimeList";

export const AnimePage = () => {
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="w-full text-5xl font-bold text-center text-rose-400">
        Animes
      </h2>

      <AnimeList />
    </div>
  );
};
