import { useCallback } from 'react';
import { post } from '../../../services/api';
import { FeedPost, VoteType } from '../../../../shared/types/forum.types';

interface UsePostVoteResult {
  votePost: (postId: string, voteType: VoteType | null) => Promise<void>;
  updatePostOptimistically: (
    postId: string,
    voteType: VoteType | null,
    setPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>
  ) => Promise<void>;
}

/**
 * Hook for voting on posts with Optimistic UI
 * Updates UI immediately, then syncs with server
 */
export function usePostVote(): UsePostVoteResult {
  /**
   * Calculate new vote score based on current state and new vote
   */
  const calculateNewVoteScore = useCallback((
    post: FeedPost,
    newVoteType: VoteType | null
  ): number => {
    const currentVote = post.currentUserVote;
    let delta = 0;

    if (currentVote === null && newVoteType !== null) {
      // New vote
      delta = newVoteType;
    } else if (currentVote !== null && newVoteType === null) {
      // Remove vote
      delta = -currentVote;
    } else if (currentVote !== null && newVoteType !== null && currentVote !== newVoteType) {
      // Change vote (e.g., upvote to downvote)
      delta = newVoteType - currentVote;
    }

    return post.voteScore + delta;
  }, []);

  /**
   * Update post optimistically and sync with server
   */
  const updatePostOptimistically = useCallback(async (
    postId: string,
    voteType: VoteType | null,
    setPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>
  ): Promise<void> => {
    // 1. Save previous state for revert
    let previousPost: FeedPost | undefined;
    setPosts(prev => {
      previousPost = prev.find(p => p.id === postId);
      return prev;
    });

    if (!previousPost) {
      throw new Error('Post not found');
    }

    // 2. Optimistic update - update UI immediately
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newVoteScore = calculateNewVoteScore(post, voteType);
        return {
          ...post,
          voteScore: newVoteScore,
          currentUserVote: voteType,
        };
      }
      return post;
    }));

    // 3. Call API in background
    try {
      await post(`/forum/posts/${postId}/vote`, { voteType });
    } catch (error) {
      // 4. Revert on error
      if (previousPost) {
        setPosts(prev => prev.map(post =>
          post.id === postId ? previousPost! : post
        ));
      }
      throw error;
    }
  }, [calculateNewVoteScore]);

  /**
   * Vote on a post (convenience wrapper)
   */
  const votePost = useCallback(async (
    postId: string,
    voteType: VoteType | null
  ): Promise<void> => {
    // This is a standalone function that doesn't update state
    // Components should use updatePostOptimistically instead
    await post(`/forum/posts/${postId}/vote`, { voteType });
  }, []);

  return {
    votePost,
    updatePostOptimistically,
  };
}

