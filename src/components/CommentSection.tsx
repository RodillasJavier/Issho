/**
 * src/components/CommentSection.tsx
 *
 * Component for displaying and adding comments to an entry.
 */
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import supabase from "../supabase-client";
import { CommentItem } from "./CommentItem";

// #region Types
import type { Comment } from "../types/database.types";

interface CommentSectionProps {
  entryId: string;
}

interface NewComment {
  content: string;
  parent_comment_id?: string | null;
}
// #endregion Types

const createComment = async (
  newComment: NewComment,
  entryId: string,
  userId?: string
) => {
  if (!userId) {
    throw new Error("You must be logged in to comment.");
  }

  const { error } = await supabase.from("comments").insert({
    entry_id: entryId,
    content: newComment.content,
    parent_comment_id: newComment.parent_comment_id || null,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
};

const fetchComments = async (entryId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      profile:profiles!user_id(id, username, avatar_url)
    `
    )
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Comment[];
};

export const CommentSection = ({ entryId }: CommentSectionProps) => {
  const [newCommentText, setNewCommentText] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Comment[], Error>({
    queryKey: ["comments", entryId],
    queryFn: () => fetchComments(entryId),
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (newComment: NewComment) =>
      createComment(newComment, entryId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload

    if (!newCommentText) {
      return;
    }

    mutate({ content: newCommentText, parent_comment_id: null });

    setNewCommentText("");
  };

  /**
   * Map of comments - comment : parent
   *
   * @param flatComments - Array of top level comments with mappings to their children (replies)
   * @returns Tree object representing all the comment parent relationships
   */
  const buildCommentTree = (
    flatComments: Comment[]
  ): (Comment & { children: Comment[] })[] => {
    const map = new Map<string, Comment & { children: Comment[] }>();
    const roots: (Comment & { children: Comment[] })[] = [];

    flatComments.forEach((comment) => {
      map.set(comment.id, { ...comment, children: [] });
    });

    flatComments.forEach((comment) => {
      if (comment.parent_comment_id) {
        const parent = map.get(comment.parent_comment_id);

        if (parent) {
          parent.children.push(map.get(comment.id)!);
        }
      }

      if (!comment.parent_comment_id) {
        roots.push(map.get(comment.id)!);
      }
    });

    return roots;
  };

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  if (error) {
    console.error(error);
    return <div>Error loading comments: {error.message}</div>;
  }

  const commentTree = comments ? buildCommentTree(comments) : [];

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-2xl">Comments</h3>

      {/* Create Comment Section */}
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

      {/* Comments Display Section */}
      <div className="flex flex-col gap-2">
        {commentTree.map((comment) => {
          return (
            <CommentItem key={comment.id} comment={comment} entryId={entryId} />
          );
        })}
      </div>
    </div>
  );
};
