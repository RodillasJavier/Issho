/**
 * src/components/ui/Disclosure.tsx
 *
 * Height-animated reveal for a section that folds away until asked for.
 * Controlled only: the parent owns `open` so it can also drive its trigger's
 * `aria-expanded`/`aria-controls`.
 */
import { AnimatePresence, motion } from "framer-motion";

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

interface DisclosureProps {
  open: boolean;
  id?: string;
  children: React.ReactNode;
}

export function Disclosure({ open, id, children }: DisclosureProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
          className="overflow-hidden"
        >
          {/* Padding lives inside the animated box so the collapsed height is
              genuinely zero rather than a sliver of margin. */}
          <div className="pt-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
