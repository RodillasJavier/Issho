/**
 * src/components/ui/Skeleton.tsx
 *
 * Pulsing placeholder block, the shared primitive behind every route-level
 * page's loading state. Deliberately just a sized, colored div — each page
 * composes its own shape from these rather than reaching for one generic
 * "page skeleton", since a mismatched shape (loading state far shorter than
 * the real content) is exactly the layout-shift/scroll-jump bug this exists
 * to prevent.
 */
import { cn } from "../../styles/tokens";

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("animate-pulse rounded-md bg-line", className)}
  />
);
