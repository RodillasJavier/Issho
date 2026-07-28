/**
 * src/components/ModalShell.tsx
 *
 * Shared centered-modal backdrop + panel used by EntryEditModal and
 * SeasonsCompletedPrompt. `panelClassName` carries the panel-specific
 * sizing/spacing classes each caller needs.
 */
interface ModalShellProps {
  panelClassName: string;
  children: React.ReactNode;
}

export const ModalShell = ({ panelClassName, children }: ModalShellProps) => (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
  >
    <div
      className={`rounded-xl border border-zinc-800 bg-neutral-900 shadow-2xl ${panelClassName}`}
    >
      {children}
    </div>
  </div>
);
