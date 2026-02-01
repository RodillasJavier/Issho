/**
 * src/pages/FriendsPage.tsx
 *
 * Page displaying a user's friends list and pending friend requests.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { getProfileByUsername } from "../services/supabase/profiles";
import {
  getFriends,
  getPendingIncomingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../services/supabase/friendships";
import { searchUsers } from "../services/supabase/userSearch";
import { UserAvatar } from "../components/UserAvatar";
import { FriendButton } from "../components/FriendButton";
import type { Friendship, Profile } from "../types/database.types";

// #region Component Logic
export const FriendsPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch profile of the user whose friends we're viewing
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfileByUsername(username!),
    enabled: !!username,
  });

  const isOwnProfile = user?.id === profile?.id;

  // Search users query (only for own profile when searching for friends)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["userSearch", searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: isOwnProfile && searchQuery.length >= 2,
  });

  // Fetch friends list
  const { data: friendships, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends", profile?.id],
    queryFn: () => getFriends(profile!.id),
    enabled: !!profile?.id,
  });

  // Fetch pending incoming requests (only for own profile when viewing own friends)
  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["pendingRequests"],
    queryFn: getPendingIncomingRequests,
    enabled: isOwnProfile,
  });

  // Mutation for accepting friend request
  const acceptRequestMutation = useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });

  // Mutation for rejecting friend request
  const rejectRequestMutation = useMutation({
    mutationFn: (friendshipId: string) => rejectFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });

  // #endregion Component Logic

  // #region Render

  if (profileLoading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Helper to get friend profile from friendship (the user who isn't the profile owner)
  const getFriendProfile = (friendship: Friendship): Profile | undefined => {
    if (friendship.requester_id === profile.id) {
      return friendship.addressee;
    }
    return friendship.requester;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-semibold mb-8 bg-gradient-to-r from-rose-300 to-rose-800 bg-clip-text text-transparent">
        {isOwnProfile ? "Your Friends" : `${profile.username}'s Friends`}
      </h2>

      {/* User Search Section (only for own profile) */}
      {isOwnProfile && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-rose-300">
            Find Friends
          </h3>

          <div className="flex relative">
            <input
              type="text"
              placeholder="Search users by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div className="mt-4 space-y-2">
              {searchLoading ? (
                <div className="text-gray-400 text-center py-4">
                  Searching...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults
                  .filter((result) => result.id !== user?.id)
                  .map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
                    >
                      <Link
                        to={`/profile/${result.username}`}
                        className="flex items-center gap-3 hover:opacity-80 transition"
                      >
                        <UserAvatar
                          avatarUrl={result.avatar_url}
                          username={result.username}
                          size="md"
                        />

                        <div className="flex flex-col">
                          <span className="text-lg font-medium text-white">
                            {result.username}
                          </span>
                          {result.bio && (
                            <span className="text-sm text-gray-400 line-clamp-1">
                              {result.bio}
                            </span>
                          )}
                        </div>
                      </Link>

                      <FriendButton targetUserId={result.id} />
                    </div>
                  ))
              ) : (
                <div className="text-gray-400 text-center py-4">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending Incoming Requests Section (only for own profile) */}
      {isOwnProfile && pendingRequests && pendingRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-rose-300">
            Pending Friend Requests ({pendingRequests.length})
          </h3>

          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const requesterProfile = request.requester;
              if (!requesterProfile) return null;

              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
                >
                  <Link
                    to={`/profile/${requesterProfile.username}`}
                    className="flex items-center gap-3 hover:opacity-80 transition"
                  >
                    <UserAvatar
                      avatarUrl={requesterProfile.avatar_url}
                      username={requesterProfile.username}
                      size="md"
                    />

                    <span className="text-lg font-medium text-white">
                      {requesterProfile.username}
                    </span>
                  </Link>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequestMutation.mutate(request.id)}
                      disabled={acceptRequestMutation.isPending}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => rejectRequestMutation.mutate(request.id)}
                      disabled={rejectRequestMutation.isPending}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-2xl font-semibold mb-4 text-rose-300">
          Friends {friendships && `(${friendships.length})`}
        </h3>

        {friendsLoading || requestsLoading ? (
          <div>Loading friends...</div>
        ) : friendships && friendships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friendships.map((friendship) => {
              const friendProfile = getFriendProfile(friendship);
              if (!friendProfile) return null;

              return (
                <Link
                  key={friendship.id}
                  to={`/profile/${friendProfile.username}`}
                  className="flex items-center gap-3 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 hover:border-rose-500 transition"
                >
                  <UserAvatar
                    avatarUrl={friendProfile.avatar_url}
                    username={friendProfile.username}
                    size="md"
                  />

                  <span className="text-lg font-medium text-white">
                    {friendProfile.username}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            {isOwnProfile
              ? "You haven't added any friends yet. Visit user profiles to send friend requests!"
              : `${profile.username} hasn't added any friends yet.`}
          </div>
        )}
      </div>
    </div>
  );
};

// #endregion Render
