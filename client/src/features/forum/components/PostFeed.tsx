import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useForum } from '../hooks/useForum';
import { FeedPost } from '../../../../shared/types/forum.types';
import { PostCard } from './PostCard';

/**
 * PostFeed component with pagination (Load More button)
 */
export const PostFeed: React.FC = () => {
  const {
    posts,
    postsLoading,
    postsError,
    hasMore,
    loadMorePosts,
    refreshPosts,
  } = useForum();

  const [updatedPosts, setUpdatedPosts] = useState<FeedPost[]>(posts);

  // Sync with posts from hook
  React.useEffect(() => {
    setUpdatedPosts(posts);
  }, [posts]);

  const handleUpdatePost = useCallback((updatedPost: FeedPost) => {
    setUpdatedPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
  }, []);

  if (postsLoading && updatedPosts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (postsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
        <p>Lỗi: {postsError}</p>
        <Button onClick={refreshPosts} variant="outline" className="mt-2">
          Thử lại
        </Button>
      </div>
    );
  }

  if (updatedPosts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updatedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onUpdatePost={handleUpdatePost}
        />
      ))}

      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            onClick={loadMorePosts}
            variant="outline"
            disabled={postsLoading}
            isLoading={postsLoading}
          >
            {postsLoading ? 'Đang tải...' : 'Tải thêm'}
          </Button>
        </div>
      )}

      {!hasMore && updatedPosts.length > 0 && (
        <div className="text-center py-4 text-slate-500 text-sm">
          Đã hiển thị tất cả bài viết
        </div>
      )}
    </div>
  );
};

