/**
 * src/hooks/useDismissableMenu.ts
 *
 * Open state for a dropdown/menu that closes on an outside click or Escape.
 * `containerRef` should wrap everything that counts as "inside" (trigger and
 * panel alike). Pass `restoreFocusRef` when Escape should hand focus back to
 * the trigger — an outside click doesn't, since focus is already moving
 * wherever the user clicked.
 */
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export function useDismissableMenu<T extends HTMLElement>(
  restoreFocusRef?: RefObject<HTMLElement | null>
) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        restoreFocusRef?.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, restoreFocusRef]);

  return { open, setOpen, containerRef };
}
