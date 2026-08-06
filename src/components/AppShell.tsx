/**
 * src/components/AppShell.tsx
 *
 * Persistent layout (navbar + centered container + footer) wrapping every
 * route except the auth pages, which own their own full-bleed body layout.
 * Split out of App.tsx so that file can export only the router (App.tsx
 * mixing a component export with the `router` export would break Fast
 * Refresh).
 */
import { Outlet, ScrollRestoration } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { cn, navbar } from "../styles/tokens";

// Season (/anime/:id) and series (/series/:key) pages link to each other
// from a sticky sidebar (SeasonsList) that the viewer expects to keep
// browsing from in place — clicking to the next season should feel like
// swapping the main content, not like landing on a brand new page. Giving
// every match here the SAME restoration key (instead of the default
// per-location key, which always resets to top on a push) makes react-router
// preserve the current scroll offset across those hops. /anime/create is
// excluded — that's a form page, not a sibling detail page, and sharing a
// scroll offset with it would reintroduce the mismatch this exists to avoid.
const isSeasonOrSeriesDetailPage = (pathname: string): boolean =>
  /^\/anime\/(?!create$)[^/]+$/.test(pathname) ||
  /^\/series\/[^/]+$/.test(pathname);

export function AppShell() {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-black text-gray-100 transition-opacity duration-500",
        navbar.shellClearance
      )}
    >
      {/* Resets scroll to top on navigation to a new page under this shell,
          and restores scroll position on back/forward — replacing the
          browser's default, somewhat accidental scroll-anchoring behavior
          with an explicit one. getKey keeps season/series detail pages from
          resetting to top when hopping between them (see above). */}
      <ScrollRestoration
        getKey={(location) =>
          isSeasonOrSeriesDetailPage(location.pathname)
            ? "season-series-detail"
            : location.key
        }
      />
      <Navbar />

      <div className="container mx-auto flex-1 px-4 py-6">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}
