import { useCallback } from 'react';
import { post } from '../../../services/api';
import { ForumComment, VoteType } from '../../../../shared/types/forum.types';

interface UseCommentVoteResult {
  voteComment: (commentId: string, voteType: VoteType | null) => Promise<void>;
  updateCommentOptimistically: (
    commentId: string,
    voteType: VoteType | null,
    setComments: React.Dispatch<React.SetStateAction<ForumComment[]>>
  ) => Promise<void>;
}

/**
 * Hook for voting on comments with Optimistic UI
 * Updates UI immediately, then syncs with server
 */
export function useCommentVote(): UseCommentVoteResult {
  /**
   * Calculate new vote score based on current state and new vote
   */
  const calculateNewVoteScore = useCallback((
    comment: ForumComment,
    newVoteType: VoteType | null,
    currentUserVote: VoteType | null
  ): number => {
    let delta = 0;

    if (currentUserVote === null && newVoteType !== null) {
      // New vote
      delta = newVoteType;
    } else if (currentUserVote !== null && newVoteType === null) {
      // Remove vote
      delta = -currentUserVote;
    } else if (currentUserVote !== null && newVoteType !== null && currentUserVote !== newVoteType) {
      // Change vote (e.g., upvote to downvote)
      delta = newVoteType - currentUserVote;
    }

    return comment.voteScore + delta;
  }, []);

  /**
   * Update comment optimistically and sync with server
   * Note: This assumes comments have a currentUserVote field (may need to extend ForumComment type)
   */
  const updateCommentOptimistically = useCallback(async (
    commentId: string,
    voteType: VoteType | null,
    setComments: React.Dispatch<React.SetStateAction<ForumComment[]>>,
    getCurrentUserVote: (comment: ForumComment) => VoteType | null = () => null
  ): Promise<void> => {
    // 1. Save previous state for revert
    let previousComment: ForumComment | undefined;
    setComments(prev => {
      previousComment = prev.find(c => c.id === commentId);
      return prev;
    });

    if (!previousComment) {
      throw new Error('Comment not found');
    }

    const currentUserVote = getCurrentUserVote(previousComment);

    // 2. Optimistic update - update UI immediately
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const newVoteScore = calculateNewVoteScore(comment, voteType, currentUserVote);
        return {
          ...comment,
          voteScore: newVoteScore,
          // Note: If ForumComment type doesn't have currentUserVote, we'd need to extend it
          // For now, we'll just update the score
        };
      }
      return comment;
    }));

    // 3. Call API in background
    try {
      await post(`/forum/comments/${commentId}/vote`, { voteType });
    } catch (error) {
      // 4. Revert on error
      if (previousComment) {
        setComments(prev => prev.map(comment =>
          comment.id === commentId ? previousComment! : comment
        ));
      }
      throw error;
    }
  }, [calculateNewVoteScore]);

  /**
   * Vote on a comment (convenience wrapper)
   */
  const voteComment = useCallback(async (
    commentId: string,
    voteType: VoteType | null
  ): Promise<void> => {
    await post(`/forum/comments/${commentId}/vote`, { voteType });
  }, []);

  return {
    voteComment,
    updateCommentOptimistically,
  };
}

