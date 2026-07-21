/**
 * src/components/CreateEntryCta.tsx
 *
 * Rose call-to-action card linking to the entry composer, shown below
 * FollowingPanel in the feed's sidebar column (signed-in users only) —
 * replaces the old "New entry" header button.
 */
import { Link } from "react-router";
import { Plus } from "lucide-react";

// #region Component Logic
export const CreateEntryCta = () => {
  return (
    <Link
      to="/entry/create"
      aria-label="Create a new entry"
      className="group flex items-center justify-between rounded-md bg-rose-400 px-6 py-5 text-neutral-950 transition-colors hover:bg-rose-300"
    >
      <span>
        <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-800">
          Your journal
        </span>
        <span className="mt-1 block text-lg font-semibold tracking-tight">
          Create new entry
        </span>
      </span>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-950/10 transition-transform group-hover:scale-105">
        <Plus className="size-5" />
      </span>
    </Link>
  );
  // #endregion Component Logic
};
// #endregion
