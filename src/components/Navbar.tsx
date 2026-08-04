/**
 * src/components/Navbar.tsx
 *
 * Floating pill navigation. The centre cluster keeps its items icon-only until
 * the group is hovered or one is active, which is what lets four destinations
 * sit in a bar this narrow; the account menu on the right owns profile,
 * settings, and sign out.
 */
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookmarkIcon,
  LogOutIcon,
  MenuIcon,
  PenLineIcon,
  RssIcon,
  TvIcon,
  UsersIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getProfileById, profileQueryKey } from "../services/supabase/profiles";
import { AccountMenu } from "./AccountMenu";
import { cn, control, focusRing, radius, surface } from "../styles/tokens";

/** `signedOut` renders as a sign-in prompt. `pending` (signed in, but the
 * profile that would supply the destination hasn't loaded yet) renders as an
 * inert placeholder instead — NOT a sign-in link, since sending an
 * already-authenticated visitor to /signin would just bounce them back to
 * "/" via useRedirectIfAuthenticated with no explanation. */
type NavItemState =
  | { kind: "ready"; to: string }
  | { kind: "pending" }
  | { kind: "signedOut" };

interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Exact-match only, so a sub-route doesn't light the parent up too. */
  end?: boolean;
  state: NavItemState;
}

/** Active and resting treatments, shared by the desktop pill and mobile sheet. */
const navItemActive = "text-accent-text-hover bg-white/5";
const navItemResting =
  "border-transparent text-content-muted hover:bg-white/3 hover:text-content";

/** Desktop pill content — icon plus a label that unfurls on hover/focus of
 * the group, or stays unfurled while `active`. */
const DesktopNavLabel = ({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
}) => (
  <>
    <Icon aria-hidden className="h-4 w-4 shrink-0" />
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
        active
          ? "ml-1.5 max-w-[90px] opacity-100"
          : "max-w-0 opacity-0 group-hover/nav:ml-1.5 group-hover/nav:max-w-[90px] group-hover/nav:opacity-100 group-focus-within/navitem:ml-1.5 group-focus-within/navitem:max-w-[90px] group-focus-within/navitem:opacity-100"
      )}
    >
      {label}
    </span>
  </>
);

/** Renders a `signedOut` or `pending` item: a sign-in prompt for the former,
 * an inert placeholder for the latter — see NavItemState's doc comment.
 * A plain element rather than a route-matching NavLink either way, since
 * neither state has a real destination to track as active. */
const InertNavItem = ({
  item,
  variant,
  kind,
  onNavigate,
}: {
  item: NavItem;
  variant: "desktop" | "mobile";
  kind: "pending" | "signedOut";
  onNavigate?: () => void;
}) => {
  const Icon = item.icon;
  const pendingClassName = kind === "pending" && "cursor-default opacity-50";

  const content =
    variant === "mobile" ? (
      <>
        <Icon aria-hidden className="h-4 w-4 shrink-0" />
        {item.label}
      </>
    ) : (
      <DesktopNavLabel icon={Icon} label={item.label} active={false} />
    );

  const className = cn(
    variant === "mobile"
      ? cn(
          "flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-colors",
          focusRing,
          "border-transparent text-content-muted hover:bg-line-subtle hover:text-content"
        )
      : cn(
          "flex h-10 items-center overflow-hidden px-3.5",
          "font-medium text-sm transition-all duration-200",
          radius.pill,
          focusRing,
          navItemResting
        ),
    pendingClassName
  );

  if (kind === "pending") {
    return (
      <li className={variant === "desktop" ? "group/navitem" : undefined}>
        <span aria-disabled="true" title={item.label} className={className}>
          {content}
        </span>
      </li>
    );
  }

  return (
    <li className={variant === "desktop" ? "group/navitem" : undefined}>
      <Link
        to="/signin"
        title={item.label}
        onClick={onNavigate}
        className={className}
      >
        {content}
      </Link>
    </li>
  );
};

/** One nav destination, rendered either as a desktop icon-that-unfurls pill
 * item or a mobile icon+label row. Both variants share the same data and
 * active-state logic, so a new item or a restyle only happens in one place. */
const NavItemLink = ({
  item,
  variant,
  onNavigate,
}: {
  item: NavItem;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) => {
  if (item.state.kind !== "ready") {
    return (
      <InertNavItem
        item={item}
        variant={variant}
        kind={item.state.kind}
        onNavigate={onNavigate}
      />
    );
  }

  const Icon = item.icon;
  const to = item.state.to;

  if (variant === "mobile") {
    const restingClassName = cn(
      "flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-colors",
      focusRing,
      "border-transparent text-content-muted hover:bg-line-subtle hover:text-content"
    );

    return (
      <li>
        <NavLink
          to={to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-colors",
              focusRing,
              isActive ? navItemActive : restingClassName
            )
          }
        >
          <Icon aria-hidden className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      </li>
    );
  }

  return (
    <li className="group/navitem">
      <NavLink
        to={to}
        end={item.end}
        title={item.label}
        className={({ isActive }) =>
          cn(
            "flex h-10 items-center overflow-hidden px-3.5",
            "font-medium text-sm transition-all duration-200",
            radius.pill,
            focusRing,
            isActive ? navItemActive : navItemResting
          )
        }
      >
        {({ isActive }) => (
          <DesktopNavLabel icon={Icon} label={item.label} active={isActive} />
        )}
      </NavLink>
    </li>
  );
};

interface NavbarProps {
  /** Set on the sign-in/sign-up/forgot-password/reset-password pages: forces
   * the signed-out chrome regardless of actual auth state, so the account
   * menu's sign-out is never reachable there. It's not just cosmetic — a
   * password-reset link signs the visitor into a one-time recovery session,
   * and reaching sign-out from the navbar mid-flow would end that session
   * before the new password is submitted. Also skips the profile fetch,
   * which these pages never render anything from. */
  authPage?: boolean;
}

export const Navbar = ({ authPage = false }: NavbarProps = {}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user: sessionUser, signOut } = useAuth();
  const user = authPage ? null : sessionUser;

  const { data: profile } = useQuery({
    queryKey: profileQueryKey(user?.id),
    queryFn: () => getProfileById(user!.id),
    enabled: !!user?.id,
  });

  // Friends and My List need a username to link to their real destination.
  const friendsAndListState = (suffix: "" | "/friends"): NavItemState => {
    if (!user) return { kind: "signedOut" };
    if (!profile) return { kind: "pending" };
    return { kind: "ready", to: `/profile/${profile.username}${suffix}` };
  };

  const navItems: NavItem[] = [
    {
      label: "Feed",
      state: { kind: "ready", to: "/" },
      icon: RssIcon,
      end: true,
    },
    {
      label: "Post",
      state: { kind: "ready", to: "/entry/create" },
      icon: PenLineIcon,
    },
    { label: "Anime", state: { kind: "ready", to: "/anime" }, icon: TvIcon },
    {
      label: "Friends",
      state: friendsAndListState("/friends"),
      icon: UsersIcon,
    },
    {
      label: "My List",
      state: friendsAndListState(""),
      icon: BookmarkIcon,
      end: true,
    },
  ];

  return (
    <div className="fixed inset-x-0 top-2 z-40 flex justify-center px-3 sm:top-4 sm:px-4">
      <div className="w-full max-w-[1000px]">
        {/* Plain flex row on phones; the three-column grid that centres the
            nav pill only earns its keep once that pill is visible at md. */}
        <nav
          aria-label="Main"
          className={cn(
            "flex h-12 items-center justify-between px-2.5",
            "sm:h-14 sm:px-3.5 md:grid md:grid-cols-[1fr_auto_1fr]",
            "border border-line bg-field/88 backdrop-blur-xl",
            "shadow-[0_12px_26px_rgba(0,0,0,0.55)]",
            radius.pill
          )}
        >
          {/* Left side of the navbar — the wordmark, always shown at full
              brightness (the Feed pill item is what tracks "/"'s active
              state now). */}
          <Link
            to="/"
            aria-label="Issho home"
            className={cn(
              "min-w-0 justify-self-start truncate rounded pl-2 font-mono text-base font-semibold",
              "text-content transition sm:pl-2.5 sm:text-lg",
              focusRing
            )}
          >
            Issho
            <span className="text-accent-line">
              {profile?.username ? `.${profile.username}` : ""}
            </span>
          </Link>

          {/* Middle Column — labels unfurl on hover of the group, or when active */}
          <ul
            className={cn(
              "group/nav hidden h-12 items-center gap-1 justify-self-center p-1.5 md:flex"
            )}
          >
            {navItems.map((item) => (
              <NavItemLink key={item.label} item={item} variant="desktop" />
            ))}
          </ul>

          {/* Right side of the navbar */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 justify-self-end pr-0.5 sm:gap-2 sm:pr-1.5">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              className={cn(
                "flex h-9 w-9 cursor-pointer items-center justify-center md:hidden",
                control.variant.secondaryTranslucent,
                radius.pill,
                focusRing
              )}
            >
              {mobileOpen ? (
                <XIcon aria-hidden className="h-4 w-4" />
              ) : (
                <MenuIcon aria-hidden className="h-4 w-4" />
              )}
            </button>

            {user ? (
              profile ? (
                <AccountMenu
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                />
              ) : (
                // Profile hasn't resolved yet (or the row is missing) — keep
                // sign-out reachable rather than showing nothing while the
                // full account menu waits on it.
                <button
                  type="button"
                  onClick={() => signOut()}
                  aria-label="Sign out"
                  className={cn(
                    "flex h-9 w-9 cursor-pointer items-center justify-center",
                    control.variant.secondaryTranslucent,
                    radius.pill,
                    focusRing
                  )}
                >
                  <LogOutIcon aria-hidden className="h-4 w-4" />
                </button>
              )
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Link
                  to="/signin"
                  className={cn(
                    "px-2.5 py-2 text-sm whitespace-nowrap text-content-muted",
                    "transition hover:text-content sm:px-3",
                    radius.pill,
                    focusRing
                  )}
                >
                  Sign In
                </Link>

                <Link
                  to="/signup"
                  className={cn(
                    "bg-accent px-3 py-2 text-sm font-semibold whitespace-nowrap text-white",
                    "transition-colors hover:bg-accent-hover sm:px-3.5",
                    radius.pill,
                    focusRing
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile nav — the account menu stays in the bar, so this is only the
            destinations the desktop pill holds. */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className={cn(
                surface.floatingPanel,
                "mt-2 space-y-1 rounded-3xl p-2 md:hidden"
              )}
            >
              {navItems.map((item) => (
                <NavItemLink
                  key={item.label}
                  item={item}
                  variant="mobile"
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
