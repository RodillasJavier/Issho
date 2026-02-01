/* src/pages/Home.tsx */
import { EntryList } from "../components/EntryList";
import { useAuth } from "../hooks/useAuth";

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="text-5xl font-semibold bg-gradient-to-r from-rose-300 to-rose-800 bg-clip-text text-transparent">
        Recent Activity
      </h2>

      {!user && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-center">
            Viewing anonymous public feed.{" "}
            <a href="/signin" className="text-rose-400 hover:text-rose-300">
              Sign in
            </a>{" "}
            to see your friends' activity and personalize your experience.
          </p>
        </div>
      )}

      <div>
        <EntryList friendsOnly={!!user} anonymized={!user} />
      </div>
    </div>
  );
};
