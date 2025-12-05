import React, { useState } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { FeedPost } from '../../../../shared/types/forum.types';
import { VoteButton } from './VoteButton';
import { usePostVote } from '../hooks/usePostVote';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: FeedPost;
  onUpdatePost: (updatedPost: FeedPost) => void;
}

/**
 * PostCard component displays a single post with vote buttons and comments
 */
export const PostCard: React.FC<PostCardProps> = ({ post, onUpdatePost }) => {
  const [showComments, setShowComments] = useState(false);
  const { updatePostOptimistically } = usePostVote();

  const handleVote = async (voteType: 1 | -1 | null) => {
    await updatePostOptimistically(
      post.id,
      voteType,
      (setPosts) => {
        setPosts((prev) => {
          const updated = prev.map((p) => {
            if (p.id === post.id) {
              const updatedPost = { ...p };
              // Calculate new vote score
              const currentVote = p.currentUserVote;
              let delta = 0;
              if (currentVote === null && voteType !== null) {
                delta = voteType;
              } else if (currentVote !== null && voteType === null) {
                delta = -currentVote;
              } else if (currentVote !== null && voteType !== null && currentVote !== voteType) {
                delta = voteType - currentVote;
              }
              updatedPost.voteScore = p.voteScore + delta;
              updatedPost.currentUserVote = voteType;
              onUpdatePost(updatedPost);
              return updatedPost;
            }
            return p;
          });
          return updated;
        });
      }
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

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        {/* Vote section */}
        <div className="flex-shrink-0">
          <VoteButton
            voteScore={post.voteScore}
            currentUserVote={post.currentUserVote}
            onVote={handleVote}
          />
        </div>

        {/* Content section */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span className="font-semibold text-slate-700">r/{post.space.displayName}</span>
            <span>•</span>
            <span>Đăng bởi {post.author.name}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h3>

          {/* Content */}
          <div className="text-slate-700 mb-3 whitespace-pre-wrap">{post.content}</div>

          {/* Images */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="mb-3 grid grid-cols-1 gap-2">
              {post.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url.startsWith('http') ? url : `http://localhost:3001${url}`}
                  alt={`Post image ${index + 1}`}
                  className="w-full rounded border max-h-96 object-contain"
                />
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Bình luận</span>
            </button>
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t">
              <CommentSection postId={post.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

