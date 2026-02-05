/**
 * src/components/FriendButton.tsx
 *
 * Button component for managing friendships between users.
 * Shows different actions based on friendship status.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  unfriend,
} from "../services/supabase/friendships";

interface FriendButtonProps {
  targetUserId: string;
}

// #region Component Logic

export const FriendButton = ({ targetUserId }: FriendButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch friendship status
  const { data: statusInfo, isLoading } = useQuery({
    queryKey: ["friendshipStatus", targetUserId],
    queryFn: () => getFriendshipStatus(targetUserId),
    enabled: !!user,
  });

  // Mutation for sending friend request
  const sendRequestMutation = useMutation({
    mutationFn: () => sendFriendRequest(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendshipStatus", targetUserId],
      });
    },
  });

  // Mutation for accepting friend request
  const acceptRequestMutation = useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendshipStatus", targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });

  // Mutation for rejecting friend request
  const rejectRequestMutation = useMutation({
    mutationFn: (friendshipId: string) => rejectFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendshipStatus", targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });

  // Mutation for canceling friend request
  const cancelRequestMutation = useMutation({
    mutationFn: (friendshipId: string) => cancelFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendshipStatus", targetUserId],
      });
    },
  });

  // Mutation for unfriending
  const unfriendMutation = useMutation({
    mutationFn: (friendshipId: string) => unfriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendshipStatus", targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  // #endregion Component Logic

  // #region Render

  if (!user || isLoading) {
    return null;
  }

  if (!statusInfo) {
    return null;
  }

  const { friendship, isFriend, isPending, isRequester, isAddressee } =
    statusInfo;

  // Already friends - show unfriend button
  if (isFriend && friendship) {
    return (
      <button
        onClick={() => unfriendMutation.mutate(friendship.id)}
        disabled={unfriendMutation.isPending}
        className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white text-sm rounded border border-neutral-600 transition disabled:opacity-50"
      >
        {unfriendMutation.isPending ? "Removing..." : "Unfriend"}
      </button>
    );
  }

  // Pending request sent by current user - show cancel option
  if (isPending && isRequester && friendship) {
    return (
      <button
        onClick={() => cancelRequestMutation.mutate(friendship.id)}
        disabled={cancelRequestMutation.isPending}
        className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white text-sm rounded border border-neutral-600 transition disabled:opacity-50"
      >
        {cancelRequestMutation.isPending ? "Canceling..." : "Request Pending"}
      </button>
    );
  }

  // Pending request received by current user - show accept/reject
  if (isPending && isAddressee && friendship) {
    return (
      <div className="flex flex-row gap-2">
        <button
          onClick={() => acceptRequestMutation.mutate(friendship.id)}
          disabled={acceptRequestMutation.isPending}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded border border-rose-600 transition disabled:opacity-50 whitespace-nowrap"
        >
          {acceptRequestMutation.isPending ? "Accepting..." : "Accept"}
        </button>

        <button
          onClick={() => rejectRequestMutation.mutate(friendship.id)}
          disabled={rejectRequestMutation.isPending}
          className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white text-sm rounded border border-neutral-600 transition disabled:opacity-50 whitespace-nowrap"
        >
          {rejectRequestMutation.isPending ? "Rejecting..." : "Reject"}
        </button>
      </div>
    );
  }

  // No relationship - show add friend button
  return (
    <button
      onClick={() => sendRequestMutation.mutate()}
      disabled={sendRequestMutation.isPending}
      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50"
    >
      {sendRequestMutation.isPending ? "Sending..." : "Add Friend"}
    </button>
  );
};

// #endregion Render
