/* src/pages/AnimeListPage.tsx */
import { AnimeList } from "../components/AnimeList";

export const AnimeListPage = () => {
  return (
    <div className="w-full">
      {/* Header */}
      <section>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-rose-400">
          Anime discovery
        </p>

        <div className="mt-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Browse anime
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Search the full catalog — anything you add drops straight into your
            list.
          </p>
        </div>
      </section>

      <AnimeList />
    </div>
  );
};
