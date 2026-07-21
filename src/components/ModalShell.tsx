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
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div
      className={`bg-neutral-900 rounded-lg border border-neutral-800 ${panelClassName}`}
    >
      {children}
    </div>
  </div>
);
