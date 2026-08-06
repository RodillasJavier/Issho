/**
 * src/components/DetailSidebar.tsx
 *
 * Sticky left column for the season/series detail pages: the viewer's own
 * rating alongside the release count, the primary actions (create entry,
 * watch status, share), and the seasons list — omitted for standalone
 * (non-franchise) anime, which have nothing to list.
 */
import type { ReactNode } from "react";
import { Star } from "lucide-react";

interface DetailSidebarProps {
  rating: number | null;
  releaseCount: number;
  actions: ReactNode;
  seasonsSection?: ReactNode;
}

export const DetailSidebar = ({
  rating,
  releaseCount,
  actions,
  seasonsSection,
}: DetailSidebarProps) => (
  <aside className="w-full flex-none rounded-xl border border-zinc-800 bg-zinc-900/45 p-4 sm:p-5 lg:sticky lg:top-24 lg:w-[356px] lg:self-start">
    <dl className="grid grid-cols-2 gap-3 border-b border-zinc-800 pb-4">
      <div className="flex flex-col gap-0.5">
        <dd className="flex items-center gap-1 text-[15px] font-semibold text-white">
          {rating != null ? (
            <>
              <Star
                aria-hidden
                className="size-3.5 fill-current text-yellow-400"
              />
              {rating}/10
            </>
          ) : (
            <span className="text-sm font-normal text-zinc-500">Not rated</span>
          )}
        </dd>
        <dt className="text-[10.5px] text-zinc-500">Your rating</dt>
      </div>
      <div className="flex flex-col gap-0.5">
        <dd className="text-[15px] font-semibold text-white">{releaseCount}</dd>
        <dt className="text-[10.5px] text-zinc-500">Releases</dt>
      </div>
    </dl>

    <div className="mt-4 flex flex-col gap-2">{actions}</div>

    {seasonsSection && (
      <div className="mt-4 border-t border-zinc-800 pt-4">{seasonsSection}</div>
    )}
  </aside>
);
