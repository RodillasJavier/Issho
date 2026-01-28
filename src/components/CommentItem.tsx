import { useState } from "react";
import type { Comment } from "./CommentSection";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../supabase-client";

interface CommentItemProps {
  comment: Comment & {
    children?: Comment[];
  };
  postId: number;
}

const createReply = async (
  replyContent: string,
  postId: number,
  parentCommentId: number,
  userId?: string
) => {
  if (!userId) {
    throw new Error("You must be logged in to reply.");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: replyContent,
    parent_comment_id: parentCommentId,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const CommentItem = ({ comment, postId }: CommentItemProps) => {
  const [showReply, setShowReply] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(replyContent, postId, comment.id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
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

  return (
    <div className="flex flex-col gap-2 bg-neutral-950 rounded p-2">
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
    </div>
  );
};
