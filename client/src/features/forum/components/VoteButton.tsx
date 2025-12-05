import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { VoteType } from '../../../../shared/types/forum.types';

interface VoteButtonProps {
  voteScore: number;
  currentUserVote: VoteType | null;
  onVote: (voteType: VoteType | null) => Promise<void>;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

/**
 * VoteButton component with Optimistic UI
 * Shows upvote/downvote buttons and vote score
 */
export const VoteButton: React.FC<VoteButtonProps> = ({
  voteScore,
  currentUserVote,
  onVote,
  size = 'md',
  disabled = false,
}) => {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: VoteType | null) => {
    if (disabled || isVoting) return;

    // If clicking the same vote, remove it (toggle)
    const newVoteType = currentUserVote === voteType ? null : voteType;

    setIsVoting(true);
    try {
      await onVote(newVoteType);
    } catch (error) {
      console.error('Failed to vote:', error);
      // Error handling is done in the hook (revert optimistic update)
    } finally {
      setIsVoting(false);
    }
  };

  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Upvote button */}
      <button
        onClick={() => handleVote(1)}
        disabled={disabled || isVoting}
        className={`
          ${sizeClasses}
          flex items-center justify-center
          rounded transition-colors
          ${currentUserVote === 1 
            ? 'bg-orange-500 text-white' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-orange-500'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Upvote"
      >
        <ChevronUp className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>

      {/* Vote score */}
      <span className={`font-semibold ${textSize} ${currentUserVote === 1 ? 'text-orange-500' : currentUserVote === -1 ? 'text-blue-500' : 'text-slate-700'}`}>
        {voteScore}
      </span>

      {/* Downvote button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={disabled || isVoting}
        className={`
          ${sizeClasses}
          flex items-center justify-center
          rounded transition-colors
          ${currentUserVote === -1 
            ? 'bg-blue-500 text-white' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-blue-500'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Downvote"
      >
        <ChevronDown className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>
    </div>
  );
};

