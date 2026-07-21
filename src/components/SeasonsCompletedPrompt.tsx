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
      queryClient.invalidateQueries({ queryKey: ["userAnimeList"] });
      queryClient.invalidateQueries({ queryKey: ["userListStats"] });
      onClose();
    },
  });
  // #endregion Component Logic

  // #region Render
  return (
    <ModalShell panelClassName="max-w-md w-full p-6 space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <PartyPopper className="size-5 text-rose-400" />
        Series completed
      </h2>
      <p className="text-neutral-300">
        Mark all seasons of{" "}
        <span className="text-rose-300">{franchiseTitle}</span> in your list as
        completed too?
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-white text-sm transition-colors cursor-pointer"
        >
          No, leave them
        </button>
        <button
          onClick={() => markSeasonsMutation.mutate()}
          disabled={markSeasonsMutation.isPending}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          {markSeasonsMutation.isPending ? "Marking..." : "Yes, mark seasons"}
        </button>
      </div>
    </ModalShell>
  );
  // #endregion Render
};
