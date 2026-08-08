/**
 * src/components/CommentItem.tsx
 *
 * Card for a single comment and its replies (if any): author, timestamp,
 * content, vote buttons, a Reply action, and a collapsible nested reply
 * thread. Depth-aware: a root comment (depth 0) renders as a full bordered
 * card, while nested replies (depth >= 1) render as a lighter connected
 * treatment — a vertical guideline plus indentation that grows up to a cap —
 * instead of stacking identical full cards ever deeper.
 */
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentVoteButtons } from "./CommentVoteButtons";
import { UserInfo } from "./UserInfo";
import { commentsQueryKey, postComment } from "../services/supabase/comments";
import {
  entriesQueryKey,
  incrementEntryCommentCount,
} from "../services/supabase/entries";

// #region Types
import type { Entry } from "../types/database.types";
import type { CommentNode } from "../utils/comments";

interface CommentItemProps {
  comment: CommentNode;
  entryId: string;
  depth: number;
}
// #endregion Types

// #region Component Logic
/** How far indentation grows with depth before it stops — deep threads keep
 * recursing past this, they just stop pushing content further right. Index 0
 * is unused (the root keeps its full card); the array's own length is the
 * single source of truth for the cap, applied where it's consumed below. */
const NESTED_INDENT = ["", "pl-4", "pl-4", "pl-5", "pl-5", "pl-6"];

const formatCommentDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} · ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

export const CommentItem = ({ comment, entryId, depth }: CommentItemProps) => {
  const [showReply, setShowReply] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      postComment(entryId, user?.id, replyContent, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentsQueryKey(entryId, user?.id),
      });
      queryClient.setQueryData<Entry[]>(entriesQueryKey(user?.id), (old) =>
        incrementEntryCommentCount(old, entryId)
      );
      setReplyText("");
      setShowReply(false);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload

    if (!replyText.trim()) {
      return;
    }

    mutate(replyText.trim());
  };

  const isOwn = !!user && comment.user_id === user.id;
  const isNested = depth >= 1;
  // #endregion Component Logic

  // #region Render
  return (
    <div
      className={
        isNested
          ? `border-l border-neutral-800 ${NESTED_INDENT[Math.min(depth, NESTED_INDENT.length - 1)]} py-2`
          : "rounded-xl border border-neutral-800 bg-neutral-950 p-4"
      }
    >
      {/* Author + timestamp */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {comment.profile && (
            <UserInfo
              username={comment.profile.username}
              avatarUrl={comment.profile.avatar_url}
              size="sm"
            />
          )}
          {isOwn && (
            <span className="rounded-full border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
              You
            </span>
          )}
        </div>

        <span className="shrink-0 text-xs text-neutral-500">
          {formatCommentDate(comment.created_at)}
        </span>
      </div>

      {/* Content */}
      <p className="mt-3 text-sm leading-6 text-neutral-200">
        {comment.content}
      </p>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3">
        <CommentVoteButtons comment={comment} entryId={entryId} />

        {user && (
          <button
            className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white cursor-pointer"
            onClick={() => {
              setShowReply((prev) => !prev);
            }}
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
        )}
      </div>

      {/* Reply composer */}
      {showReply && user && (
        <form
          onSubmit={handleReplySubmit}
          className="mt-2 rounded-lg border border-neutral-800 bg-black/30 p-3 transition-colors focus-within:border-rose-400/50"
        >
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Leave a reply..."
            className="w-full resize-y bg-transparent text-sm leading-6 text-white outline-none placeholder:text-neutral-600"
          />

          <div className="mt-1 flex justify-end">
            <button
              type="submit"
              disabled={!replyText.trim() || isPending}
              className="rounded-md bg-rose-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              {isPending ? "Posting..." : "Post reply"}
            </button>
          </div>

          {isError && (
            <p className="mt-1 text-xs text-red-400">Error posting reply.</p>
          )}
        </form>
      )}

      {/* Replies */}
      {comment.children.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-white cursor-pointer"
          >
            {isCollapsed
              ? `Show replies (${comment.children.length})`
              : "Hide replies"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
            >
              <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z" />
            </svg>
          </button>

          {!isCollapsed && (
            <div className="mt-2 space-y-2">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  entryId={entryId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
// #endregion Render
