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
import { BackButton } from "./BackButton";

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
  backHref = "/anime",
  backLabel = "Back",
}: DetailHeroProps) => {
  const [expanded, setExpanded] = useState(false);
  const isLongDescription =
    (description?.length ?? 0) > DESCRIPTION_CLAMP_CHARS;

  // -mt-8 sm:-mt-10 pulls the hero flush against the floating navbar's bottom
  // edge without tucking the art behind it. AppShell's pt-16/sm:pt-22 plus the
  // content container's own py-6 clears the navbar's offset-plus-height
  // (top-2+h-12=56px mobile, top-4+h-14=72px sm+) by 32px/40px — this cancels
  // that gap: (64+24)-56=32, (88+24)-72=40. The interactive content below (the
  // back link, title, etc.) stays flush at that line — it's the backdrop image
  // that goes further, see below.
  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-8 w-screen sm:-mt-10">
      {/* Fixed-height image backdrop: stays put so expanding the description
          spills text onto the page's dark background below rather than scaling
          the image. Gradients are kept light enough to show the series art.
          Pulled up an extra navbar.clearance (pt-14/pt-18 = 56px/72px, the
          navbar's own offset+height) past the section's own flush-with-navbar
          edge above, with height grown by the same amount so the bottom edge
          (the fade-to-black gradient) stays anchored where it was — the net
          effect is the art running all the way to the true viewport top,
          showing through the floating navbar's translucent pill. Nothing here
          needs a z-index: this div sets none, so it already paints behind the
          fixed z-40 Navbar and behind the content div below it (later in DOM
          order) in the shared root stacking context. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-14 h-[calc(28rem+3.5rem)] overflow-hidden sm:-top-18 sm:h-[calc(28rem+4.5rem)]"
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
        <BackButton href={backHref} label={backLabel} />

        <div className="max-w-3xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-rose-300">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>}

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
            <div className="mt-5 max-w-3xl">
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
      </div>
    </section>
  );
};
