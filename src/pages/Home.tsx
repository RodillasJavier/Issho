/* src/pages/Home.tsx */
import { EntryList } from "../components/EntryList";

export const Home = () => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-5xl font-semibold bg-gradient-to-r from-rose-200 to-rose-800 bg-clip-text text-transparent">
        Recent Activity
      </h2>

      <div>
        <EntryList />
      </div>
    </div>
  );
};
