/**
 * src/components/FriendsViewToggle.tsx
 *
 * Two-way toggle between the Friends page's "channels" view (each friend's
 * latest activity, grouped) and "directory" view (a compact list).
 */
import { LayoutGrid, List } from "lucide-react";

// #region Types
export type FriendsViewMode = "channels" | "directory";

interface FriendsViewToggleProps {
  mode: FriendsViewMode;
  onChange: (mode: FriendsViewMode) => void;
}
// #endregion Types

// #region Component Logic
export const FriendsViewToggle = ({
  mode,
  onChange,
}: FriendsViewToggleProps) => {
  const optionClasses = (active: boolean) =>
    `inline-flex items-center gap-2 rounded text-sm font-medium px-3 py-1.5 transition-colors cursor-pointer ${
      active
        ? "bg-neutral-800 text-white shadow-sm"
        : "text-neutral-500 hover:text-neutral-200"
    }`;

  return (
    <div
      role="group"
      aria-label="Friends view"
      className="inline-flex w-fit rounded-md border border-neutral-800 bg-neutral-950 p-1"
    >
      <button
        type="button"
        aria-pressed={mode === "channels"}
        onClick={() => onChange("channels")}
        className={optionClasses(mode === "channels")}
      >
        <LayoutGrid className="size-4" />
        <span className="hidden sm:inline">Channels</span>
      </button>

      <button
        type="button"
        aria-pressed={mode === "directory"}
        onClick={() => onChange("directory")}
        className={optionClasses(mode === "directory")}
      >
        <List className="size-4" />
        <span className="hidden sm:inline">Compact list</span>
      </button>
    </div>
  );
  // #endregion Component Logic
};
// #endregion
