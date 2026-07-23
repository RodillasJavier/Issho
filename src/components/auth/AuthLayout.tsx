/**
 * src/components/auth/AuthLayout.tsx
 *
 * Shared split-screen chrome for the auth pages (sign in/up, password
 * reset): brand + marketing copy on the left, form content on the right.
 */
import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ClapperboardIcon, RadioIcon, UsersRoundIcon } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

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
    description: "Find the stories and moments your circle is talking about.",
  },
  {
    icon: ClapperboardIcon,
    title: "Track what moves you",
    description: "Keep every series, season, and favorite in one watchlist.",
  },
  {
    icon: UsersRoundIcon,
    title: "Share your perspective",
    description: "Connect with fans who see the same stories differently.",
  },
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const reduceMotion = useReducedMotion();
  const entrance = reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 };

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <main className="grid min-h-screen w-full lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden border-r border-neutral-800 bg-[#101014] lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-20">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: reduceMotion ? 0 : ASIDE_ENTRANCE_DURATION,
              ease: EASE_OUT_EXPO,
            }}
            className="max-w-md"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-rose-400">
              Your next chapter starts here
            </p>
            <h2 className="max-w-sm text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Join the conversation around what you love.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-neutral-400">
              Issho brings your watchlist, favorite franchises, and trusted
              circle together in one place.
            </p>

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
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-rose-500 text-white">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
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
            className="w-full max-w-xs sm:max-w-sm"
          >
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 rounded font-mono text-lg font-bold tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black lg:mb-12"
              aria-label="Issho home"
            >
              Issho
            </Link>
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
