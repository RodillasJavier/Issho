/**
 * src/services/supabase/friendships.ts
 *
 * API functions for managing friendships between users.
 */
import supabase from "../../supabase-client";
import type {
  Friendship,
  FriendshipStatusInfo,
} from "../../types/database.types";

/**
 * Send a friend request to another user
 *
 * @param addresseeId - The ID of the user to send request to
 * @returns The created friendship object
 */
export const sendFriendRequest = async (
  addresseeId: string
): Promise<Friendship> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("friendships")
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Friendship;
};

/**
 * Accept a friend request
 *
 * @param friendshipId - The ID of the friendship to accept
 * @returns The updated friendship object
 */
export const acceptFriendRequest = async (
  friendshipId: string
): Promise<Friendship> => {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Friendship;
};

/**
 * Reject a friend request
 *
 * @param friendshipId - The ID of the friendship to reject
 */
export const rejectFriendRequest = async (
  friendshipId: string
): Promise<void> => {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) throw new Error(error.message);
};

/**
 * Cancel a friend request you sent
 *
 * @param friendshipId - The ID of the friendship to cancel
 */
export const cancelFriendRequest = async (
  friendshipId: string
): Promise<void> => {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) throw new Error(error.message);
};

/**
 * Remove a friendship (unfriend)
 *
 * @param friendshipId - The ID of the friendship to remove
 */
export const unfriend = async (friendshipId: string): Promise<void> => {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) throw new Error(error.message);
};

/**
 * Get friendship status with another user
 *
 * @param otherUserId - The ID of the other user
 * @returns Friendship status information
 */
export const getFriendshipStatus = async (
  otherUserId: string
): Promise<FriendshipStatusInfo> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      friendship: null,
      isFriend: false,
      isPending: false,
      isRequester: false,
      isAddressee: false,
    };
  }

  // Check both directions of friendship
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (error) throw new Error(error.message);

  const friendship = data as Friendship | null;

  if (!friendship) {
    return {
      friendship: null,
      isFriend: false,
      isPending: false,
      isRequester: false,
      isAddressee: false,
    };
  }

  const isRequester = friendship.requester_id === user.id;
  const isAddressee = friendship.addressee_id === user.id;
  const isFriend = friendship.status === "accepted";
  const isPending = friendship.status === "pending";

  return {
    friendship,
    isFriend,
    isPending,
    isRequester,
    isAddressee,
  };
};

/**
 * Get list of friends for a user
 *
 * @param userId - The ID of the user to get friends for
 * @returns Array of friendships with profile data
 */
export const getFriends = async (userId: string): Promise<Friendship[]> => {
  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      requester:profiles!friendships_requester_id_fkey(*),
      addressee:profiles!friendships_addressee_id_fkey(*)
    `
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Friendship[];
};

/**
 * Get pending incoming friend requests for current user
 *
 * @returns Array of pending friendships with requester profile data
 */
export const getPendingIncomingRequests = async (): Promise<Friendship[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      requester:profiles!friendships_requester_id_fkey(*)
    `
    )
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Friendship[];
};

/**
 * Get pending outgoing friend requests for current user
 *
 * @returns Array of pending friendships with addressee profile data
 */
export const getPendingOutgoingRequests = async (): Promise<Friendship[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      addressee:profiles!friendships_addressee_id_fkey(*)
    `
    )
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Friendship[];
};

/**
 * Get IDs of all friends for the current user (for filtering feeds)
 *
 * @returns Array of friend user IDs
 */
export const getFriendIds = async (): Promise<string[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) throw new Error(error.message);

  // Extract friend IDs (the user ID that's not the current user)
  const friendIds = data.map((friendship) =>
    friendship.requester_id === user.id
      ? friendship.addressee_id
      : friendship.requester_id
  );

  return friendIds;
};
