/**
 * src/components/ui/Card.tsx
 *
 * Titled panel with an optional header action and footer bar. `className` is
 * additive only (see src/styles/tokens.ts).
 */
import { cn, surface, text } from "../../styles/tokens";

interface CardProps {
  title: string;
  description?: string;
  /** Rendered opposite the title in the header — a link or a small button. */
  action?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * Pins the footer to the bottom of the viewport on small screens, so a
   * long form's Save control stays reachable without scrolling to it.
   */
  stickyFooterOnMobile?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  title,
  description,
  action,
  footer,
  stickyFooterOnMobile = false,
  className,
  children,
}: CardProps) {
  return (
    <section className={cn(surface.card, className)}>
      <header
        className={cn(
          surface.cardHeader,
          "flex flex-wrap items-start justify-between gap-3"
        )}
      >
        <div className="space-y-1">
          <h2 className={text.sectionTitle}>{title}</h2>
          {description && <p className={text.body}>{description}</p>}
        </div>
        {action}
      </header>

      <div className={surface.cardBody}>{children}</div>

      {footer && (
        <div
          className={cn(
            surface.cardFooter,
            "flex flex-col-reverse gap-2 rounded-b-xl sm:flex-row sm:items-center sm:justify-end sm:gap-3",
            stickyFooterOnMobile && "sticky bottom-0 z-10 sm:static"
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}
