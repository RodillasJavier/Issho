/**
 * src/components/ModalShell.tsx
 *
 * Shared centered-modal backdrop + panel used by EntryEditModal and
 * SeasonsCompletedPrompt. `panelClassName` carries the panel-specific
 * sizing/spacing classes each caller needs.
 */
import { useRef } from "react";

interface ModalShellProps {
  panelClassName: string;
  /** Closes the modal. Wired to a click on the backdrop (not the panel). */
  onClose: () => void;
  /**
   * Whether a backdrop click may dismiss. Callers set this false while a
   * mutation is in flight, so a stray click can't unmount the modal between
   * a save starting and its follow-up step rendering.
   */
  dismissible?: boolean;
  children: React.ReactNode;
}

export const ModalShell = ({
  panelClassName,
  onClose,
  dismissible = true,
  children,
}: ModalShellProps) => {
  // Where the press started. A `click` is dispatched on the nearest common
  // ancestor of its mousedown and mouseup targets, so a drag that begins
  // inside the panel — selecting text in the review box — and releases over
  // the backdrop reports the backdrop as `event.target`. Checking the click
  // target alone would treat that as a dismiss and throw away the edit.
  const pressStartedOn = useRef<EventTarget | null>(null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      // Deliberately no backdrop-blur. A backdrop-filter on a full-viewport
      // fixed element makes the compositor re-blur everything behind it on
      // every frame the overlay repaints — and behind this sits the profile
      // grid: a dozen cover images, each card its own compositing layer. That
      // turned scrolling inside the panel into a slideshow. A flat scrim costs
      // nothing and reads the same.
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        pressStartedOn.current = event.target;
      }}
      onClick={(event) => {
        if (!dismissible) return;
        if (
          event.target === event.currentTarget &&
          pressStartedOn.current === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        // overscroll-contain stops a scroll that reaches the panel's end from
        // chaining into the page behind it.
        className={`overscroll-contain rounded-xl border border-zinc-800 bg-neutral-900 shadow-2xl ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
};
