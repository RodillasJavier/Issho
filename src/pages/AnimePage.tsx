/* src/pages/AnimePage.tsx */
import { useParams } from "react-router";
import { AnimeFeed } from "../components/AnimeFeed";

export const AnimePage = () => {
  const { id: animeId } = useParams<{ id: string }>();

  if (!animeId) {
    return <div>We could not find the anime you were looking for.</div>;
  }

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <AnimeFeed animeId={animeId} />
    </div>
  );
};
