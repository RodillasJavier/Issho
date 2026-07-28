/**
 * src/pages/FriendsPage.tsx
 *
 * Page displaying a user's friends: on your own page, tools to add friends
 * by username and respond to incoming requests, plus a "channels" view
 * (each friend's latest activity) or a compact "directory" list. Viewing
 * someone else's friends page shows the same list/channels, read-only —
 * though the channels there stay empty unless you're also friends with the
 * person, since RLS only hands over your own friends' entries.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { getProfileByUsername } from "../services/supabase/profiles";
import {
  getFriends,
  getOtherProfile,
  unfriend,
} from "../services/supabase/friendships";
import {
  entriesQueryKey,
  fetchEntriesWithCounts,
} from "../services/supabase/entries";
import { getEntryActivityLabel } from "../constants/entryTypes";
import { FriendRequestForm } from "../components/FriendRequestForm";
import { IncomingFriendRequests } from "../components/IncomingFriendRequests";
import {
  FriendsViewToggle,
  type FriendsViewMode,
} from "../components/FriendsViewToggle";
import { FriendChannel } from "../components/FriendChannel";
import { FriendDirectoryCard } from "../components/FriendDirectoryCard";
import type { Entry, Friendship, Profile } from "../types/database.types";

// #region Component Logic
export const FriendsPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<FriendsViewMode>("channels");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfileByUsername(username!),
    enabled: !!username,
  });

  const isOwnProfile = !!user && user.id === profile?.id;

  const { data: friendships, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends", profile?.id],
    queryFn: () => getFriends(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: allEntries, isLoading: entriesLoading } = useQuery({
    queryKey: entriesQueryKey(user?.id),
    queryFn: fetchEntriesWithCounts,
    enabled: !!user,
  });

  const unfriendMutation = useMutation({
    mutationFn: (friendshipId: string) => unfriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", profile?.id] });
    },
  });

  // Resolve each friendship to the *other* profile (not the page owner)
  const friendRows = useMemo(() => {
    if (!friendships || !profile) return [];
    return friendships
      .map((friendship) => ({
        friendship,
        friendProfile: getOtherProfile(friendship, profile.id),
      }))
      .filter(
        (row): row is { friendship: Friendship; friendProfile: Profile } =>
          !!row.friendProfile
      );
  }, [friendships, profile]);

  // Each friend's 3 most recent entries, grouped in a single pass over the
  // shared bulk fetch (which is already sorted most-recent-first)
  const entriesByFriend = useMemo(() => {
    const map = new Map<string, Entry[]>();
    if (!allEntries) return map;
    const friendIds = new Set(friendRows.map((row) => row.friendProfile.id));
    for (const entry of allEntries) {
      if (!friendIds.has(entry.user_id)) continue;
      const existing = map.get(entry.user_id);
      if (existing) {
        if (existing.length < 3) existing.push(entry);
      } else {
        map.set(entry.user_id, [entry]);
      }
    }
    return map;
  }, [allEntries, friendRows]);

  // Channels view: most recent activity first, friends with no activity last
  const channelRows = useMemo(() => {
    return [...friendRows].sort((a, b) => {
      const aLatest = entriesByFriend.get(a.friendProfile.id)?.[0]?.created_at;
      const bLatest = entriesByFriend.get(b.friendProfile.id)?.[0]?.created_at;
      if (!aLatest && !bLatest) return 0;
      if (!aLatest) return 1;
      if (!bLatest) return -1;
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });
  }, [friendRows, entriesByFriend]);

  // Directory view: alphabetical by username
  const directoryRows = useMemo(() => {
    return [...friendRows].sort((a, b) =>
      a.friendProfile.username.localeCompare(b.friendProfile.username)
    );
  }, [friendRows]);
  // #endregion Component Logic

  // #region Render
  if (profileLoading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-b border-neutral-800 pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-rose-400">
            Your anime circle
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Friends
            </h1>
            <p className="text-sm text-neutral-500">
              {isOwnProfile
                ? "Follow what your friends are watching, then manage your circle from one place."
                : `${profile.username}'s anime circle.`}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-0">
          <span className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-400">
            {friendRows.length} {friendRows.length === 1 ? "friend" : "friends"}
          </span>
          <FriendsViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </section>

      {isOwnProfile && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(290px,0.72fr)]">
          <FriendRequestForm />
          <IncomingFriendRequests profileId={profile.id} />
        </div>
      )}

      {friendsLoading ? (
        <div>Loading friends...</div>
      ) : friendRows.length > 0 ? (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              {viewMode === "channels" ? "Latest from friends" : "Friend list"}
            </h2>
            <p className="font-mono text-xs text-neutral-600">
              {friendRows.length} showing
            </p>
          </div>

          {viewMode === "channels" ? (
            <div className="space-y-8">
              {channelRows.map(({ friendProfile }) => (
                <FriendChannel
                  key={friendProfile.id}
                  friend={friendProfile}
                  entries={entriesByFriend.get(friendProfile.id) ?? []}
                  entriesLoading={entriesLoading}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {directoryRows.map(({ friendship, friendProfile }) => {
                const friendEntries =
                  entriesByFriend.get(friendProfile.id) ?? [];
                const latestEntry = friendEntries[0];
                const activityLabel = latestEntry
                  ? getEntryActivityLabel(latestEntry)
                  : "No activity yet";

                return (
                  <FriendDirectoryCard
                    key={friendProfile.id}
                    friend={friendProfile}
                    activityLabel={activityLabel}
                    onRemove={
                      isOwnProfile
                        ? () => unfriendMutation.mutate(friendship.id)
                        : undefined
                    }
                    isRemoving={
                      isOwnProfile &&
                      unfriendMutation.isPending &&
                      unfriendMutation.variables === friendship.id
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-neutral-200">
            {isOwnProfile ? "Your friends list is empty" : "No friends yet"}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {isOwnProfile
              ? "Send a request with a username you know, or accept an incoming request to build your circle."
              : `${profile.username} hasn't added any friends yet.`}
          </p>
        </div>
      )}
    </div>
  );
  // #endregion Render
};
// #endregion
