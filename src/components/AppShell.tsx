/**
 * src/components/AppShell.tsx
 *
 * Persistent layout (navbar + centered container + footer) wrapping every
 * route except the auth pages, which own their own full-bleed body layout.
 * Split out of App.tsx so that file can export only the router (App.tsx
 * mixing a component export with the `router` export would break Fast
 * Refresh).
 */
import { useCallback } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import type { Location } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { cn, navbar } from "../styles/tokens";
import type { Anime } from "../types/database.types";

const ANIME_PAGE = /^\/anime\/(?!create$)([^/]+)$/;
const SERIES_PAGE = /^\/series\/([^/]+)$/;

export function AppShell() {
  const queryClient = useQueryClient();

  // Season (/anime/:id) and series (/series/:key) pages link to each other
  // from a sticky sidebar (SeasonsList) that the viewer expects to keep
  // browsing from in place — clicking to the next season should feel like
  // swapping the main content, not like landing on a brand new page. Giving
  // every match for the SAME franchise the SAME restoration key (instead of
  // the default per-location key, which always resets to top on a push)
  // makes react-router preserve the current scroll offset across those hops.
  // The key is scoped to the franchise (via the cached anime row's
  // franchise_key, already warmed by useFranchiseMembers' cache-seeding) —
  // NOT a single global key — because react-router's scroll store is a flat
  // map: two pages sharing one key will restore whichever offset was saved
  // there last, even from an unrelated visit. A global key would make the
  // FIRST visit to any season/series page in a session jump to whatever
  // scroll position was last left on a completely different franchise's
  // page. Falling back to the anime/series id itself (still unique per page)
  // when the franchise isn't cached yet is a safe degrade: worst case is
  // that one navigation doesn't preserve scroll, never a wrong restore.
  // /anime/create is excluded — that's a form page, not a sibling detail
  // page.
  // Memoized: AppShell re-renders on every navigation (it wraps <Outlet>),
  // and react-router's ScrollRestoration re-registers its scroll listener
  // whenever getKey's identity changes — an unmemoized function here would
  // tear down and re-subscribe scroll restoration on every single
  // navigation in the app, not just anime/series ones.
  const getScrollRestorationKey = useCallback(
    (location: Location): string => {
      const animeMatch = ANIME_PAGE.exec(location.pathname);
      if (animeMatch) {
        const cached = queryClient.getQueryData<Anime>([
          "anime",
          animeMatch[1],
        ]);
        return `season-series-detail-${cached?.franchise_key ?? animeMatch[1]}`;
      }

      const seriesMatch = SERIES_PAGE.exec(location.pathname);
      if (seriesMatch) {
        return `season-series-detail-${seriesMatch[1]}`;
      }

      return location.key;
    },
    [queryClient]
  );

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
          with an explicit one. getKey keeps season/series detail pages
          within the same franchise from resetting to top when hopping
          between them (see above). */}
      <ScrollRestoration getKey={getScrollRestorationKey} />
      <Navbar />

      <div className="container mx-auto flex-1 px-4 py-6">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}
