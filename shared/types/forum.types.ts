export type SpaceType = 'PUBLIC' | 'PRIVATE';
export type SpaceMemberRole = 'ADMIN' | 'MEMBER';
export type VoteTargetType = 'POST' | 'COMMENT';
export type VoteType = 1 | -1; // 1 for upvote, -1 for downvote

export interface ForumSpace {
  id: string;
  name: string; // unique slug
  displayName: string;
  description?: string;
  icon?: string;
  type: SpaceType;
  creatorId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ForumSpaceMember {
  userId: string;
  spaceId: string;
  role: SpaceMemberRole;
  joinedAt: string;
}

export interface ForumPost {
  id: string;
  spaceId: string;
  authorId: string;
  title: string;
  content: string;
  tags?: string[]; // JSON array
  imageUrls?: string[]; // Array of image URLs
  voteScore: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ForumVote {
  id: string;
  userId: string;
  targetId: string;
  targetType: VoteTargetType;
  voteType: VoteType;
  createdAt: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string; // for nested comments
  voteScore: number;
  createdAt: string;
  updatedAt?: string;
}

// Author info for feed
export interface ForumAuthor {
  id: string;
  name: string;
  avatarUrl: string;
  karmaPoints: number;
}

// Space info for feed
export interface ForumSpaceInfo {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
}

// Feed post with additional info
export interface FeedPost {
  id: string;
  spaceId: string;
  authorId: string;
  title: string;
  content: string;
  tags?: string[];
  imageUrls?: string[]; // Array of image URLs
  voteScore: number;
  createdAt: string;
  updatedAt?: string;
  // Additional info from JOINs
  author: ForumAuthor;
  space: ForumSpaceInfo;
  currentUserVote: VoteType | null; // null if user hasn't voted
}

// Request types
export interface CreatePostRequest {
  spaceId: string;
  title: string;
  content: string;
  tags?: string[];
  imageUrls?: string[]; // Array of image URLs (not base64)
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string; // For nested comments
}

export interface VoteRequest {
  voteType: VoteType | null; // 1 for upvote, -1 for downvote, null to remove vote
}

