/**
 * src/pages/CreateEntryPage.tsx
 *
 * Page for creating a new entry.
 */
import { CreateEntry } from "../components/CreateEntry";

export const CreateEntryPage = () => {
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="text-5xl font-semibold bg-gradient-to-r from-rose-300 to-rose-800 bg-clip-text text-transparent">
        Create New Entry
      </h2>

      <CreateEntry />
    </div>
  );
};
