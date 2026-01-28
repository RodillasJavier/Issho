import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import supabase from "../supabase-client";

interface CommentSectionProps {
  postId: number;
}

interface NewComment {
  content: string;
  parent_comment_id?: number | null;
}

const createComment = async (
  newComment: NewComment,
  postId: number,
  userId?: string
) => {
  if (!userId) {
    throw new Error("You must be logged in to comment.");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: newComment.content,
    parent_comment_id: newComment.parent_comment_id || null,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user } = useAuth();
  const [newCommentText, setNewCommentText] = useState<string>("");
  const { mutate, isPending, isError } = useMutation({
    mutationFn: (newComment: NewComment) =>
      createComment(newComment, postId, user?.id),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload

    if (!newCommentText) {
      return;
    }

    mutate({ content: newCommentText, parent_comment_id: null });

    setNewCommentText("");
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-2xl">Comments</h3>

      {user ? (
        <form className="space-y-1" onSubmit={handleSubmit}>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
            placeholder="Leave a comment..."
            className="w-full text-md bg-neutral-950 border border-neutral-900 focus:outline-none rounded px-2 py-1"
          />

          <button
            type="submit"
            disabled={!newCommentText}
            className="cursor-pointer rounded bg-rose-500 hover:bg-rose-500/25 border border-rose-500/50 py-1 px-2 transition transition-duration-250"
          >
            {isPending ? "Posting..." : "Post Comment"}
          </button>

          {isError && <p>Error posting comment.</p>}
        </form>
      ) : (
        <p> You must be logged in to post a comment</p>
      )}
    </div>
  );
};
