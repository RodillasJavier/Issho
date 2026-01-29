/**
 * src/pages/CreateEntryPage.tsx
 *
 * Page for creating a new entry.
 */
import { CreateEntry } from "../components/CreateEntry";

export const CreateEntryPage = () => {
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <h2 className="w-full text-3xl">Create New Entry</h2>

      <CreateEntry />
    </div>
  );
};
