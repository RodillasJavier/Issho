/**
 * src/components/FriendRequestForm.tsx
 *
 * "Add by username" card on the Friends page: looks up the exact username,
 * checks the existing friendship status so we don't fire a doomed insert,
 * and sends a request.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getProfileByUsername } from "../services/supabase/profiles";
import {
  getFriendshipStatus,
  sendFriendRequest,
} from "../services/supabase/friendships";

// #region Component Logic
export const FriendRequestForm = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async (rawUsername: string) => {
      const target = rawUsername.trim().replace(/^@/, "");
      if (!target) throw new Error("Enter a username.");
      if (!user) throw new Error("You must be signed in to add friends.");

      const targetProfile = await getProfileByUsername(target);
      if (!targetProfile) {
        throw new Error(`No user found with username "${target}".`);
      }
      if (targetProfile.id === user.id) {
        throw new Error("You can't send a friend request to yourself.");
      }

      const status = await getFriendshipStatus(targetProfile.id);
      if (status.isFriend) {
        throw new Error(`You're already friends with ${target}.`);
      }
      if (status.isPending && status.isRequester) {
        throw new Error(`You already sent a request to ${target}.`);
      }
      if (status.isPending && status.isAddressee) {
        throw new Error(
          `${target} already sent you a request — check Incoming requests.`
        );
      }

      await sendFriendRequest(targetProfile.id);
      return target;
    },
    onSuccess: (target) => {
      setUsername("");
      setNotice({
        type: "success",
        message: `Friend request sent to @${target}.`,
      });
    },
    onError: (error: Error) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    mutation.mutate(username);
  };
  // #endregion Component Logic

  // #region Render
  return (
    <section
      aria-labelledby="send-request-heading"
      className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-rose-400/20 bg-rose-400/10 text-rose-300">
          <Search className="size-4" />
        </span>
        <div>
          <h2
            id="send-request-heading"
            className="text-sm font-semibold text-white"
          >
            Add by username
          </h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Enter the exact username of someone you know to send a request.
          </p>
        </div>
      </div>

      <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="friend-username">
          Friend username
        </label>
        <div className="flex min-w-0 flex-1 items-center rounded-md border border-neutral-800 bg-black px-3 focus-within:border-rose-400/60 focus-within:ring-1 focus-within:ring-rose-400/20">
          <span className="mr-1.5 text-sm text-neutral-600">@</span>
          <input
            id="friend-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-neutral-600"
          />
        </div>
        <button
          type="submit"
          disabled={!username.trim() || mutation.isPending}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <UserPlus className="size-4" />
          {mutation.isPending ? "Sending..." : "Send"}
        </button>
      </form>

      {notice && (
        <p
          aria-live="polite"
          className={`mt-3 text-sm ${
            notice.type === "success" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {notice.message}
        </p>
      )}
    </section>
  );
  // #endregion Render
};
// #endregion
