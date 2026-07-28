/**
 * src/components/SeasonsCompletedPrompt.tsx
 *
 * Franchise-only second screen shown by EntryEditModal after a series entry
 * is newly marked completed: an optional, dismissible prompt to mark the
 * individual seasons completed too — never applied automatically. The parent
 * only mounts this when the transition actually happened, so it has nothing
 * to do but render.
 */
import { PartyPopper } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { markFranchiseSeasonsCompleted } from "../services/supabase/userFranchiseList";
import { userListQueryKey } from "../services/supabase/userLists";
import { ModalShell } from "./ModalShell";

// #region Types
interface SeasonsCompletedPromptProps {
  onClose: () => void;
  franchiseKey: number;
  franchiseTitle: string;
}
// #endregion Types

// #region Component Logic
export const SeasonsCompletedPrompt = ({
  onClose,
  franchiseKey,
  franchiseTitle,
}: SeasonsCompletedPromptProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markSeasonsMutation = useMutation({
    mutationFn: () => markFranchiseSeasonsCompleted(franchiseKey, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userListQueryKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
      onClose();
    },
  });
  // #endregion Component Logic

  // #region Render
  return (
    <ModalShell panelClassName="w-full max-w-md p-6 sm:p-8">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-400">
        Series completed
      </p>
      <h2 className="mt-1.5 flex items-center gap-2 text-2xl font-semibold text-white">
        <PartyPopper aria-hidden className="size-6 text-rose-400" />
        Nice one
      </h2>
      <p className="mt-3 text-sm text-zinc-400">
        Mark all seasons of{" "}
        <span className="text-rose-300">{franchiseTitle}</span> in your list as
        completed too?
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={() => markSeasonsMutation.mutate()}
          disabled={markSeasonsMutation.isPending}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:flex-1"
        >
          {markSeasonsMutation.isPending ? "Marking..." : "Yes, mark seasons"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-zinc-800 px-4 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:w-auto"
        >
          No, leave them
        </button>
      </div>
    </ModalShell>
  );
  // #endregion Render
};
