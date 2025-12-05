import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useForum } from '../hooks/useForum';
import { PostFeed } from '../components/PostFeed';
import { CreatePostModal } from '../components/CreatePostModal';

/**
 * ForumPage - Main page for the forum feature
 */
export const ForumPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { spaces, spacesLoading } = useForum();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Diễn đàn</h1>
          <p className="text-slate-600 mt-1">Thảo luận và chia sẻ ý kiến</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo bài viết
        </Button>
      </div>

      {/* Post Feed */}
      <PostFeed />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        spaces={spaces}
      />
    </div>
  );
};

