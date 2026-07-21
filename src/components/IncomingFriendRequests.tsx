/**
 * src/components/IncomingFriendRequests.tsx
 *
 * "Incoming requests" card on the Friends page: lists pending requests sent
 * to the signed-in user, with accept/dismiss actions.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  getPendingIncomingRequests,
  rejectFriendRequest,
} from "../services/supabase/friendships";
import { UserAvatar } from "./UserAvatar";

// #region Types
interface IncomingFriendRequestsProps {
  profileId: string;
}
// #endregion Types

// #region Component Logic
export const IncomingFriendRequests = ({
  profileId,
}: IncomingFriendRequestsProps) => {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pendingRequests"],
    queryFn: getPendingIncomingRequests,
  });

  const acceptMutation = useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends", profileId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (friendshipId: string) => rejectFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });
  // #endregion Component Logic

  // #region Render
  return (
    <section
      aria-labelledby="incoming-heading"
      className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
    >
      <div className="flex items-center justify-between">
        <h2 id="incoming-heading" className="text-sm font-semibold text-white">
          Incoming requests
        </h2>
        <span className="rounded-full border border-neutral-800 bg-black px-2 py-0.5 font-mono text-[11px] text-neutral-400">
          {requests?.length ?? 0}
        </span>
      </div>

      {isLoading ? (
        <p className="mt-4 text-xs text-neutral-600">Loading...</p>
      ) : requests && requests.length > 0 ? (
        <div className="mt-3 space-y-3">
          {requests.map((request) => {
            const requester = request.requester;
            if (!requester) return null;

            return (
              <div key={request.id} className="flex items-center gap-3">
                <UserAvatar
                  username={requester.username}
                  avatarUrl={requester.avatar_url}
                  size="sm"
                  linkToProfile={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {requester.username}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Wants to connect with you
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => acceptMutation.mutate(request.id)}
                    disabled={acceptMutation.isPending}
                    className="rounded-md bg-rose-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectMutation.mutate(request.id)}
                    disabled={rejectMutation.isPending}
                    className="rounded-md border border-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-xs text-neutral-600">You're all caught up.</p>
      )}
    </section>
  );
  // #endregion Render
};
// #endregion
