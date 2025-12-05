import React, { useState } from 'react';
import { Reply, Clock } from 'lucide-react';
import { ForumComment } from '../../../../shared/types/forum.types';
import { VoteButton } from './VoteButton';
import { useCommentVote } from '../hooks/useCommentVote';

interface CommentItemProps {
  comment: ForumComment;
  postId: string;
  onReply?: (parentId: string) => void;
  level?: number;
}

/**
 * CommentItem component for displaying a comment with nested replies
 */
export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onReply,
  level = 0,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { updateCommentOptimistically } = useCommentVote();

  const handleVote = async (voteType: 1 | -1 | null) => {
    // Note: This is a simplified version. In a real app, you'd need to track
    // currentUserVote for comments (may need to extend ForumComment type)
    await updateCommentOptimistically(
      comment.id,
      voteType,
      (setComments) => {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === comment.id) {
              // Calculate new vote score (simplified - assumes no currentUserVote tracking)
              let delta = 0;
              if (voteType !== null) {
                delta = voteType;
              }
              return {
                ...c,
                voteScore: c.voteScore + delta,
              };
            }
            return c;
          })
        );
      },
      () => null // getCurrentUserVote - simplified, always returns null
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const maxLevel = 5; // Maximum nesting level
  const marginLeft = level > 0 ? level * 16 : 0;

  return (
    <div className="py-3" style={{ marginLeft: `${marginLeft}px` }}>
      <div className="flex gap-3">
        {/* Vote section */}
        <div className="flex-shrink-0">
          <VoteButton
            voteScore={comment.voteScore}
            currentUserVote={null} // Simplified - would need to track this
            onVote={handleVote}
            size="sm"
          />
        </div>

        {/* Content section */}
        <div className="flex-1 min-w-0">
          {/* Author and date */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">User {comment.authorId.substring(0, 8)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(comment.createdAt)}</span>
            </div>
          </div>

          {/* Comment content */}
          <div className="text-slate-700 mb-2 whitespace-pre-wrap">{comment.content}</div>

          {/* Actions */}
          {level < maxLevel && onReply && (
            <button
              onClick={() => {
                setShowReplyForm(!showReplyForm);
                if (!showReplyForm && onReply) {
                  onReply(comment.id);
                }
              }}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Reply className="w-3 h-3" />
              <span>Trả lời</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

