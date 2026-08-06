/**
 * src/components/FeedSkeleton.tsx
 *
 * Loading state shared by EntryList (signed-in) and PublicFeed (signed-out)
 * — shaped to roughly match FeaturedEntry + the entry-card grid below it, so
 * there's no dramatic collapse-then-expand once entries load.
 */
import { Skeleton } from "./ui/Skeleton";

interface FeedSkeletonProps {
  /** EntryList's signed-in layout has a second column (FollowingPanel +
   * CreateEntryCta) beside the spotlight; PublicFeed has none. */
  withSidebar?: boolean;
}

export const FeedSkeleton = ({ withSidebar = false }: FeedSkeletonProps) => (
  <div className="flex flex-col gap-6">
    {withSidebar ? (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.85fr)]">
        <Skeleton className="h-68 w-full" />
        <div className="grid gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
          <Skeleton className="h-full min-h-32 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    ) : (
      <Skeleton className="h-68 w-full" />
    )}

    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>

    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-72 w-full" />
      ))}
    </div>
  </div>
);
