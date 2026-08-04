/**
 * src/components/DetailHero.tsx
 *
 * Full-bleed banner hero shared by the series and season detail pages. Breaks
 * out of the app's centered container to span the viewport edge-to-edge. The
 * banner image is a FIXED-height backdrop that fades into the page's dark
 * background, so expanding the description spills text onto that dark area
 * instead of stretching (zooming) the image.
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

// Roughly three lines at the hero's body size — long enough to collapse.
const DESCRIPTION_CLAMP_CHARS = 240;

interface DetailHeroProps {
  bannerUrl: string | null;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  aboveActions?: ReactNode;
  statusBadge?: ReactNode;
  genres: string[];
  description?: string | null;
  actions: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export const DetailHero = ({
  bannerUrl,
  eyebrow,
  title,
  subtitle,
  aboveActions,
  statusBadge,
  genres,
  description,
  actions,
  backHref = "/anime",
  backLabel = "Back to browse",
}: DetailHeroProps) => {
  const [expanded, setExpanded] = useState(false);
  const isLongDescription =
    (description?.length ?? 0) > DESCRIPTION_CLAMP_CHARS;

  // -mt-9 sm:-mt-12 pulls the hero flush against the floating navbar's bottom
  // edge without tucking the art behind it. AppShell's pt-20/sm:pt-28 plus the
  // content container's own py-6 clears the navbar's offset-plus-height
  // (top-3+h-14=68px mobile, top-6+h-16=88px sm+) by 36px/48px — this cancels
  // that gap: (80+24)-68=36, (112+24)-88=48.
  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-9 w-screen sm:-mt-12">
      {/* Fixed-height image backdrop: stays put so expanding the description
          spills text onto the page's dark background below rather than scaling
          the image. Gradients are kept light enough to show the series art. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] overflow-hidden"
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="size-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.55)_32%,rgba(0,0,0,0.12)_62%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,#000_2%,rgba(0,0,0,0)_100%)]" />
      </div>

      <div className="container relative mx-auto flex min-h-[28rem] flex-col justify-between gap-8 px-4 py-6">
        <Link
          to={backHref}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-zinc-950/45 px-2.5 py-1.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-zinc-950/70 hover:text-zinc-50"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {backLabel}
        </Link>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-rose-300">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
            )}

            {aboveActions && <div className="mt-3">{aboveActions}</div>}

            {(statusBadge || genres.length > 0) && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {statusBadge}
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center rounded-md border border-zinc-700/80 bg-zinc-950/55 px-2 py-1 text-[10px] font-semibold text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {description && (
              <div className="mt-5 max-w-xl">
                <p
                  className={`text-sm leading-6 text-zinc-300 sm:text-base sm:leading-7 ${
                    isLongDescription && !expanded ? "line-clamp-3" : ""
                  }`}
                >
                  {description}
                </p>
                {isLongDescription && (
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mt-1.5 cursor-pointer text-sm font-medium text-rose-300 transition-colors hover:text-rose-200"
                  >
                    {expanded ? "Show less" : "View full description"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        </div>
      </div>
    </section>
  );
};
