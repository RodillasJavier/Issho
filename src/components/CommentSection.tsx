/**
 * src/components/CommentSection.tsx
 *
 * Component for displaying and adding comments to an entry: heading with a
 * live count, a sort control, a composer card, the threaded comment list
 * (first few shown, expandable), and sign-in gating for anonymous viewers.
 */
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentItem } from "./CommentItem";
import { CommentSortTabs } from "./CommentSortTabs";
import { UserAvatar } from "./UserAvatar";
import { getProfileById } from "../services/supabase/profiles";
import {
  commentsQueryKey,
  fetchComments,
  postComment,
} from "../services/supabase/comments";
import {
  entriesQueryKey,
  incrementEntryCommentCount,
} from "../services/supabase/entries";
import { buildCommentTree, sortComments } from "../utils/comments";
import type { CommentSort } from "../constants/commentSort";
import type { Entry } from "../types/database.types";

// #region Types
import type { Comment } from "../types/database.types";

interface CommentSectionProps {
  entryId: string;
}

const VISIBLE_ROOT_COMMENTS = 3;
// #endregion Types

export const CommentSection = ({ entryId }: CommentSectionProps) => {
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [sort, setSort] = useState<CommentSort>("top");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Comment[], Error>({
    queryKey: commentsQueryKey(entryId),
    queryFn: () => fetchComments(entryId),
    // Comments carry their author's identity, so logged-out visitors don't
    // get them at all — RLS would return an empty list regardless, and not
    // asking keeps the anonymous entry view genuinely anonymous.
    enabled: !!user,
  });

  // Own profile for the composer avatar
  const { data: ownProfile } = useQuery({
    queryKey: ["profileById", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: !!user,
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (content: string) => postComment(entryId, user?.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(entryId) });

      // Keep the cached feed list's comment count in sync so navigating
      // back shows the up-to-date number instead of the stale initial fetch.
      queryClient.setQueryData<Entry[]>(entriesQueryKey(user?.id), (old) =>
        incrementEntryCommentCount(old, entryId)
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload

    if (!newCommentText.trim()) {
      return;
    }

    mutate(newCommentText.trim());

    setNewCommentText("");
  };

  // Memoized so typing in the composer (which re-renders this component on
  // every keystroke via newCommentText state) doesn't re-walk and re-sort
  // the whole tree — only an actual comments/sort change should pay for it.
  const commentTree = useMemo(
    () => sortComments(buildCommentTree(comments ?? []), sort),
    [comments, sort]
  );

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading comments: {error.message}</div>;
  }

  const visibleComments = showAll
    ? commentTree
    : commentTree.slice(0, VISIBLE_ROOT_COMMENTS);
  const hiddenCount = commentTree.length - visibleComments.length;

  return (
    <div>
      {/* Heading */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              fill="currentColor"
              className="w-4 text-rose-400"
            >
              <path d="M576 304C576 436.5 461.4 544 320 544C282.9 544 247.7 536.6 215.9 523.3L97.5 574.1C88.1 578.1 77.3 575.8 70.4 568.3C63.5 560.8 62 549.8 66.8 540.8L115.6 448.6C83.2 408.3 64 358.3 64 304C64 171.5 178.6 64 320 64C461.4 64 576 171.5 576 304z" />
            </svg>
            <h3 className="text-xl font-semibold text-white">Comments</h3>
            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 font-mono text-[11px] text-neutral-400">
              {comments?.length ?? 0}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {user
              ? "Join the conversation about this entry."
              : "Sign in to read and join the conversation."}
          </p>
        </div>

        {user && commentTree.length > 0 && (
          <CommentSortTabs value={sort} onChange={setSort} />
        )}
      </div>

      {/* Composer */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 transition-colors focus-within:border-rose-400/50 focus-within:ring-1 focus-within:ring-rose-400/20"
        >
          <div className="flex gap-3">
            <UserAvatar
              username={ownProfile?.username ?? "?"}
              avatarUrl={ownProfile?.avatar_url ?? null}
              size="sm"
              linkToProfile={false}
            />
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="comment">
                Add a comment
              </label>
              <textarea
                id="comment"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                placeholder="Share your thoughts..."
                className="min-h-[88px] w-full resize-y bg-transparent py-1 text-sm leading-6 text-white outline-none placeholder:text-neutral-600"
              />
              <div className="mt-2 flex items-center justify-between border-t border-neutral-800 pt-3">
                <p className="text-xs text-neutral-600">
                  Be kind and keep spoilers tagged.
                </p>
                <button
                  type="submit"
                  disabled={!newCommentText.trim() || isPending}
                  className="flex items-center gap-1.5 rounded-md bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  {isPending ? "Posting..." : "Post comment"}
                  {!isPending && <Send className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {isError && (
            <p className="mt-2 text-sm text-red-400">Error posting comment.</p>
          )}
        </form>
      ) : (
        <p className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-500">
          You must be logged in to read or post comments
        </p>
      )}

      {/* Comments Display Section */}
      <div className="mt-6 space-y-3">
        {visibleComments.map((comment) => {
          return (
            <CommentItem
              key={comment.id}
              comment={comment}
              entryId={entryId}
              depth={0}
            />
          );
        })}
      </div>

      {(hiddenCount > 0 || showAll) && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-5 flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-white cursor-pointer"
        >
          {showAll
            ? "Show fewer comments"
            : `View all comments (${commentTree.length})`}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-4 transition-transform ${showAll ? "rotate-180" : ""}`}
          >
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z" />
          </svg>
        </button>
      )}
    </div>
  );
};
