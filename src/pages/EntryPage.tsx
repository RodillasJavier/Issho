/* src/pages/EntryPage.tsx */
import { EntryDetail } from "../components/EntryDetail";
import { useParams } from "react-router";

export const EntryPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-4">
      <EntryDetail entryId={id!} />
    </div>
  );
};
