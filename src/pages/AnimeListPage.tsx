/* src/pages/AnimeListPage.tsx */
import { useState } from "react";
import { AnimeList } from "../components/AnimeList";
import { AnimeSearch } from "../components/AnimeSearch";

export const AnimeListPage = () => {
  const [view, setView] = useState<"browse" | "search">("browse");

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="w-full text-5xl font-bold text-center text-rose-400">
        {view === "browse" ? "Browse Anime" : "Search Anime"}
      </h2>

      {/* View Toggle */}
      <div className="flex gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-1">
        <button
          onClick={() => setView("browse")}
          className={`px-6 py-2 rounded-md transition-all ${
            view === "browse"
              ? "bg-rose-400 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Browse Database
        </button>

        <button
          onClick={() => setView("search")}
          className={`px-6 py-2 rounded-md transition-all ${
            view === "search"
              ? " T>  bg-rose-400 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Search & Add
        </button>
      </div>
      {/* Content */}
      {view === "browse" ? <AnimeList /> : <AnimeSearch />}
    </div>
  );
};
