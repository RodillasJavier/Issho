/**
 * src/components/CommentItem.tsx
 *
 * Card for a single comment and its replies (if any): author, timestamp,
 * content, a Reply action, and a collapsible nested reply thread.
 */
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { UserInfo } from "./UserInfo";

// #region Types
import type { Comment } from "../types/database.types";

interface CommentItemProps {
  comment: Comment & {
    children?: Comment[];
  };
  entryId: string;
}
// #endregion Types

// #region Component Logic
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

const createReply = async (
  replyContent: string,
  entryId: string,
  parentCommentId: string,
  userId?: string
) => {
  if (!userId) {
    throw new Error("You must be logged in to reply.");
  }

  const { error } = await supabase.from("comments").insert({
    entry_id: entryId,
    content: replyContent,
    parent_comment_id: parentCommentId,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const CommentItem = ({ comment, entryId }: CommentItemProps) => {
  const [showReply, setShowReply] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(replyContent, entryId, comment.id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
      setReplyText("");
      setShowReply(false);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload

    if (!replyText) {
      return;
    }

    mutate(replyText);
  };
  // #endregion Component Logic

  // #region Render
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      {/* Author + timestamp */}
      <div className="flex items-start justify-between gap-3">
        {comment.profile && (
          <UserInfo
            username={comment.profile.username}
            avatarUrl={comment.profile.avatar_url}
            size="sm"
          />
        )}

        <span className="shrink-0 text-xs text-neutral-500">
          {formatCommentDate(comment.created_at)}
        </span>
      </div>

      {/* Content */}
      <p className="mt-3 text-sm leading-6 text-neutral-200">
        {comment.content}
      </p>

      {/* Actions */}
      {user && (
        <button
          className="mt-3 rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white cursor-pointer"
          onClick={() => {
            setShowReply((prev) => !prev);
          }}
        >
          {showReply ? "Cancel" : "Reply"}
        </button>
      )}

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
              disabled={!replyText || isPending}
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
      {comment.children && comment.children.length > 0 && (
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
            <div className="mt-2 space-y-2 border-l border-neutral-800 pl-3">
              {comment.children.map((child) => (
                <CommentItem key={child.id} comment={child} entryId={entryId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
// #endregion Render
