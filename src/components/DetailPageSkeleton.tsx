/**
 * src/components/DetailPageSkeleton.tsx
 *
 * Loading state shared by the season (AnimeFeed) and series (FranchisePage)
 * detail pages — shaped to roughly match DetailHero + DetailSidebar +
 * SeasonsList + CommunityEntriesSection's real proportions, so there's no
 * dramatic collapse-then-expand once the real data lands (a short loading
 * placeholder against a much taller real page is what caused the
 * layout-shift/scroll-teleport this exists to prevent).
 */
import { Skeleton } from "./ui/Skeleton";

export const DetailPageSkeleton = () => (
  <div className="flex flex-col gap-10">
    {/* Hero */}
    <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-8 w-screen sm:-mt-10">
      <div className="container relative mx-auto flex min-h-[28rem] flex-col justify-between gap-8 px-4 py-6">
        <Skeleton className="h-9 w-36" />
        <div className="max-w-2xl">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-12 w-80 max-w-full" />
          <Skeleton className="mt-5 h-24 w-full" />
        </div>
      </div>
    </section>

    {/* Two-column body */}
    <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
      {/* Sidebar */}
      <div className="w-full flex-none rounded-xl border border-zinc-800 bg-zinc-900/45 p-4 sm:p-5 lg:w-[356px]">
        <div className="grid grid-cols-2 gap-3 border-b border-zinc-800 pb-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-10" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-800 pt-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-18 w-full" />
          ))}
        </div>
      </div>

      {/* Entries column */}
      <div className="min-w-0 flex-1 border-t border-zinc-800 pt-8">
        <Skeleton className="h-68 w-full" />
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  </div>
);
