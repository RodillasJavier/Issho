/**
 * src/components/auth/AuthLayout.tsx
 *
 * Shared split-screen chrome for the auth pages (sign in/up, password
 * reset): brand + marketing copy on the left, form content on the right.
 */
import { motion, useReducedMotion } from "framer-motion";
import { ClapperboardIcon, RadioIcon, UsersRoundIcon } from "lucide-react";
import { Navbar } from "../Navbar";
import { cn, navbar } from "../../styles/tokens";

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Left-panel headline. Defaults to the sign in/up pitch — pages with a
   * narrower purpose (forgot/reset password) should pass copy that actually
   * describes what the visitor is doing there. */
  asideHeadline?: React.ReactNode;
  children: React.ReactNode;
}

/** Default aside headline, used by SignIn/SignUp. */
const defaultAsideHeadline = (
  <>
    Join the <span className="text-rose-400">Community</span>
  </>
);

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const ASIDE_ENTRANCE_DURATION = 0.42;
const FORM_ENTRANCE_DURATION = 0.35;
const LIST_ITEM_DURATION = 0.28;
const LIST_ITEM_BASE_DELAY = 0.12;
const LIST_ITEM_STAGGER = 0.05;

const communityHighlights = [
  {
    icon: RadioIcon,
    title: "Discover together",
    description: "Share and explore what your friends are watching.",
  },
  {
    icon: ClapperboardIcon,
    title: "Track what moves you",
    description: "Keep every series, season, and favorite in one place.",
  },
  {
    icon: UsersRoundIcon,
    title: "Share your perspective",
    description:
      "Write/Read reviews and ratings from friends who've seen the same stories differently.",
  },
];

export function AuthLayout({
  title,
  subtitle,
  asideHeadline = defaultAsideHeadline,
  children,
}: AuthLayoutProps) {
  const reduceMotion = useReducedMotion();
  const entrance = reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 };

  return (
    // No top padding here on the outer wrapper (or on aside/section
    // themselves): their full-height backgrounds and the divider between
    // them run edge to edge, with the navbar floating on top rather than
    // sitting above a seam. `navbar.clearance` (see styles/tokens.ts)
    // instead lives on each side's inner content (below) — centered content
    // doesn't reliably clear the navbar on its own: the sign-up form is
    // tall enough to render its heading underneath it on an ordinary
    // ~770px-tall laptop viewport otherwise.
    <div className="min-h-screen w-full bg-black text-white">
      <Navbar authPage />
      <main className="grid min-h-screen w-full lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden border-r border-neutral-800 bg-[#101014] lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: reduceMotion ? 0 : ASIDE_ENTRANCE_DURATION,
              ease: EASE_OUT_EXPO,
            }}
            className={cn("max-w-md", navbar.clearance)}
          >
            <h2 className="mb-4 text-5xl font-bold tracking-wide text-content">
              {asideHeadline}
            </h2>

            <p className="mt-5 max-w-md text-lg leading-7 text-neutral-400">
              Issho brings your watchlist, favorite franchises, and friends
              together in one place.
            </p>

            {/* What you can do with Issho */}
            <ul
              className="mt-10 space-y-5"
              aria-label="What you can do with Issho"
            >
              {communityHighlights.map(
                ({ icon: Icon, title: itemTitle, description }, index) => (
                  <motion.li
                    key={itemTitle}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : LIST_ITEM_DURATION,
                      delay: reduceMotion
                        ? 0
                        : LIST_ITEM_BASE_DELAY + index * LIST_ITEM_STAGGER,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="flex gap-3"
                  >
                    {/* Icon container */}
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-rose-500 text-white">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>

                    {/* Item content */}
                    <span>
                      <span className="block text-sm font-semibold text-neutral-200">
                        {itemTitle}
                      </span>

                      <span className="mt-0.5 block text-sm leading-5 text-neutral-500">
                        {description}
                      </span>
                    </span>
                  </motion.li>
                )
              )}
            </ul>
          </motion.div>
        </aside>

        <section className="flex min-h-screen items-center justify-center bg-black px-6 py-12 sm:px-10 lg:px-12">
          <motion.div
            initial={entrance}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: reduceMotion ? 0 : FORM_ENTRANCE_DURATION,
              ease: EASE_OUT_EXPO,
            }}
            className={cn("w-full max-w-xs sm:max-w-sm", navbar.clearance)}
          >
            <header className="mb-8">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  {subtitle}
                </p>
              )}
            </header>
            {children}
          </motion.div>
        </section>
      </main>
    </div>
  );
}
