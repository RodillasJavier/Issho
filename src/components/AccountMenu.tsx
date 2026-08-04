/**
 * src/components/AccountMenu.tsx
 *
 * The navbar's avatar button and the menu it opens — profile, settings, and
 * sign out. Unlike the status pickers elsewhere in the app, this one closes on
 * Escape and on a real outside-click listener rather than a full-screen
 * click-catcher, since it sits inside a floating bar the catcher would cover.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "../hooks/useAuth";
import { cn, focusRing, radius } from "../styles/tokens";

interface AccountMenuProps {
  username: string;
  avatarUrl: string | null;
}

const itemBase = cn(
  "text-sm flex items-center gap-2.5 px-2.5 py-2 transition-colors",
  radius.inset
);

export const AccountMenu = ({ username, avatarUrl }: AccountMenuProps) => {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative ml-1 flex items-center">
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${username}`}
        className={cn(
          "flex cursor-pointer items-center gap-2 transition",
          radius.pill,
          focusRing
        )}
      >
        {/* Ring drawn as an overlay so it can hug the avatar without the
            layout shift a border on the image itself would cause. */}
        <span className="relative flex">
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -inset-0.5 rounded-full border transition-colors duration-200",
              open ? "border-accent/45" : "border-line-strong"
            )}
          />

          <UserAvatar
            username={username}
            avatarUrl={avatarUrl}
            size="md"
            linkToProfile={false}
          />
        </span>

        <ChevronDownIcon
          aria-hidden
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open ? "rotate-180 text-content-muted" : "text-content-subtle"
          )}
        />
      </button>

      {/* account menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute top-13 right-0 w-40 rounded-2xl border border-line bg-field/95 p-1.5 text-sm shadow-lg backdrop-blur-xl"
          >
            <Link
              to={`/profile/${username}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                itemBase,
                "text-content-muted hover:bg-line-subtle hover:text-accent-text-hover"
              )}
            >
              <UserIcon aria-hidden className="h-4 w-4" />
              Profile
            </Link>

            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                itemBase,
                "text-content-muted hover:bg-line-subtle hover:text-accent-text-hover"
              )}
            >
              <SettingsIcon aria-hidden className="h-4 w-4" />
              Settings
            </Link>

            <div className="mx-0.5 my-1 h-px bg-line" aria-hidden />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className={cn(
                itemBase,
                "w-full cursor-pointer text-accent-line hover:bg-line-subtle hover:text-accent-text-hover"
              )}
            >
              <LogOutIcon aria-hidden className="h-4 w-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
