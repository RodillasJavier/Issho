/**
 * src/components/CommentItem.tsx
 *
 * Component for displaying a single comment and its replies (if any).
 */
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../supabase-client";

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
    <div className="flex flex-col gap-2 bg-neutral-950 rounded py-2 px-3 border-l-2 border-l-neutral-600">
      <div className="space-y-1">
        <div className="text-sm text-neutral-600">
          {new Date(comment.created_at).toLocaleString()}
        </div>

        <p>{comment.content}</p>

        <button
          className="bg-neutral-900 hover:bg-neutral-800 rounded py-1 px-2 text-sm cursor-pointer transition transition-duration-250"
          onClick={() => {
            setShowReply((prev) => !prev);
          }}
        >
          {showReply ? "Cancel" : "Reply"}
        </button>
      </div>

      {showReply && user && (
        <form onSubmit={handleReplySubmit}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Leave a reply..."
            className="w-full text-sm bg-neutral-950 border border-neutral-900 focus:outline-none rounded px-2 py-1"
          />

          <button
            type="submit"
            disabled={!replyText}
            className="cursor-pointer text-sm rounded bg-rose-500 hover:bg-rose-500/25 border border-rose-500/50 py-1 px-2 transition transition-duration-250"
          >
            {isPending ? "Posting..." : "Post Reply"}
          </button>

          {isError && <p>Error posting reply.</p>}
        </form>
      )}

      {comment.children && comment.children.length > 0 && (
        <div>
          <button onClick={() => setIsCollapsed((prev) => !prev)}>
            {isCollapsed ? (
              <div className="flex items-center">
                <p className="text-sm text-neutral-400">Show Replies</p>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-neutral-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"
                  />
                </svg>
              </div>
            ) : (
              <div className="flex items-center">
                <p className="text-sm text-neutral-400">Hide Replies</p>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  fill="currentColor"
                  className="w-6 h-6 text-neutral-400"
                >
                  <path d="m296-345-56-56 240-240 240 240-56 56-184-184-184 184Z" />
                </svg>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <div className="space-y-2">
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
