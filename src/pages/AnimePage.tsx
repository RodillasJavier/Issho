/* src/pages/AnimePage.tsx */
import { useParams } from "react-router";
import { AnimeFeed } from "../components/AnimeFeed";

export const AnimePage = () => {
  const { id: animeId } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <AnimeFeed animeId={Number(animeId)}></AnimeFeed>
    </div>
  );
};
