/**
 * src/components/BackButton.tsx
 *
 * "Back" affordance shared by the season/series detail heroes (DetailHero)
 * and the entry detail page's sidebar: walks the real browser history back
 * when there's an in-app entry to return to, so it lands wherever the viewer
 * actually came from (a season, a friend's profile, a search) rather than a
 * fixed destination. Falls back to `href` when there isn't one — react-router
 * stamps the very first entry in a tab's session (a fresh load, a refresh, or
 * a direct link) with location.key "default" and a random key for every
 * entry it pushed itself (AppShell's getScrollRestorationKey relies on the
 * same fact); only the random-key case has an in-app "back" to actually go
 * to, and blindly calling navigate(-1) on a "default" entry would leave the
 * app (or no-op) instead of landing anywhere useful.
 */
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
  iconClassName?: string;
}

const DEFAULT_CLASSNAME =
  "inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-zinc-950/45 px-2.5 py-1.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-zinc-950/70 hover:text-zinc-50";

export const BackButton = ({
  href,
  label = "Back",
  className = DEFAULT_CLASSNAME,
  iconClassName = "size-4",
}: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.key !== "default";

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(href);
    }
  };

  return (
    <button type="button" onClick={handleBack} className={className}>
      <ArrowLeft aria-hidden className={iconClassName} />
      {label}
    </button>
  );
};
