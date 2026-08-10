/**
 * src/components/ui/Pagination.tsx
 *
 * App-wide pagination control: prev/next buttons around a "Page X / Y"
 * indicator. Used identically at the top and bottom of every paginated
 * list — same instance, no compact/dense variant — so pagination looks the
 * same on every page of the app. Purely presentational: callers own the
 * page-state useState and any reset/clamp logic, and pass `pageCount`
 * already computed from data they have.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../styles/tokens";

interface PaginationProps {
  /** 0-indexed current page. */
  pageNumber: number;
  /** Total number of pages. Render nothing when this is <= 1. */
  pageCount: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  /** Additive spacing only — never a respec of layout classes. */
  className?: string;
  /**
   * Accessible name for the `<nav>` landmark. Every list that renders this
   * component twice (once above the content, once below) MUST give the two
   * instances distinct labels — two `<nav aria-label="Pagination">`
   * landmarks on one page are indistinguishable to a screen reader's
   * landmark list otherwise. Defaults to the plain "Pagination" for
   * single-instance callers.
   */
  label?: string;
}

export function Pagination({
  pageNumber,
  pageCount,
  onPrevPage,
  onNextPage,
  className,
  label = "Pagination",
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={label}
      className={cn("flex items-center justify-center gap-3", className)}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={ChevronLeft}
        onClick={onPrevPage}
        disabled={pageNumber === 0}
        aria-label="Previous page"
      >
        Prev
      </Button>

      <span className="font-mono text-xs tracking-widest text-content-subtle uppercase">
        Page {pageNumber + 1}/{pageCount}
      </span>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={ChevronRight}
        iconPosition="trailing"
        onClick={onNextPage}
        disabled={pageNumber >= pageCount - 1}
        aria-label="Next page"
      >
        Next
      </Button>
    </nav>
  );
}
