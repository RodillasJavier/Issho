/* src/pages/AnimeListPage.tsx */
import { AnimeList } from "../components/AnimeList";

export const AnimeListPage = () => {
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="w-full text-5xl font-bold text-center text-rose-400">
        Browse Anime
      </h2>

      <AnimeList />
    </div>
  );
};
