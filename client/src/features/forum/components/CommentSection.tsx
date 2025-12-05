import React, { useState, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { get, post } from '../../../services/api';
import { ForumComment, CreateCommentRequest } from '../../../../shared/types/forum.types';
import { CommentItem } from './CommentItem';
import { useForum } from '../hooks/useForum';

interface CommentSectionProps {
  postId: string;
}

/**
 * CommentSection component displays comments for a post with nested replies
 */
export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { createComment } = useForum();

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<ForumComment[]>(`/forum/posts/${postId}/comments`);
      setComments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Build nested comment tree
  const buildCommentTree = (comments: ForumComment[]): ForumComment[] => {
    const commentMap = new Map<string, ForumComment & { children?: ForumComment[] }>();
    const rootComments: (ForumComment & { children?: ForumComment[] })[] = [];

    // First pass: create map of all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Second pass: build tree
    comments.forEach((comment) => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(commentWithChildren);
        }
      } else {
        rootComments.push(commentWithChildren);
      }
    });

    return rootComments as ForumComment[];
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    setSubmitting(true);
    try {
      const commentData: CreateCommentRequest = {
        postId,
        content: replyContent.trim(),
        parentId: replyTo,
      };

      await createComment(commentData);
      setReplyContent('');
      setReplyTo(null);
      fetchComments(); // Refresh comments
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post comment';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
  };

  // Render nested comments recursively
  const renderComment = (comment: ForumComment & { children?: ForumComment[] }, level: number = 0) => {
    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          postId={postId}
          onReply={handleReply}
          level={level}
        />
        {comment.children && comment.children.length > 0 && (
          <div className="ml-4 border-l-2 border-slate-200 pl-4">
            {comment.children.map((child) => renderComment(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        {error}
      </div>
    );
  }

  const commentTree = buildCommentTree(comments);

  return (
    <div className="space-y-4">
      {/* Reply form */}
      {replyTo && (
        <form onSubmit={handleSubmitReply} className="mb-4 p-3 bg-slate-50 rounded border">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Viết bình luận..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 mb-2"
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReplyTo(null);
                setReplyContent('');
              }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={submitting || !replyContent.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Gửi
            </Button>
          </div>
        </form>
      )}

      {/* Comments list */}
      {commentTree.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </div>
      ) : (
        <div className="space-y-2">
          {commentTree.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

